"""
pgvector-based vector search — replaces the old in-memory scikit-learn index.
Uses PostgreSQL with pgvector extension for persistent embeddings.
"""
import os
from typing import List, Dict, Any, Optional
import numpy as np

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("WARNING: psycopg2 not installed. Vector search disabled.")

from app.config import settings

EMBEDDING_DIM = 768  # text-embedding-004 output dimension


def get_db_connection():
    """Get a PostgreSQL connection."""
    if not PSYCOPG2_AVAILABLE:
        raise RuntimeError("psycopg2 is not installed")
    return psycopg2.connect(settings.DATABASE_URL)


def ensure_vector_table():
    """
    Create the tender_embeddings table with pgvector if it doesn't exist.
    Called on service startup.
    """
    if not PSYCOPG2_AVAILABLE:
        return
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS tender_embeddings (
                    tender_id INTEGER PRIMARY KEY,
                    title TEXT,
                    summary TEXT,
                    embedding vector({EMBEDDING_DIM})
                );
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS tender_embeddings_vector_idx
                ON tender_embeddings
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 10);
            """)
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"Warning: Could not create vector table: {e}")


def get_embedding(text: str) -> Optional[np.ndarray]:
    """
    Generate a text embedding using Gemini text-embedding-004.
    Falls back to None if API unavailable (similarity search will be skipped).
    """
    if not GENAI_AVAILABLE or not settings.GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text[:10000],
            task_type="retrieval_document"
        )
        return np.array(result['embedding'], dtype=np.float32)
    except Exception as e:
        print(f"Embedding API error: {e}")
        return None


def add_tender_embedding(tender_id: int, title: str, summary: str, full_text: str):
    """
    Compute and store embedding for a tender in pgvector.
    Called after successful tender analysis.
    """
    if not PSYCOPG2_AVAILABLE:
        return
    embedding = get_embedding(f"{title} {summary}")
    if embedding is None:
        return
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            embedding_list = embedding.tolist()
            cur.execute("""
                INSERT INTO tender_embeddings (tender_id, title, summary, embedding)
                VALUES (%s, %s, %s, %s::vector)
                ON CONFLICT (tender_id) DO UPDATE
                    SET title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        embedding = EXCLUDED.embedding;
            """, (tender_id, title, summary, str(embedding_list)))
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error storing embedding for tender {tender_id}: {e}")


def get_similar_tenders(tender_id: int, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Find the top-N most similar tenders using pgvector cosine similarity.
    Returns list of {tender_id, title, summary, similarity_score}.
    """
    if not PSYCOPG2_AVAILABLE:
        return []
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get the target tender's embedding
            cur.execute(
                "SELECT embedding FROM tender_embeddings WHERE tender_id = %s",
                (tender_id,)
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return []

            # Use pgvector's <=> (cosine distance) operator; 1 - distance = similarity
            cur.execute("""
                SELECT
                    tender_id,
                    title,
                    summary,
                    ROUND(CAST((1 - (embedding <=> %s::vector)) * 100 AS NUMERIC), 1) AS similarity_score
                FROM tender_embeddings
                WHERE tender_id != %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
            """, (row['embedding'], tender_id, row['embedding'], limit))

            results = [dict(r) for r in cur.fetchall()]
        conn.close()
        return results
    except Exception as e:
        print(f"Error finding similar tenders: {e}")
        return []
