from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.migrations import migrate_existing_schema
from app.api.routers import (
    analytics, applications, assistant, auth, feedback, matching, notifications,
    opportunities, participation, profiles, saved, schedules, tasks, users,
)
from app.seed.seed_data import seed_if_empty

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    migrate_existing_schema()
    if settings.SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            seed_if_empty(db)
        finally:
            db.close()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(opportunities.router)
app.include_router(matching.router)
app.include_router(applications.router)
app.include_router(schedules.router)
app.include_router(tasks.router)
app.include_router(participation.router)
app.include_router(feedback.router)
app.include_router(saved.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(assistant.router)

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

@app.get("/health")
def health():
    return {"name": settings.APP_NAME, "status": "running"}


if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")


API_ROOTS = {
    "analytics", "applications", "assistant", "auth", "feedback", "health",
    "matching", "notifications", "opportunities", "participation", "profiles",
    "saved", "schedules", "tasks", "users",
}


@app.get("/{full_path:path}", include_in_schema=False)
async def frontend_fallback(full_path: str, request: Request):
    first_segment = full_path.partition("/")[0]
    if first_segment in API_ROOTS or first_segment == "api":
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    if not FRONTEND_DIST.is_dir() or not (FRONTEND_DIST / "index.html").is_file():
        return JSONResponse(status_code=503, content={"detail": "Frontend build is unavailable"})
    return FileResponse(FRONTEND_DIST / "index.html")