from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import require_roles
from app.models import User, UserRole, SavedOpportunity, Opportunity, Application, ApplicationStatus
from app.schemas.opportunities import OpportunityOut

router = APIRouter(prefix="/saved", tags=["saved"])

@router.post("/{opportunity_id}")
def save_opportunity(opportunity_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    opp = db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    existing = db.query(SavedOpportunity).filter(SavedOpportunity.opportunity_id==opportunity_id, SavedOpportunity.volunteer_id==current_user.id).first()
    if existing:
        return {"ok": True, "saved": True}
    db.add(SavedOpportunity(opportunity_id=opportunity_id, volunteer_id=current_user.id))
    db.commit()
    return {"ok": True, "saved": True}

@router.delete("/{opportunity_id}")
def unsave_opportunity(opportunity_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    existing = db.query(SavedOpportunity).filter(SavedOpportunity.opportunity_id==opportunity_id, SavedOpportunity.volunteer_id==current_user.id).first()
    if existing:
        db.delete(existing); db.commit()
    return {"ok": True, "saved": False}

@router.get("", response_model=List[OpportunityOut])
def list_saved(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    rows = db.query(SavedOpportunity).filter(SavedOpportunity.volunteer_id==current_user.id).all()
    ids = [r.opportunity_id for r in rows]
    if not ids:
        return []
    opps = db.query(Opportunity).filter(Opportunity.id.in_(ids)).all()
    out = []
    for opp in opps:
        approved_count = db.query(Application).filter(Application.opportunity_id==opp.id, Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED])).count()
        o = OpportunityOut.model_validate(opp)
        o.organization_name = opp.organization.name if opp.organization else None
        o.approved_count = approved_count
        o.is_full = approved_count >= (opp.volunteers_required or 0)
        out.append(o)
    return out
