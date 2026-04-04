create extension if not exists vector;

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  chunk_index int not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(3072) not null,
  created_at timestamptz not null default now()
);

create index if not exists rag_documents_source_idx on public.rag_documents(source);

create or replace function public.match_rag_documents(
  query_embedding vector(3072),
  match_count int default 4
)
returns table (
  id uuid,
  source text,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    d.id,
    d.source,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.rag_documents d
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
