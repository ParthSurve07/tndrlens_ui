# AI-Based Tender Intelligence & Bid Management Platform

The goal is to build the **AI-Based Tender Intelligence & Bid Management Platform** (Enhanced Edition v2.0). The platform automates the tender evaluation process: extracting information from tender PDFs (with OCR/LLM confidence scores), matching criteria against a company profile (with clause-level explainability), tracking corrigenda/amendments, auto-generating checklists, retrieving similar tenders via vector search, and providing an AI RAG chatbot.

## User Review Required

> [!IMPORTANT]
> To ensure the platform setup matches your preferences, please review the **Open Questions** below and let us know your choices. We recommend using **Tailwind CSS + ShadCN UI** for the frontend, **Python FastAPI** for the backend, and **SQLite + local vector indexing** for the database/retrieval layer to ensure seamless local setup and execution.

## Open Questions

1. **Frontend Styling Preference**: The project proposal specifies *Tailwind CSS* and *ShadCN UI*. Our default guidelines suggest Vanilla CSS unless Tailwind is explicitly requested. 
   - **Options**:
     - *Option A (Recommended)*: Use **Tailwind CSS (v3 or v4)** + **ShadCN UI** (or Tailwind-styled primitives) for a premium, modern dashboard.
     - *Option B*: Use **Vanilla CSS** or **CSS Modules** to build custom styled components.
2. **AI & LLM Integration**:
   - **Options**:
     - *Option A (Recommended)*: Integrate **Google Gemini API** (using `google-genai` SDK) for OCR, information extraction, summary generation, and the RAG chatbot. If no API key is set in `.env`, fall back to a high-fidelity mock LLM engine so the app runs instantly out of the box.
     - *Option B*: Use a different LLM API (e.g., OpenAI, Anthropic).
3. **Primary Backend Stack**: The proposal mentions both *Node.js/Express.js* and *Python/FastAPI*.
   - **Options**:
     - *Option A (Recommended)*: A single **Python (FastAPI)** backend. It is ideal for PDF parsing, NLP text comparisons, vector similarity, and LLM orchestration in a single service.
     - *Option B*: A double-server setup or a **Node.js / Express.js** backend with Python child processes/microservices.
4. **Vector Database / Search**:
   - **Options**:
     - *Option A (Recommended)*: Use **SQLite** for relational data (users, profiles, tenders, checklists, amendments) and a **lightweight local vector search** (e.g. numpy-based cosine similarity with Gemini embeddings or simple local TF-IDF/BM25) to avoid compilation issues with heavy binary databases on macOS.
     - *Option B*: Integrate a dedicated vector database (like Chroma DB or Milvus) or PostgreSQL with `pgvector`.

---

## Proposed Changes

We will structure the project into a monorepo containing a `/frontend` directory and a `/backend` directory inside `/Users/deepak/Desktop/coding/Tender Management`.

```
Tender Management/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI main application
│   │   ├── auth.py            # JWT Authentication & user management
│   │   ├── config.py          # App configuration & env variables
│   │   ├── database.py        # SQLite Database connection
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic validation schemas
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── extractor.py   # LLM text extraction & confidence scoring
│   │   │   ├── eligibility.py # Clause extraction & weighted rule comparison
│   │   │   ├── chatbot.py     # RAG engine & chatbot responder
│   │   │   ├── vector_db.py   # Vector storage & semantic search
│   │   │   └── diff_tracker.py # Amendment/Corrigendum diff tool
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── pdf_parser.py  # PDF text extraction & OCR helper
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/        # Reusable UI elements (Sidebar, Charts, Chat)
│   │   ├── hooks/             # React hooks for API queries (React Query)
│   │   ├── pages/             # Dashboard, TenderDetails, Profile, Login, Landing
│   │   └── services/          # API client calling the backend
│   └── .env.example
└── README.md
```

### Backend (`/backend`)

#### [NEW] [main.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/main.py)
- Main FastAPI entry point setting up routes, CORS, database initializations, and exception handlers.

#### [NEW] [models.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/models.py)
- DB models for `User` (Admin/Company/Manager/Employee roles), `CompanyProfile`, `Tender` (metadata, summary, upload path), `TenderClause` (extracted eligibility criteria), `TenderAmendment` (corrigendum files and summarized diffs), and `DocumentChecklist`.

#### [NEW] [extractor.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/ai/extractor.py)
- Information extraction using LLM structured outputs. Returns fields (e.g. EMD amount, turnover required, experience, submission date) with a confidence score (calculated based on LLM self-eval or token probability/matching quality).

#### [NEW] [eligibility.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/ai/eligibility.py)
- Implements the hybrid weighted rule + ML comparison:
  1. Compares company profile data (turnover, equipment, certifications) with extracted tender criteria.
  2. Applies configured weights (e.g., Financial 35%, Experience 30%, Documents 20%, Technical 15%).
  3. Returns a structured clause-by-clause evaluation table (PASS/FAIL with detailed reason) and an overall score.

#### [NEW] [chatbot.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/ai/chatbot.py)
- Implements a Retrieval-Augmented Generation (RAG) system. Splits tender documents, generates embeddings, index/searches clauses, and constructs LLM prompts contextually, keeping track of references. Includes a precision/recall evaluation script option.

#### [NEW] [diff_tracker.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/ai/diff_tracker.py)
- Parses subsequent versions (addenda/corrigenda) and compares the text chunks with the base document, highlighting changes (such as extended deadlines or modified financial figures) and generating a diff summary.

### Frontend (`/frontend`)

#### [NEW] [App.tsx](file:///Users/deepak/Desktop/coding/Tender%20Management/frontend/src/App.tsx)
- Sets up routes (React Router) for Landing Page, Auth, Dashboard, Tender Details (eligibility breakdown inline), Company Profile, and Analytics (similar-tender comparisons).

#### [NEW] [Dashboard Page](file:///Users/deepak/Desktop/coding/Tender%20Management/frontend/src/pages/Dashboard.tsx)
- High-fidelity dashboard displaying general stats (active bids, eligibility success rate, notifications, recent uploads), visual charts (Recharts) for tender progress, and links to details.

#### [NEW] [TenderDetails Page](file:///Users/deepak/Desktop/coding/Tender%20Management/frontend/src/pages/TenderDetails.tsx)
- Highlights:
  - **Metadata Summary**: summary, deadlines, risk analysis (visual meters for Financial, Tech, Compliance risks).
  - **Clause-Level Eligibility Breakdown**: A clear table showing required criteria vs. company capability, status (pass/fail checkmarks), and explainable justification.
  - **Confidence Indicators**: Visual status tags (High, Med, Low) inline with extracted fields to prompt manual review if needed.
  - **Amendment/Corrigendum Tracker**: Section to upload and view summarized changes side-by-side.
  - **AI Chat Panel**: Sidebar chat UI to query document details directly.

---

## Verification Plan

### Automated Tests
- Unit tests for the eligibility scoring engine comparison logic.
- Integration tests for standard API routes (Auth, Upload, Tender Processing).
- CLI tool to run the RAG accuracy evaluation plan (Precision/Recall).

### Manual Verification
- Upload test tender PDFs (various layouts/pages).
- Update the company profile and check if the eligibility dashboard recalculates and updates explainable clauses.
- Perform a simulated multi-document upload (base tender + amendment PDF) and verify the diff tracker generates summary reports.
- Verify page loading times and responsiveness on multiple device dimensions.
