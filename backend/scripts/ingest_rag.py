import argparse
from pathlib import Path
import sys

from supabase import create_client

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import get_settings

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception as exc:  # pragma: no cover
    raise RuntimeError("LangChain dependencies are missing. Install requirements first.") from exc

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


def iter_txt_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path] if path.suffix.lower() == ".txt" else []
    return sorted([p for p in path.rglob("*.txt") if p.is_file()])


def create_embedder_with_fallback(api_key: str, preferred_model: str) -> GoogleGenerativeAIEmbeddings:
    discovered: list[str] = []
    if genai and api_key:
        try:
            genai.configure(api_key=api_key)
            for m in genai.list_models():
                methods = set(getattr(m, "supported_generation_methods", []) or [])
                if "embedContent" not in methods:
                    continue
                name = getattr(m, "name", "")
                if name:
                    discovered.append(name.replace("models/", ""))
        except Exception:
            # keep fallback chain below
            pass

    candidates = [
        preferred_model,
        "text-embedding-004",
        "models/text-embedding-004",
        "embedding-001",
        "models/embedding-001",
        *discovered,
    ]
    seen: set[str] = set()
    last_error: Exception | None = None
    for model_name in candidates:
        if not model_name or model_name in seen:
            continue
        seen.add(model_name)
        try:
            emb = GoogleGenerativeAIEmbeddings(
                model=model_name,
                google_api_key=api_key,
            )
            emb.embed_query("healthcheck")
            print(f"Using embedding model: {model_name}")
            return emb
        except Exception as exc:
            last_error = exc
            continue
    extra = f" Discovered embed-capable models: {discovered}" if discovered else ""
    raise RuntimeError(f"No usable embedding model found. Last error: {last_error}.{extra}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest .txt files into rag_documents")
    parser.add_argument("--dir", required=True, help="Directory OR single .txt file for knowledge ingestion")
    parser.add_argument("--clear", action="store_true", help="Delete existing rag_documents rows before ingest")
    args = parser.parse_args()

    settings = get_settings()
    source_path = Path(args.dir)
    if not source_path.exists():
        raise FileNotFoundError(f"Path not found: {source_path}")

    files = iter_txt_files(source_path)
    if not files:
        print("No .txt files found. Nothing to ingest.")
        return

    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    if args.clear:
        supabase.table("rag_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleared existing rag_documents rows.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
    )
    embedder = create_embedder_with_fallback(settings.gemini_api_key, settings.rag_embed_model)

    total_chunks = 0
    for file_path in files:
        text = file_path.read_text(encoding="utf-8", errors="ignore").strip()
        if not text:
            continue
        chunks = splitter.split_text(text)
        if not chunks:
            continue

        vectors = embedder.embed_documents(chunks)
        source_label = file_path.name if source_path.is_file() else str(file_path.relative_to(source_path))
        rows = []
        for idx, (chunk, vec) in enumerate(zip(chunks, vectors)):
            rows.append(
                {
                    "source": source_label,
                    "chunk_index": idx,
                    "content": chunk,
                    "metadata": {"filename": file_path.name},
                    "embedding": vec,
                }
            )
        supabase.table("rag_documents").insert(rows).execute()
        total_chunks += len(rows)
        print(f"Ingested {len(rows)} chunks from {source_label}")

    print(f"Done. Total chunks inserted: {total_chunks}")


if __name__ == "__main__":
    main()
