from apps.ai.vector_store import get_embedding_model, get_supabase_client

MAX_MESSAGES = 50


def add_message(user_id: int, session_id: str, role: str, content: str):
    if not session_id or not user_id:
        return
    supabase = get_supabase_client()
    embedder = get_embedding_model()
    vector = embedder.embed_query(content)

    supabase.table("chat_memory").insert(
        {
            "user_id": str(user_id),
            "session_id": session_id,
            "role": role,
            "content": content,
            "embedding": vector,
        }
    ).execute()


def get_history(user_id: int, session_id: str, limit: int = MAX_MESSAGES):
    if not session_id or not user_id:
        return []
    supabase = get_supabase_client()
    result = (
        supabase.table("chat_memory")
        .select("role, content, created_at")
        .eq("user_id", str(user_id))
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    if not result.data:
        return []
    return [{"role": row["role"], "content": row["content"]} for row in result.data]


def search_memory(user_id: int, session_id: str, query: str, k: int = 5):
    if not session_id or not user_id or not query:
        return []

    supabase = get_supabase_client()
    embedder = get_embedding_model()
    query_vec = embedder.embed_query(query)

    try:
        result = supabase.rpc(
            "match_chat_memory",
            {
                "query_embedding": query_vec,
                "match_count": k,
                "filter": {"user_id": str(user_id), "session_id": session_id},
            },
        ).execute()
    except Exception:
        return []

    if not result.data:
        return []

    return [
        {
            "content": row.get("content", ""),
            "role": row.get("role", "user"),
            "score": row.get("similarity", 0),
        }
        for row in result.data
    ]
