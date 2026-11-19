# VolunteerMatch AI — Universal Volunteer & Event Discovery Platform

VolunteerMatch AI is a full-stack volunteer discovery and event coordination platform for **every kind of event** — concerts, college fests, cultural events, carnivals, government campaigns, sports and marathons, NGO causes, political and civic forums, conferences, community initiatives, environmental drives and workshops.

Volunteers can discover opportunities, receive explainable AI matches, apply, get scheduled, complete tasks and build verified participation history. Organizers can publish events, set requirements, review applicants, assign tasks, verify hours and track analytics. Administrators manage users, organizations and listings.

> **Academic prototype:** All seeded listings are clearly labelled **Demo** and are not confirmed real-world events. Only the local demo database is affected by applications and participation data.

---

## Single-service Render deployment

The root-level `render.yaml` configures one Python web service. The FastAPI process serves both the API and the built Vite application from the same origin; Vite assets are served under `/assets`, and client-side routes fall back to `index.html`. Unknown API routes remain JSON 404 responses.

Create a persistent PostgreSQL database in Render (or use an existing reachable PostgreSQL instance) and set these web-service environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Render PostgreSQL internal URL preferred. `postgres://` and `postgresql://` URLs are normalized to the psycopg 3 driver. |
| `SECRET_KEY` | Yes | Render Blueprint generates a secret. If configuring manually, use a cryptographically random value of at least 32 characters. |
| `ENVIRONMENT` | Yes | Set to `production`; production startup rejects the development secret and SQLite. |
| `SEED_DEMO_DATA` | Yes | Set to `false` so production does not create predictable demo accounts. |
| `OPENAI_API_KEY` | Optional | Needed only for the external OpenAI-compatible assistant provider. |
| `OPENAI_BASE_URL` | Optional | OpenAI-compatible API base URL; defaults to OpenAI. |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-4o-mini`. |
| `CORS_ORIGINS` | Optional | Comma-separated trusted origins for cross-origin clients. Same-origin deployment does not require CORS. |
| `ALGORITHM` | Optional | JWT signing algorithm; defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | JWT lifetime; defaults to 1440. |
| `MATCH_WEIGHTS` | Optional | JSON weights for matching factors; defaults to the documented 30/20/15/10/10/10/5 baseline. |

Do not configure `VITE_API_BASE_URL` on Render for this single-origin setup. Frontend variables are bundled into public browser assets; never put credentials or provider secrets in `VITE_*` variables.

Render settings (repository root as the service root directory):

```sh
Build Command: cd frontend && npm ci --include=dev && npm run build && cd ../backend && pip install -r requirements.txt
Start Command: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The startup path applies the existing additive schema update and creates missing tables without dropping data. The frontend build must complete before Uvicorn starts. The Render free web tier may spin down while idle; use a persistent PostgreSQL database because local filesystem storage is not durable.

Production deployment still requires configuring a persistent PostgreSQL instance and (if desired) an OpenAI API key. The current schema startup logic is not a versioned Alembic migration workflow.

With demo seeding disabled, create the first administrator once after the service has initialized the database: open a Render shell (or a trusted machine with private database access), enter `backend`, and run `python -m app.seed.bootstrap_admin`. The command prompts for the administrator email, name and a hidden password; it refuses to create duplicate accounts or a second initial administrator. Do not enable demo seeding in production to obtain an admin account.

---

## Highlights

- **Premium public experience** — navy/emerald visual identity, editorial hero, photography-led category cards, live database statistics, featured opportunities and search filters.
- **12-category taxonomy** — Concerts & Music Festivals, College Fests, Cultural Events, Carnivals & Exhibitions, Government Events, Sports & Marathons, NGOs & Social Causes, Political Events, Conferences & Summits, Community Initiatives, Environmental Campaigns, Workshops & Seminars.
- **Explainable recommendations** — configurable weighted scoring across skills (30), interests (20), availability (15), location (10), experience (10), profession (10) and preferences (5), plus TF-IDF cosine similarity and matched/missing skills.
- **Volunteer onboarding** — persistent profile sections for personal, professional, skills, availability, address and preference data, completion progress, declarations and timestamped consent.
- **Persistent notifications** — event-generated application and high-match notifications, unread controls and 30-second polling with a notification center.
- **Contact privacy** — organizer profile access is denied before application approval and sharing consent; residential address and date of birth are not disclosed to organizers.
- **Three roles with RBAC** — volunteer, organizer (`ngo` in the API enum) and admin, protected end to end.
- **Complete workflow** — opportunity publishing, applications, capacity-safe approvals, schedules with conflict warnings, event-day tasks, verified participation hours, feedback and saved opportunities.
- **Organizer analytics** — real applicant, opportunity and participation metrics from the database.
- **Assistant** — platform-aware chat helper for volunteers and organizers.
- **Tested backend** — pytest suite covering auth, roles, matching, applications and the end-to-end API flow.

---

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts   |
| Backend  | FastAPI, SQLAlchemy 2, Pydantic, JWT (python-jose), passlib bcrypt |
| Database | PostgreSQL in production; SQLite for local development             |
| Testing  | Pytest + FastAPI TestClient                                       |

---

## Project Structure

```
VolunteerMatch_AI_Project/
├─ backend/
│  ├─ app/
│  │  ├─ api/routers/          # auth, users, profiles, opportunities, matching,
│  │  │                        # applications, schedules, tasks, participation,
│  │  │                        # feedback, saved, analytics, assistant
│  │  ├─ core/                 # settings and security helpers
│  │  ├─ db/                   # engine, session, base
│  │  ├─ models/               # SQLAlchemy models
│  │  ├─ schemas/              # Pydantic request/response schemas
│  │  ├─ seed/seed_data.py     # demo users, organizations and events
│  │  └─ main.py               # FastAPI app and startup seeding
│  ├─ tests/test_api_flow.py   # end-to-end API tests
│  └─ dev.db                   # created automatically on first run
├─ frontend/
│  ├─ src/
│  │  ├─ pages/public/         # landing, discovery, detail, login, register, about
│  │  ├─ pages/volunteer/      # dashboard, explore, recommendations, applications...
│  │  ├─ pages/ngo/            # organizer dashboard, events, applicants, tasks...
│  │  ├─ pages/admin/          # platform administration
│  │  ├─ components/           # UI primitives and shared opportunity card
│  │  ├─ data/eventCategories.ts
│  │  └─ layouts/
│  └─ tailwind.config.js
├─ legacy_prototype/           # original static prototype (archived)
└─ README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+ (tested with the project virtual environment)
- Node.js 18+ and npm

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The database schema is created automatically on startup. Demo data is seeded by default in development; set `SEED_DEMO_DATA=false` in production.

- API: <http://127.0.0.1:8000>
- Interactive docs: <http://127.0.0.1:8000/docs>
- Public stats: <http://127.0.0.1:8000/analytics/public>
- Category counts: <http://127.0.0.1:8000/analytics/categories>

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. In development, Vite proxies API requests to `http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` only when intentionally using a separate API origin; leave it unset for same-origin production deployments.

### Reset the demo database

Stop the backend, delete `backend/dev.db`, then start the backend again. The seed data is recreated automatically.

---

## Demo Accounts

All seeded accounts use the same password pattern below. Organizer accounts share the `Ngo@123` password.

| Role              | Email                          | Password       | Account                                   |
| ----------------- | ------------------------------ | -------------- | ----------------------------------------- |
| Volunteer         | `volunteer@volunteermatch.ai`  | `Volunteer@123`| Arpit Singh                               |
| Organizer / NGO   | `ngo1@volunteermatch.ai`       | `Ngo@123`      | Udaan Welfare Foundation                  |
| Organizer / NGO   | `ngo2@volunteermatch.ai`       | `Ngo@123`      | GreenEarth NCR Initiative                 |
| Organizer / NGO   | `ngo3@volunteermatch.ai`       | `Ngo@123`      | Sanjeevani Care Trust                     |
| Organizer / NGO   | `ngo4@volunteermatch.ai`       | `Ngo@123`      | HopeBridge Learning                       |
| Organizer / Event | `events@volunteermatch.ai`     | `Ngo@123`      | NCR Live Events                           |
| Organizer / Campus| `campus@volunteermatch.ai`     | `Ngo@123`      | Symbiosis Institute Noida                 |
| Organizer / Sports| `sports@volunteermatch.ai`     | `Ngo@123`      | RunNCR Sports Foundation                  |
| Organizer / Civic | `civic@volunteermatch.ai`      | `Ngo@123`      | District Outreach Cell                    |
| Organizer / Summit| `summit@volunteermatch.ai`     | `Ngo@123`      | TechSummit India                          |
| Admin             | `admin@volunteermatch.ai`      | `Admin@123`    | Platform Admin                            |

Additional seeded volunteers are available at `anshika@`, `archita@`, `arjun@`, `aditya@`, `riya@`, `kabir@`, `neha@`, `rahul@`, `sana@` and `vikram@volunteermatch.ai` with password `Volunteer@123`.

The sign-in page includes clickable demo-account cards for the volunteer, an event organizer, an NGO and the admin.

---

## How the Platform Works

### Volunteer journey

1. **Discover** — browse all events or filter by category, location, date, skills, availability and mode.
2. **Complete a profile** — add personal and professional details, skills, interests, experience, availability and volunteering preferences. Browsing remains available while incomplete; applications require the platform's required profile fields.
3. **Get matched** — ranked recommendations with a score breakdown and plain-language explanation.
4. **Apply** — capacity checks, duplicate protection and deadline validation.
5. **Participate** — approved applications create schedule entries; organizers assign tasks.
6. **Track impact** — verified participation hours and feedback build the volunteer's history.

### Organizer journey

1. **Post an opportunity** — title, description, category, cover image, mode, dates, shifts, skills and capacity.
2. **Review applications** — approve or decline within capacity.
3. **Coordinate** — schedules, task assignment and progress tracking.
4. **Verify and analyse** — confirm hours and view organization analytics.

### Admin

- Platform-wide user, organization and opportunity management.
- Aggregate analytics across applications, participation and verified hours.

---

## Matching Engine

Each open opportunity is scored out of 100 using the volunteer's real profile:

| Factor       | Weight |
| ------------ | ------ |
| Skills       | 30     |
| Interests    | 20     |
| Availability | 15     |
| Location     | 10     |
| Experience   | 10     |
| Profession   | 10     |
| Preferences  | 5      |

Weights can be overridden with the `MATCH_WEIGHTS` JSON environment setting. Missing volunteer dimensions are omitted from the weighted denominator rather than scored as a negative match. TF-IDF cosine similarity is calculated over the volunteer's actual profile and opportunity text and returned as an additional explainability signal. No SVM is trained or claimed: the project does not currently have a labelled interaction dataset suitable for evaluating a classifier.

The response includes the total score, category, matched skills, missing skills, per-factor compatibility, text similarity, explanation and suggestions for improving the match. Schedule conflict warnings are surfaced before applying.

### Privacy and verification scope

Consent records and a self-declared safety response are persisted. A self-declaration is not a police check. This prototype does **not** accept identity document uploads, store Aadhaar data, connect to a background-check provider, or mark volunteers as officially verified. Do not send sensitive documents through this app; a production verification workflow needs a legally permitted provider, encrypted document storage, administrator audit controls and a documented retention policy. Organizer contact details are not fully connection-scoped, and in-app event chat, invitations, automatic post-event cleanup and account deletion requests are not implemented yet.

---

## API Overview

| Area           | Endpoints                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| Auth           | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                  |
| Users / admin  | `GET /users`, `GET /users/ngos`, `PATCH /users/{id}/status`                |
| Profiles       | `GET/PUT /profiles/me`                                                     |
| Opportunities  | `GET /opportunities`, `GET /opportunities/mine`, `GET/POST/PUT/DELETE /opportunities/{id}` |
| Matching       | `GET /matching/recommendations`, `GET /matching/score/{opportunity_id}`    |
| Applications   | `POST /applications`, `GET /applications/me`, `GET /applications/ngo`, review and completion |
| Schedules      | `GET /schedules/me`, `GET /schedules/ngo`                                  |
| Tasks          | Volunteer and organizer task endpoints                                     |
| Participation  | Record and verify hours                                                    |
| Feedback       | Submit and list feedback                                                   |
| Saved          | `GET/POST/DELETE /saved`                                                   |
| Analytics      | `GET /analytics/public`, `/analytics/categories`, `/analytics/volunteer`, `/analytics/ngo`, `/analytics/admin` |
| Assistant      | `POST /assistant/chat`                                                     |

The public discovery endpoint supports `q`, `category`, `location`, `mode`, `skills`, `availability`, `date_from`, `sort`, `page` and `page_size`.

---

## Testing

```powershell
cd backend
.\.venv\Scripts\python -m pytest -q
```

The suite covers authentication, role protection, opportunity management, matching, applications, schedule/task/participation flows, SPA deployment routes, and PostgreSQL URL normalization.

Frontend checks:

```powershell
cd frontend
npx tsc --noEmit
npm run build
```

---

## Demo Data Notice

Seeded opportunities carry `is_demo: true` and display a **Demo** badge throughout the interface. They exist to demonstrate matching, applications, scheduling, tasks, participation and analytics. They are not confirmed real-world events, and all seeded organizations and people are fictional.

---

## Team Cause Crew

MCA AI Fundamentals project — Arpit Singh (team lead), Anshika Sharma, Archita Katiyar, Arjun Singh and Aditya.
