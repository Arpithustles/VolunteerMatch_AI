from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import date
import re
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, Organization, Opportunity, Application, ApplicationStatus, Schedule, ScheduleStatus, VolunteerProfile, ConsentRecord
from app.api.routers.notifications import create_notification
from app.api.routers.profiles import calc_completion

from app.schemas.applications import ApplicationCreate, ApplicationUpdate, ApplicationOut

router = APIRouter(prefix="/applications", tags=["applications"])

def to_out(db: Session, app: Application) -> ApplicationOut:
    out = ApplicationOut.model_validate(app)
    out.opportunity_title = app.opportunity.title if app.opportunity else None
    out.organization_name = app.opportunity.organization.name if app.opportunity and app.opportunity.organization else None
    out.opportunity_category = app.opportunity.category if app.opportunity else None
    out.opportunity_cover_image = app.opportunity.cover_image if app.opportunity else None
    out.opportunity_start_date = app.opportunity.start_date if app.opportunity else None
    out.opportunity_location = app.opportunity.location if app.opportunity else None
    out.opportunity_mode = app.opportunity.mode if app.opportunity else None
    out.is_demo = bool(app.opportunity.is_demo) if app.opportunity else False
    out.volunteer_name = app.volunteer.full_name if app.volunteer else None
    consent = db.query(ConsentRecord).filter(
        ConsentRecord.user_id == app.volunteer_id
    ).order_by(ConsentRecord.created_at.desc()).first()
    contact_allowed = (
        app.status in (ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED)
        and app.opportunity.status.value == "open"
        and (not app.opportunity.end_date or app.opportunity.end_date >= date.today())
        and consent is not None
        and consent.organizer_sharing_consent
    )
    out.volunteer_email = app.volunteer.email if app.volunteer and contact_allowed else None
    return out

@router.post("", response_model=ApplicationOut)
def apply(payload: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    opp = db.get(Opportunity, payload.opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()
    if not profile or calc_completion(profile) < 100:
        raise HTTPException(status_code=400, detail="Complete the required sections in your volunteer profile before applying")
    today = date.today()
    if opp.status.value != "open":
        raise HTTPException(status_code=400, detail="Opportunity is not open")
    if (opp.application_deadline and opp.application_deadline < today) or (opp.end_date and opp.end_date < today):
        raise HTTPException(status_code=400, detail="Opportunity has expired")
    approved_count = db.query(Application).filter(Application.opportunity_id==opp.id, Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED])).count()
    if approved_count >= (opp.volunteers_required or 0):
        raise HTTPException(status_code=400, detail="Opportunity is full")
    existing = db.query(Application).filter(Application.opportunity_id==opp.id, Application.volunteer_id==current_user.id).first()
    if existing:
        if existing.status == ApplicationStatus.WITHDRAWN:
            existing.status = ApplicationStatus.PENDING
            existing.message = payload.message
            from datetime import datetime as _dt
            existing.updated_at = _dt.utcnow()
            db.commit(); db.refresh(existing)
            return to_out(db, existing)
        raise HTTPException(status_code=400, detail="You have already applied to this opportunity")
    app = Application(opportunity_id=opp.id, volunteer_id=current_user.id, message=payload.message)
    db.add(app)
    create_notification(
        db, current_user.id, "Application submitted",
        f"Your application for {opp.title} was submitted successfully.",
        "/volunteer/applications",
    )
    if opp.organization and opp.organization.user_id:
        create_notification(
            db, opp.organization.user_id, "New volunteer application",
            f"{current_user.full_name} applied for {opp.title}.", "/ngo/applicants",
        )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate application")
    db.refresh(app)
    return to_out(db, app)

@router.get("/me", response_model=List[ApplicationOut])
def my_applications(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    apps = db.query(Application).filter(Application.volunteer_id==current_user.id).order_by(Application.applied_at.desc()).all()
    return [to_out(db,a) for a in apps]

@router.get("/ngo", response_model=List[ApplicationOut])
def ngo_applications(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return []
    apps = db.query(Application).join(Opportunity).filter(Opportunity.organization_id==org.id).order_by(Application.applied_at.desc()).all()
    return [to_out(db,a) for a in apps]

@router.get("", response_model=List[ApplicationOut])
def all_applications(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    apps = db.query(Application).order_by(Application.applied_at.desc()).all()
    return [to_out(db,a) for a in apps]

@router.patch("/{app_id}", response_model=ApplicationOut)
def update_application(app_id: int, payload: ApplicationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    new_status = ApplicationStatus(payload.status)
    # permissions
    if current_user.role == UserRole.VOLUNTEER:
        if app.volunteer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed")
        if new_status != ApplicationStatus.WITHDRAWN or app.status not in (ApplicationStatus.PENDING, ApplicationStatus.APPROVED):
            raise HTTPException(status_code=400, detail="Volunteers can only withdraw pending/approved applications")
    elif current_user.role == UserRole.NGO:
        org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
        if not org or app.opportunity.organization_id != org.id:
            raise HTTPException(status_code=403, detail="Not allowed")
        if new_status not in (ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.COMPLETED):
            raise HTTPException(status_code=400, detail="Invalid status update")
        if new_status == ApplicationStatus.APPROVED:
            approved_count = db.query(Application).filter(Application.opportunity_id==app.opportunity_id, Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED]), Application.id!=app.id).count()
            if approved_count >= (app.opportunity.volunteers_required or 0):
                raise HTTPException(status_code=400, detail="Cannot approve: opportunity is full")
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not allowed")

    app.status = new_status
    if new_status in (ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.COMPLETED):
        create_notification(
            db, app.volunteer_id, f"Application {new_status.value}",
            f"Your application for {app.opportunity.title} was {new_status.value}.",
            "/volunteer/applications",
        )
    # create schedule on approval
    if new_status == ApplicationStatus.APPROVED and not app.schedule:
        start_t, end_t = None, None
        wh = (app.opportunity.working_hours or "").strip()
        m = re.match(r"^(\d{1,2}):(\d{2})\s*[-\u2013]\s*(\d{1,2}):(\d{2})$", wh)
        if m:
            from datetime import time as _time
            start_t = _time(int(m.group(1)), int(m.group(2)))
            end_t = _time(int(m.group(3)), int(m.group(4)))
        sched = Schedule(
            application_id=app.id,
            scheduled_date=app.opportunity.start_date,
            start_time=start_t,
            end_time=end_t,
            notes=f"Auto-scheduled for {app.opportunity.title}",
            status=ScheduleStatus.UPCOMING,
        )
        db.add(sched)
    if new_status in (ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN) and app.schedule:
        app.schedule.status = ScheduleStatus.CANCELLED
    if new_status == ApplicationStatus.COMPLETED and app.schedule:
        app.schedule.status = ScheduleStatus.COMPLETED
    db.commit(); db.refresh(app)
    return to_out(db, app)
