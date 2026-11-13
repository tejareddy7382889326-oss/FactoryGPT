# FactoryGPT – AI-Powered Industrial Maintenance Assistant

FactoryGPT is an enterprise-grade AI assistant designed for factory engineers, maintenance technicians, and plant operators. It utilizes Retrieval-Augmented Generation (RAG) to query machine manuals, SOPs, equipment troubleshooting guides, and error logs with strict zero-hallucination compliance.

---

## 🌟 Key Features

1. **Strict RAG Zero-Hallucination Engine**:
   - Responds *only* using information retrieved from uploaded factory documentation.
   - Exact fallback phrasing when information is absent: `"I couldn't find this information in the uploaded factory documentation."`
   - Explicit inline source document citations `[Document: <name>, Page: <page_no>]`.

2. **OpenRouter API Integration**:
   - Supports model switching directly from the UI header.
   - Default Model: `deepseek/deepseek-chat-v3`.
   - Supported Models: Claude 3.5 Sonnet, GPT-4o Mini, Llama 3.3 70B, Gemini 2.0 Flash.

3. **Document Repository & Vector Knowledge Base**:
   - Supports uploading PDF, DOCX, TXT, and LOG files.
   - Extract text with PyMuPDF & python-docx, chunking, and embedding generation via `BAAI/bge-small-en-v1.5`.
   - Persistent ChromaDB vector storage with top-K similarity search (K=5).
   - Document management: Upload, Delete, Preview, Re-index.

4. **Modern Industrial ChatGPT-Style UI**:
   - Responsive dark industrial theme with cyan/emerald accents and glassmorphism.
   - Conversation history sidebar with instant search and multi-session persistence.
   - Markdown rendering, code blocks, copy answer button, stop generation button (AbortController).
   - Interactive Citation Badges showing document matching percentages and content snippets.
   - Preset industrial prompt shortcuts (*"Why is Machine A overheating?"*, *"What does Error E102 mean?"*, *"How do I replace conveyor belt?"*).

5. **PDF Maintenance & Troubleshooting Reports**:
   - Export structured PDF reports containing technician field notes, machine IDs, and AI diagnosis transcripts using ReportLab.

6. **Enterprise Security & Auth**:
   - JWT Token Authentication with SQLite database.
   - Environment variable management (`.env`).
   - Prepared for production with Docker & Docker Compose.

---

## 📂 Project Directory Structure

```
FactoryGPT/
├── backend/
│   ├── app/
│   │   ├── config.py           # App settings & OpenRouter configuration
│   │   ├── database.py         # SQLite connection & session maker
│   │   ├── models.py           # User, Document, Conversation, Message models
│   │   ├── schemas.py          # Request/Response Pydantic models
│   │   ├── rag/
│   │   │   ├── parser.py       # Document extractors (PDF, DOCX, TXT)
│   │   │   ├── embedder.py     # SentenceTransformers embedding loader
│   │   │   ├── vector_store.py # ChromaDB manager (add, delete, search, clear)
│   │   │   └── pipeline.py     # RAG chain, OpenRouter API call, strict system prompt
│   │   ├── routes/
│   │   │   ├── auth.py         # Register, Login, User profile
│   │   │   ├── documents.py    # Upload, Delete, List, Preview, Re-index
│   │   │   ├── chat.py         # RAG Query, Streaming, History, Preset prompts
│   │   │   ├── reports.py      # PDF Maintenance & Troubleshooting Report generator
│   │   │   └── admin.py        # System stats, vector index rebuild & wipe
│   │   ├── utils/
│   │   │   ├── auth_utils.py   # Password hashing & JWT tokens
│   │   │   └── pdf_generator.py# ReportLab PDF report generation helper
│   │   └── main.py             # FastAPI entrypoint & middleware
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Navigation sidebar with industrial styling
│   │   │   ├── Navbar.jsx      # Top header with stats & model selector
│   │   │   ├── ModelSelector.jsx # OpenRouter model picker
│   │   │   ├── PdfViewerModal.jsx # Inline PDF document preview
│   │   │   └── CitationBadge.jsx  # Interactive source citation viewer
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Auth state & tokens
│   │   │   └── ThemeContext.jsx# Dark theme state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Stats, quick actions, recent activity
│   │   │   ├── ChatScreen.jsx  # ChatGPT-style maintenance chat UI
│   │   │   ├── UploadScreen.jsx# Document upload & KB management
│   │   │   ├── ReportsScreen.jsx# PDF report generation UI
│   │   │   ├── AdminScreen.jsx  # Knowledge base management & rebuild
│   │   │   ├── Login.jsx       # Login page
│   │   │   └── Register.jsx    # User registration page
│   │   ├── services/
│   │   │   └── api.js          # Axios API client setup
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # TailwindCSS custom dark industrial styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docs/                       # Pre-populated sample factory documents
│   ├── CNC_Milling_Machine_Manual.txt
│   ├── Conveyor_Belt_Maintenance_SOP.txt
│   └── Industrial_Error_Codes_Troubleshooting.txt
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── README.md
└── .env
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- OpenRouter API Key (`OPENROUTER_API_KEY`)

### 2. Environment Configuration
Verify that `.env` contains your OpenRouter API key:
```env
OPENROUTER_API_KEY=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
DEFAULT_MODEL=deepseek/deepseek-chat-v3
DATABASE_URL=sqlite:///./factorygpt.db
CHROMA_PERSIST_DIR=./vector_db
UPLOADS_DIR=./uploads
REPORTS_DIR=./reports
JWT_SECRET=factorygpt_super_secret_jwt_key_2026_industrial_rag
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI application server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI backend runs on `http://localhost:8000`. API interactive Swagger documentation is available at `http://localhost:8000/docs`.

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
The React frontend application runs on `http://localhost:3000`.

---

## 🐳 Docker Deployment

To launch the full-stack application using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🔐 Demo Credentials

- **Email**: `admin@factorygpt.io`
- **Password**: `password123`
- *(Or click "Register New Engineer Account" on the login screen)*
