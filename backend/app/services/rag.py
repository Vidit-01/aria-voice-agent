from __future__ import annotations

from typing import Any

from supabase import Client

from app.core.config import get_settings

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
except Exception:  # pragma: no cover
    GoogleGenerativeAIEmbeddings = None

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


class RagService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.gemini_api_key and GoogleGenerativeAIEmbeddings)

    def _embedder(self) -> GoogleGenerativeAIEmbeddings:
        if not self.enabled:
            raise RuntimeError("RAG embeddings are not configured")
        discovered: list[str] = []
        if genai and self.settings.gemini_api_key:
            try:
                genai.configure(api_key=self.settings.gemini_api_key)
                for m in genai.list_models():
                    methods = set(getattr(m, "supported_generation_methods", []) or [])
                    if "embedContent" not in methods:
                        continue
                    name = getattr(m, "name", "")
                    if name:
                        discovered.append(name.replace("models/", ""))
            except Exception:
                pass
        candidates = [
            self.settings.rag_embed_model,
            "text-embedding-004",
            "models/text-embedding-004",
            "embedding-001",
            "models/embedding-001",
            *discovered,
        ]
        seen: set[str] = set()
        for model_name in candidates:
            if not model_name or model_name in seen:
                continue
            seen.add(model_name)
            try:
                emb = GoogleGenerativeAIEmbeddings(
                    model=model_name,
                    google_api_key=self.settings.gemini_api_key,
                )
                emb.embed_query("healthcheck")
                return emb
            except Exception:
                continue
        raise RuntimeError("No usable Gemini embedding model found for current API key/project")

    def retrieve(self, query: str, supabase: Client) -> list[dict[str, Any]]:
        clean_query = (query or "").strip()
        if not clean_query:
            return []
        if not self.enabled:
            return []

        embedding = self._embedder().embed_query(clean_query)
        resp = supabase.rpc(
            "match_rag_documents",
            {"query_embedding": embedding, "match_count": self.settings.rag_top_k},
        ).execute()
        return resp.data or []

    @staticmethod
    def format_context(chunks: list[dict[str, Any]]) -> str:
        if not chunks:
            return "No external RAG context was retrieved."
        lines: list[str] = []
        for idx, chunk in enumerate(chunks, start=1):
            source = chunk.get("source") or "unknown"
            content = str(chunk.get("content") or "").strip()
            if not content:
                continue
            lines.append(f"[{idx}] Source: {source}\n{content}")
        return "\n\n".join(lines) if lines else "No external RAG context was retrieved."


rag_service = RagService()
