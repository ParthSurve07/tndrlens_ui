import re
from typing import List, Dict, Any, Tuple
import google.generativeai as genai
from app.config import settings

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Splits text into chunks of roughly chunk_size characters with overlap.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def search_relevant_chunks(query: str, chunks: List[str], top_n: int = 3) -> List[Tuple[str, float]]:
    """
    Ranks chunks by keyword matching (simple TF-IDF-like score) for the query.
    Returns the top_n chunks with their score.
    """
    query_words = set(re.findall(r'\w+', query.lower()))
    if not query_words:
        return [(c, 0.0) for c in chunks[:top_n]]
        
    scored_chunks = []
    for chunk in chunks:
        chunk_words = re.findall(r'\w+', chunk.lower())
        if not chunk_words:
            continue
        # Count word match occurrences
        matches = sum(1 for w in chunk_words if w in query_words)
        score = matches / len(query_words)
        scored_chunks.append((chunk, score))
        
    # Sort by score descending
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    return scored_chunks[:top_n]

def ask_tender_chatbot(tender_text: str, query: str) -> Dict[str, Any]:
    """
    Queries the tender text using a simple RAG pipeline.
    Calls Gemini if API key is present, otherwise falls back to a smart local responder.
    """
    chunks = chunk_text(tender_text)
    relevant_chunks_scored = search_relevant_chunks(query, chunks, top_n=3)
    relevant_chunks = [c[0].strip() for c in relevant_chunks_scored if c[1] > 0.0]
    
    # If no keywords matched, just grab first few chunks as fallback context
    if not relevant_chunks:
        relevant_chunks = [c.strip() for c in chunks[:2]]
        
    if settings.GEMINI_API_KEY:
        try:
            return ask_gemini_rag(query, relevant_chunks)
        except Exception as e:
            print(f"Gemini RAG failed: {e}. Falling back to local solver...")
            return ask_locally_rag(query, relevant_chunks)
    else:
        return ask_locally_rag(query, relevant_chunks)

def ask_gemini_rag(query: str, context_chunks: List[str]) -> Dict[str, Any]:
    """
    Generates a response using Gemini based on the retrieval context.
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    context = "\n---\n".join(context_chunks)
    prompt = f"""
    You are an AI Tender Assistant. Answer the user's question using ONLY the provided tender document context.
    If the context does not contain the answer, say "I cannot find this information in the document."
    
    QUESTION:
    {query}
    
    TENDER DOCUMENT CONTEXT:
    {context}
    
    Respond in a helpful, structured markdown format.
    """
    
    response = model.generate_content(prompt)
    
    # We return the top 2 context chunks as the source references
    references = [c[:150] + "..." for c in context_chunks]
    return {
        "answer": response.text,
        "references": references
    }

def ask_locally_rag(query: str, context_chunks: List[str]) -> Dict[str, Any]:
    """
    Offline keyword-based responder. Matches common queries (turnover, EMD, deadlines)
    and constructs a clean output based on context snippets.
    """
    q_low = query.lower()
    answer = ""
    
    # Scan context chunks to find a line with the answer
    found_lines = []
    for chunk in context_chunks:
        for line in chunk.split("\n"):
            if any(kw in line.lower() for kw in ["turnover", "emd", "deadline", "experience", "val", "cost", "date", "iso", "machinery"]):
                # If the line matches keywords in the query, extract it
                if any(kw in q_low for kw in ["turnover", "emd", "deadline", "date", "experience", "certif", "machinery"]):
                    found_lines.append(line.strip())
                    
    # Format answer based on common terms
    if "turnover" in q_low:
        match_lines = [l for l in found_lines if "turnover" in l.lower()]
        if match_lines:
            answer = f"According to the tender document:\n\n* " + "\n* ".join(match_lines[:3])
        else:
            answer = "The turnover requirements could not be explicitly matched in the queried sections, but typical requirements specify average annual financial turnover of at least 30-35% of the tender value."
            
    elif "emd" in q_low or "earnest" in q_low or "security" in q_low:
        match_lines = [l for l in found_lines if any(kw in l.lower() for kw in ["emd", "earnest", "security"])]
        if match_lines:
            answer = f"The Earnest Money Deposit (EMD) requirements stated are:\n\n* " + "\n* ".join(match_lines[:3])
        else:
            answer = "I could not find the exact EMD requirement in the matching document sections. Bidders are advised to check Section 1 / General Tender Info."
            
    elif "deadline" in q_low or "date" in q_low or "submission" in q_low or "due" in q_low:
        match_lines = [l for l in found_lines if any(kw in l.lower() for kw in ["deadline", "date", "submission", "due"])]
        if match_lines:
            answer = f"The critical deadlines listed are:\n\n* " + "\n* ".join(match_lines[:3])
        else:
            answer = "The submission deadline is typically found in the Notice Inviting Tender (NIT) section. Please check the top metadata block on the details page."
            
    elif "experience" in q_low or "completed" in q_low or "work" in q_low:
        match_lines = [l for l in found_lines if any(kw in l.lower() for kw in ["experience", "completed", "contract"])]
        if match_lines:
            answer = f"The experience criteria outlined are:\n\n* " + "\n* ".join(match_lines[:3])
        else:
            answer = "Prior work experience usually requires completing similar civil or construction contracts of values between 50-80% of the estimated cost in the last 5-7 years."
            
    elif "machinery" in q_low or "equipment" in q_low or "tools" in q_low:
        match_lines = [l for l in found_lines if any(kw in l.lower() for kw in ["machinery", "equipment", "plant", "roller", "mixer", "rig"])]
        if match_lines:
            answer = f"The required machinery and assets listed are:\n\n* " + "\n* ".join(match_lines[:3])
        else:
            answer = "The tender specifies key equipment must be owned or leased by the bidder. Please refer to Section 2 (Technical Eligibility) for the detailed asset list."
            
    else:
        # Generic responder combining relevant context
        bullets = []
        for chunk in context_chunks:
            # Get first clean line of chunk
            lines = [l.strip() for l in chunk.split("\n") if len(l.strip()) > 30]
            if lines:
                bullets.append(lines[0])
        
        answer = f"Based on a search of the tender document, here are some relevant excerpts:\n\n* " + "\n* ".join(bullets[:3])
        
    references = [c[:150] + "..." for c in context_chunks]
    return {
        "answer": answer,
        "references": references
    }
