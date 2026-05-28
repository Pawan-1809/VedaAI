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
│  │ (Models)    │  │ (Multimodal) │  │  (Broker)   │               │
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
| WebSockets     | Django Channels + Redis Channel Layer                   |
| AI Engine      | Google Gemini 2.5 Flash (Multimodal — text + images)    |
| PDF Export     | html2pdf.js (client-side, captures styled DOM)          |
| Database       | SQLite (dev) — PostgreSQL in production                 |

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
│   │   ├── tasks.py          # Celery task with Gemini multimodal integration
│   │   ├── consumers.py      # WebSocket consumer
│   │   ├── routing.py        # WebSocket URL routing
│   │   ├── llm_utils.py      # JSON parsing from LLM output
│   │   └── admin.py          # Admin panel registration
│   └── .env                  # Environment variables
│   └── requirements.txt      # Backend dependencies
│   └── Dockerfile            # Backend container image
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── create/       # Assignment creation page
│   │   │   ├── assignments/  # Assignments listing (card grid)
│   │   │   ├── login/        # Login page
│   │   │   └── globals.css   # Design tokens + print styles
│   │   ├── components/       # UI components
│   │   │   ├── Sidebar.tsx   # Desktop sidebar + mobile nav
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── ExamPaper.tsx # Printable paper layout
│   │   │   └── StepperInput.tsx
│   │   ├── store/            # Redux store + slices
│   │   ├── hooks/            # useAssignmentSocket (WS + polling)
│   │   ├── lib/              # Zod validation schema + API client
│   │   └── types/            # Type declarations
│   └── .env.local            # Frontend env vars
│
├── docker-compose.yml        # Backend + worker + Redis
└── .gitignore
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
pip install -r VedaAI/backend/requirements.txt

# Configure environment
cd VedaAI/backend
# Edit .env and set your GEMINI_API_KEY
```

**`.env` file:**
```env
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
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

## Deployment

### Frontend (Vercel)

1. Import the repo into Vercel.
2. Set the project root to `VedaAI/frontend`.
3. Configure environment variables:
  - `NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL/api`
  - `NEXT_PUBLIC_WS_URL=wss://YOUR-BACKEND-URL/ws`
4. Build command: `npm run build`
5. Output: `.next`

### Backend (Docker or PaaS)

Use `docker-compose.yml` for local production-like setup, or deploy the backend + worker on Render/Railway.

**Required environment variables:**

- `SECRET_KEY` (set a strong value)
- `DEBUG=False`
- `ALLOWED_HOSTS=YOUR-BACKEND-URL`
- `DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require`
- `REDIS_URL=redis://HOST:PORT/0`
- `CORS_ALLOWED_ORIGINS=https://YOUR-VERCEL-URL`
- `CSRF_TRUSTED_ORIGINS=https://YOUR-VERCEL-URL`
- `GEMINI_API_KEY=...`

### Docker Compose (backend + worker + Redis)

```bash
cd VedaAI
docker compose up --build
```

---

## API Endpoints

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/api/assignments/`                   | Create assignment → 202 + ID  |
| GET    | `/api/assignments/recent/?limit=20`   | Recent completed papers        |
| GET    | `/api/assignments/<id>/status/`       | Poll status + paper (fallback) |
| DELETE | `/api/assignments/<id>/`              | Delete an assignment           |
| WS     | `ws://localhost:8000/ws/assignments/<id>/` | Real-time generation updates  |
| POST   | `/api/auth/login/`                    | Log in and receive token       |
| POST   | `/api/auth/logout/`                   | Log out (token required)       |

### POST Request Body (multipart/form-data)

```
due_date: "2026-06-15"
question_types: '[{"type":"MCQ","count":5,"marks_per_question":2}]'
additional_instructions: "Focus on chapter 5"
uploaded_file: <image file> (optional)
```

### WebSocket Events

| Event                | Direction | Payload                                    |
| -------------------- | --------- | ------------------------------------------ |
| `generation_complete`| Server→Client | `{ status, paper: {...} }`             |
| `generation_failed`  | Server→Client | `{ status, error: "..." }`             |

---

## Features

- **Multimodal AI Generation** — Upload reference images/documents and Gemini generates contextual questions from them
- **Real-time Updates** — WebSocket pushes completion events; auto-falls back to HTTP polling
- **PDF Export** — Download styled exam papers as A4 PDFs
- **Print Support** — Clean print layout with hidden UI chrome
- **Regenerate** — One-click to generate a new paper with the same parameters
- **Answer Key** — Generated answer key with toggle visibility
- **Assignments Dashboard** — Card grid with search, filter, and context-menu actions (View/Delete)
- **Mobile Responsive** — Bottom navigation bar, top header, and full mobile-optimized layouts
- **Login / Logout** — Token-based auth endpoints + UI
- **Form Validation** — Zod schema with positive integer enforcement and required field checks
- **Retry Logic** — Celery retries up to 2x on JSON parse failures
- **Empty State** — Figma-accurate empty state with illustration on assignments page

---

## Approach

1. **Form → API**: User fills the assignment creation form (file upload, due date, question types, instructions). On submit, form data is sent as `multipart/form-data` to the Django REST API, which saves the assignment and enqueues a Celery background task.

2. **Background Generation**: The Celery worker picks up the task, constructs a structured prompt for Gemini 2.5 Flash. If an image was uploaded, it uses Gemini's multimodal capabilities to include the image alongside the text prompt, ensuring questions are contextually relevant.

3. **Real-time Delivery**: Once generation completes, the result is stored in the database and pushed to the frontend via Django Channels WebSocket. If WebSocket fails, the frontend falls back to HTTP polling.

4. **Structured Output**: The LLM response is parsed from JSON, validated for correct structure (sections → questions → marks/difficulty), and rendered in a clean, printable exam paper layout with institution header, student info fields, section-wise questions with difficulty tags, and an answer key.

---

## License

MIT
