# VedaAI — AI Assessment Creator

An AI-powered full-stack application that generates structured, printable question papers from configurable parameters. Built with **Next.js**, **Django**, **Celery**, **Redis**, **Django Channels**, and **Google Gemini AI**.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Assignment   │  │ Redux Store  │  │  WebSocket  │  │ ExamPaper │ │
│  │ Form (Zod)  │──│ (RTK Slice)  │──│  Hook       │  │ + PDF     │ │
│  └──────┬──────┘  └──────────────┘  └──────┬──────┘  └───────────┘ │
│         │ POST /api/assignments/            │ ws://                 │
└─────────┼──────────────────────────────────┼───────────────────────┘
          │                                   │
┌─────────┼──────────────────────────────────┼───────────────────────┐
│         ▼          BACKEND (Django)         ▼                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐               │
│  │ DRF Views   │  │ Celery Task  │  │  Channels   │               │
│  │ (REST API)  │──│ (Background) │──│  Consumer   │               │
│  └──────┬──────┘  └──────┬───────┘  └─────────────┘               │
│         │                │                                          │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌─────────────┐               │
│  │  SQLite DB  │  │ Gemini AI    │  │   Redis     │               │
│  │ (Models)    │  │ (LLM API)    │  │  (Broker)   │               │
│  └─────────────┘  └──────────────┘  └─────────────┘               │
└────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | Next.js 16, TypeScript, Tailwind CSS v4                 |
| State Mgmt     | Redux Toolkit (RTK)                                     |
| Form Handling  | React Hook Form + Zod validation                        |
| Backend        | Django 6, Django REST Framework                         |
| Task Queue     | Celery 5.6 + Redis (Docker)                             |
| WebSockets     | Django Channels + InMemoryChannelLayer                   |
| AI Engine      | Google Gemini 2.5 Flash (via `google-genai` SDK)        |
| PDF Export     | html2pdf.js (client-side, captures styled DOM)          |
| Database       | SQLite (dev) — swap to PostgreSQL for production        |

---

## Project Structure

```
VedaAI/
├── backend/
│   ├── config/               # Django project config
│   │   ├── settings.py       # All service configs (Celery, Channels, Gemini)
│   │   ├── celery.py         # Celery app instance
│   │   ├── asgi.py           # ASGI with WebSocket routing
│   │   └── urls.py           # Root URL config → /api/
│   ├── assessments/          # Main app
│   │   ├── models.py         # Assignment + GeneratedPaper models
│   │   ├── serializers.py    # DRF serializers with validation
│   │   ├── views.py          # POST /assignments/ + GET /status/
│   │   ├── tasks.py          # Celery task with Gemini integration
│   │   ├── consumers.py      # WebSocket consumer
│   │   ├── routing.py        # WebSocket URL routing
│   │   ├── llm_utils.py      # JSON parsing from LLM output
│   │   └── admin.py          # Admin panel registration
│   └── .env                  # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── create/       # Assignment creation page
│   │   │   └── globals.css   # Design tokens + print styles
│   │   ├── components/       # UI components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── ExamPaper.tsx  # Printable paper layout
│   │   │   └── StepperInput.tsx
│   │   ├── store/            # Redux store + slices
│   │   ├── hooks/            # useAssignmentSocket (WS + polling)
│   │   ├── lib/              # Zod validation schema
│   │   └── types/            # Type declarations
│   └── .env.local            # Frontend env vars
│
└── .ai-docs/                 # Agent docs (gitignored)
```

---

## Setup Instructions

### Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **Docker** (for Redis)
- **Google Gemini API Key** — get one free at [aistudio.google.com](https://aistudio.google.com/)

### 1. Clone & Install

```bash
git clone <repo-url>
cd VedaAI-Assignment
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers python-dotenv
pip install celery redis daphne channels
pip install google-genai

# Configure environment
cd VedaAI/backend
# Edit .env and set your GEMINI_API_KEY
```

**`.env` file:**
```env
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:3000
GEMINI_API_KEY=<your-gemini-api-key>
```

```bash
# Run migrations
python manage.py migrate

# Create superuser (optional, for admin panel)
python manage.py createsuperuser
```

### 3. Start Redis (Docker)

```bash
docker run -d --name vedaai-redis -p 6379:6379 redis:alpine
```

### 4. Start Backend Services

Open **three terminals** in `VedaAI/backend/`:

```bash
# Terminal 1: Django server
python manage.py runserver 8000

# Terminal 2: Celery worker
celery -A config worker --loglevel=info --pool=solo

# Terminal 3 (optional): Celery beat for scheduled tasks
celery -A config beat --loglevel=info
```

### 5. Frontend Setup

```bash
cd VedaAI/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/api/assignments/`                   | Create assignment → 202 + ID  |
| GET    | `/api/assignments/<id>/status/`       | Poll status + paper (fallback) |
| WS     | `ws://localhost:8000/ws/assignments/<id>/` | Real-time generation updates  |

### POST Request Body

```json
{
  "due_date": "2026-06-15",
  "question_types": [
    { "type": "MCQ", "count": 5, "marks_per_question": 2 },
    { "type": "Short Questions", "count": 3, "marks_per_question": 5 }
  ],
  "additional_instructions": "Focus on chapter 5"
}
```

### WebSocket Events

| Event                | Direction | Payload                                    |
| -------------------- | --------- | ------------------------------------------ |
| `generation_complete`| Server→Client | `{ status, paper: {...} }`             |
| `generation_failed`  | Server→Client | `{ status, error: "..." }`             |

---

## Features

- **AI-Powered Generation** — Gemini 2.5 Flash generates structured question papers
- **Real-time Updates** — WebSocket pushes completion events; auto-falls back to HTTP polling
- **PDF Export** — Download styled exam papers as A4 PDFs
- **Print Support** — Clean print layout with hidden UI chrome
- **Regenerate** — One-click to generate a new paper with the same parameters
- **Form Validation** — Zod schema with positive integer enforcement and required field checks
- **Retry Logic** — Celery retries up to 2x on JSON parse failures
- **Figma-Accurate UI** — Bricolage Grotesque font, pill inputs, gradient backgrounds

---

## License

MIT
