from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.db.session import get_db
from app.core.deps import require_roles
from app.models import (
    User, UserRole, VolunteerProfile, Organization, Opportunity, OpportunityStatus,
    Application, ApplicationStatus, Task, TaskStatus, Participation, Schedule, ScheduleStatus
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

def profile_completion(p: VolunteerProfile | None) -> int:
    if not p:
        return 0
    fields = [p.phone, p.location, p.education, p.skills, p.interests, p.experience, p.preferred_categories, p.availability_days, p.available_time_slots, p.remote_preference, p.languages, p.description]
    filled = sum(1 for f in fields if f and str(f).strip())
    return int((filled / len(fields)) * 100)

@router.get("/volunteer")
def volunteer_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    p = db.query(VolunteerProfile).filter(VolunteerProfile.user_id==current_user.id).first()
    apps = db.query(Application).filter(Application.volunteer_id==current_user.id).all()
    total_apps = len(apps)
    approved = sum(1 for a in apps if a.status in (ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED))
    completed_apps = sum(1 for a in apps if a.status == ApplicationStatus.COMPLETED)
    parts = db.query(Participation).filter(Participation.volunteer_id==current_user.id).all()
    hours = sum(float(x.hours or 0) for x in parts if x.verified)
    upcoming = db.query(Schedule).join(Application).filter(Application.volunteer_id==current_user.id, Schedule.status==ScheduleStatus.UPCOMING).count()
    recent = []
    for a in sorted(apps, key=lambda x: x.updated_at or x.applied_at, reverse=True)[:5]:
        recent.append({
            "type": "application",
            "title": a.opportunity.title if a.opportunity else "Opportunity",
            "status": a.status.value,
            "date": (a.updated_at or a.applied_at).isoformat() if (a.updated_at or a.applied_at) else None,
        })
    return {
        "profile_completion": profile_completion(p),
        "total_applications": total_apps,
        "approved_applications": approved,
        "completed_activities": len(parts),
        "completed_applications": completed_apps,
        "volunteering_hours": round(hours, 2),
        "upcoming_events": upcoming,
        "recent_activity": recent,
    }

@router.get("/ngo")
def ngo_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return {}
    opps = db.query(Opportunity).filter(Opportunity.organization_id==org.id).all()
    opp_ids = [o.id for o in opps]
    total_opps = len(opps)
    active_opps = sum(1 for o in opps if o.status == OpportunityStatus.OPEN)
    apps = db.query(Application).join(Opportunity).filter(Opportunity.organization_id==org.id).all() if opp_ids else []
    total_applicants = len({a.volunteer_id for a in apps})
    approved_volunteers = len({a.volunteer_id for a in apps if a.status in (ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED)})
    pending_apps = sum(1 for a in apps if a.status == ApplicationStatus.PENDING)
    tasks = db.query(Task).join(Opportunity).filter(Opportunity.organization_id==org.id).all() if opp_ids else []
    task_stats = {
        "total": len(tasks),
        "pending": sum(1 for t in tasks if t.status == TaskStatus.PENDING),
        "in_progress": sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS),
        "completed": sum(1 for t in tasks if t.status == TaskStatus.COMPLETED),
    }
    parts = db.query(Participation).join(Opportunity).filter(Opportunity.organization_id==org.id).all() if opp_ids else []
    participation = {
        "records": len(parts),
        "verified_hours": round(sum(float(p.hours or 0) for p in parts if p.verified), 2),
    }
    return {
        "total_opportunities": total_opps,
        "active_opportunities": active_opps,
        "total_applicants": total_applicants,
        "approved_volunteers": approved_volunteers,
        "pending_applications": pending_apps,
        "task_stats": task_stats,
        "participation": participation,
    }


@router.get("/public")
def public_stats(db: Session = Depends(get_db)):
    organizations = db.query(Organization).count()
    verified_hours = db.query(func.coalesce(func.sum(Participation.hours), 0)).filter(Participation.verified == True).scalar() or 0
    return {
        "volunteers": db.query(User).filter(User.role == UserRole.VOLUNTEER).count(),
        "ngos": organizations,
        "organizers": organizations,
        "opportunities": db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.OPEN).count(),
        "completed_activities": db.query(Participation).count(),
        "verified_hours": round(float(verified_hours), 1),
    }

@router.get("/categories")
def category_stats(db: Session = Depends(get_db)):
    rows = (
        db.query(Opportunity.category, func.count(Opportunity.id))
        .filter(Opportunity.status == OpportunityStatus.OPEN)
        .group_by(Opportunity.category)
        .all()
    )
    return [{"name": name, "count": count} for name, count in rows]

@router.get("/admin")
def admin_analytics(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    total_users = db.query(User).count()
    total_volunteers = db.query(User).filter(User.role==UserRole.VOLUNTEER).count()
    total_ngos = db.query(User).filter(User.role==UserRole.NGO).count()
    total_orgs = db.query(Organization).count()
    total_opps = db.query(Opportunity).count()
    total_apps = db.query(Application).count()
    completed_activities = db.query(Participation).count()
    # real growth counts per day for last 7 days (SQLite compatible)
    today = date.today()
    growth = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        dstr = d.isoformat()
        users_count = db.query(User).filter(func.date(User.created_at) == dstr).count()
        apps_count = db.query(Application).filter(func.date(Application.applied_at) == dstr).count()
        growth.append({"date": dstr, "users": users_count, "applications": apps_count})
    status_counts = {}
    for s in ApplicationStatus:
        status_counts[s.value] = db.query(Application).filter(Application.status==s).count()
    return {
        "total_users": total_users,
        "total_volunteers": total_volunteers,
        "total_ngos": total_ngos,
        "total_organizations": total_orgs,
        "total_opportunities": total_opps,
        "total_applications": total_apps,
        "total_completed_activities": completed_activities,
        "application_status_counts": status_counts,
        "growth": growth,
    }
