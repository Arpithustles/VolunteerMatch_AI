from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.migrations import migrate_existing_schema
from app.api.routers import auth, users, profiles, opportunities, matching, applications, schedules, tasks, participation, feedback, analytics, assistant, saved, notifications
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

@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "running"}
