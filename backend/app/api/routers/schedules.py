from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from collections import defaultdict
from app.db.session import get_db
from app.core.deps import require_roles, get_current_user
from app.models import User, UserRole, Application, Schedule, Opportunity, Organization, ApplicationStatus
from app.schemas.applications import ScheduleOut

router = APIRouter(prefix="/schedules", tags=["schedules"])

def to_out(s: Schedule, conflict=False, details=None) -> ScheduleOut:
    out = ScheduleOut.model_validate(s)
    app = s.application
    if app and app.opportunity:
        out.opportunity_title = app.opportunity.title
        out.organization_name = app.opportunity.organization.name if app.opportunity.organization else None
    out.has_conflict = conflict
    out.conflict_details = details
    return out

@router.get("/me", response_model=List[ScheduleOut])
def my_schedules(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    apps = db.query(Application).filter(Application.volunteer_id==current_user.id, Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED])).all()
    app_ids = [a.id for a in apps]
    if not app_ids:
        return []
    scheds = db.query(Schedule).filter(Schedule.application_id.in_(app_ids)).all()
    by_date = defaultdict(list)
    for s in scheds:
        if s.scheduled_date and s.status.value == 'upcoming':
            by_date[s.scheduled_date].append(s)

    def overlaps(a, b):
        if not a.scheduled_date or not b.scheduled_date or a.scheduled_date != b.scheduled_date:
            return False
        if a.start_time and a.end_time and b.start_time and b.end_time:
            return a.start_time < b.end_time and b.start_time < a.end_time
        return True  # same date with unknown times is a potential conflict

    result = []
    for s in scheds:
        conflict = False; details = None
        if s.scheduled_date and s.status.value == 'upcoming':
            clashes = [x for x in by_date[s.scheduled_date] if x.id != s.id and overlaps(s, x)]
            if clashes:
                conflict = True
                others = [x.application.opportunity.title for x in clashes if x.application and x.application.opportunity]
                if others:
                    details = f"Overlaps on {s.scheduled_date} with: " + ", ".join(others)
        result.append(to_out(s, conflict, details))
    result.sort(key=lambda x: (x.scheduled_date or x.id))
    return result

@router.get("/ngo", response_model=List[ScheduleOut])
def ngo_schedules(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return []
    scheds = db.query(Schedule).join(Application).join(Opportunity).filter(Opportunity.organization_id==org.id).all()
    return [to_out(s) for s in scheds]
