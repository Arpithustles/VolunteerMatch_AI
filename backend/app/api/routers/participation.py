from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, Organization, Application, ApplicationStatus, Participation, Opportunity
from app.schemas.applications import ParticipationCreate, ParticipationOut

router = APIRouter(prefix="/participation", tags=["participation"])

def to_out(db: Session, p: Participation) -> ParticipationOut:
    out = ParticipationOut.model_validate(p)
    opp = db.get(Opportunity, p.opportunity_id)
    vol = db.get(User, p.volunteer_id)
    out.opportunity_title = opp.title if opp else None
    out.volunteer_name = vol.full_name if vol else None
    return out

@router.post("", response_model=ParticipationOut)
def create_participation(payload: ParticipationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    app = db.get(Application, payload.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org or app.opportunity.organization_id != org.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if app.status not in (ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED):
        raise HTTPException(status_code=400, detail="Application must be approved/completed")
    existing = db.query(Participation).filter(Participation.application_id==app.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Participation already recorded for this application")
    # mark application completed
    app.status = ApplicationStatus.COMPLETED
    if app.schedule:
        from app.models import ScheduleStatus
        app.schedule.status = ScheduleStatus.COMPLETED
    part = Participation(
        application_id=app.id,
        volunteer_id=app.volunteer_id,
        opportunity_id=app.opportunity_id,
        hours=max(0.0, float(payload.hours)),
        notes=payload.notes,
        verified=bool(payload.verified),
        verified_by_org_id=org.id,
    )
    db.add(part); db.commit(); db.refresh(part)
    return to_out(db, part)

@router.get("/me", response_model=List[ParticipationOut])
def my_participation(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    parts = db.query(Participation).filter(Participation.volunteer_id==current_user.id).order_by(Participation.completed_at.desc()).all()
    return [to_out(db,p) for p in parts]

@router.get("/ngo", response_model=List[ParticipationOut])
def ngo_participation(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return []
    parts = db.query(Participation).join(Opportunity, Participation.opportunity_id==Opportunity.id).filter(Opportunity.organization_id==org.id).order_by(Participation.completed_at.desc()).all()
    return [to_out(db,p) for p in parts]
