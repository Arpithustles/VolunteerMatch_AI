from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import require_roles, get_current_user
from app.models import User, UserRole, Organization, Application, ApplicationStatus, Feedback, Opportunity
from app.schemas.applications import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])

def to_out(db: Session, f: Feedback) -> FeedbackOut:
    out = FeedbackOut.model_validate(f)
    opp = db.get(Opportunity, f.opportunity_id)
    out.opportunity_title = opp.title if opp else None
    return out

@router.post("", response_model=FeedbackOut)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    app = db.get(Application, payload.application_id)
    if not app or app.volunteer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in (ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED):
        raise HTTPException(status_code=400, detail="Feedback allowed for approved/completed applications")
    existing = db.query(Feedback).filter(Feedback.application_id==app.id, Feedback.volunteer_id==current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this application")
    fb = Feedback(application_id=app.id, volunteer_id=current_user.id, opportunity_id=app.opportunity_id, rating=max(1,min(5,payload.rating)), comment=payload.comment)
    db.add(fb); db.commit(); db.refresh(fb)
    return to_out(db, fb)

@router.get("/me", response_model=List[FeedbackOut])
def my_feedback(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    items = db.query(Feedback).filter(Feedback.volunteer_id==current_user.id).order_by(Feedback.created_at.desc()).all()
    return [to_out(db,i) for i in items]

@router.get("/ngo", response_model=List[FeedbackOut])
def ngo_feedback(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return []
    items = db.query(Feedback).join(Opportunity, Feedback.opportunity_id==Opportunity.id).filter(Opportunity.organization_id==org.id).order_by(Feedback.created_at.desc()).all()
    return [to_out(db,i) for i in items]
