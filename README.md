# AI-Based Tender Intelligence & Bid Management Platform

The project has been organized into a clean, 2-folder structure:

```
├── backend/                  # FastAPI backend service (Python)
│   ├── app/                  # Application code (AI, Auth, DB, Models, Schemas, API)
│   ├── archive/              # Archived experiments (backend-nest, ai-service, docker setup)
│   ├── docs/                 # Platform specification & architectural documents
│   ├── uploads/              # Tender & vault document storage
│   ├── tender_management.db  # SQLite database
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment
└── frontend/                 # React 19 + Vite + Tailwind CSS frontend
    ├── src/                  # React pages, components, and API service
    ├── archive/              # Archived experiments (frontend-next)
    └── package.json          # Frontend dependencies & scripts
```

---

## 🚀 How to Run the Project

### 1. Backend (FastAPI)
```bash
cd backend
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API URL:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React + Vite)
```bash
cd frontend
pnpm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Credentials
- **Admin:** `admin` / `admin123` (admin@buildcorp.com)
- **Company Manager:** `company` / `company123` (manager@buildcorp.com)