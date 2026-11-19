from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, Organization, Opportunity, OpportunityStatus, Application, ApplicationStatus
from app.schemas.opportunities import OpportunityCreate, OpportunityUpdate, OpportunityOut, OpportunityList

router = APIRouter(prefix="/opportunities", tags=["opportunities"])

def to_out(db: Session, opp: Opportunity) -> OpportunityOut:
    approved_count = db.query(Application).filter(Application.opportunity_id==opp.id, Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED])).count()
    out = OpportunityOut.model_validate(opp)
    out.organization_name = opp.organization.name if opp.organization else None
    out.approved_count = approved_count
    out.is_full = approved_count >= (opp.volunteers_required or 0)
    # auto-expire in response context
    today = date.today()
    if out.status == "open" and ((opp.application_deadline and opp.application_deadline < today) or (opp.end_date and opp.end_date < today)):
        out.status = "expired"
    return out

@router.post("", response_model=OpportunityOut)
def create_opportunity(payload: OpportunityCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Organization profile required")
    data = payload.model_dump()
    status_val = data.pop('status', 'open')
    opp = Opportunity(organization_id=org.id, **data)
    opp.status = OpportunityStatus(status_val or 'open')
    db.add(opp); db.commit(); db.refresh(opp)
    return to_out(db, opp)

@router.get("", response_model=OpportunityList)
def list_opportunities(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,
    availability: Optional[str] = None,
    mode: Optional[str] = None,
    date_from: Optional[date] = None,
    status: Optional[str] = None,
    sort: Optional[str] = "newest",
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Opportunity).join(Organization)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Opportunity.title.ilike(like), Opportunity.description.ilike(like), Organization.name.ilike(like)))
    if category:
        query = query.filter(Opportunity.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(Opportunity.location.ilike(f"%{location}%"))
    if skills:
        for s in [x.strip() for x in skills.split(',') if x.strip()]:
            query = query.filter(or_(Opportunity.required_skills.ilike(f"%{s}%"), Opportunity.preferred_skills.ilike(f"%{s}%")))
    if availability:
        query = query.filter(Opportunity.available_days.ilike(f"%{availability}%"))
    if mode:
        query = query.filter(Opportunity.mode == mode)
    if date_from:
        query = query.filter(Opportunity.start_date >= date_from)
    if status:
        query = query.filter(Opportunity.status == OpportunityStatus(status))
    # exclude expired/closed/full by default unless status explicitly requested
    today = date.today()
    if not status:
        query = query.filter(Opportunity.status == OpportunityStatus.OPEN)
    total_all = query.count()
    if sort == "title":
        query = query.order_by(Opportunity.title.asc())
    elif sort == "deadline":
        query = query.order_by(Opportunity.application_deadline.asc().nullslast())
    else:
        query = query.order_by(Opportunity.created_at.desc())
    items_raw = query.offset((page-1)*page_size).limit(page_size).all()
    items = []
    for opp in items_raw:
        out = to_out(db, opp)
        # hide expired/full in default listing
        if not status:
            if out.status == "expired" or out.is_full:
                continue
        items.append(out)
    # if we filtered post-query, adjust total approximately not perfect but ok; better recompute
    if not status:
        # recompute visible total
        visible = []
        for opp in query.offset(0).limit(1000).all():
            out = to_out(db, opp)
            if out.status != "expired" and not out.is_full:
                visible.append(out)
        total = len(visible)
        items = visible[(page-1)*page_size:(page-1)*page_size+page_size]
    else:
        total = total_all
    return OpportunityList(items=items, total=total, page=page, page_size=page_size)

@router.get("/mine", response_model=List[OpportunityOut])
def my_opportunities(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if not org:
        return []
    opps = db.query(Opportunity).filter(Opportunity.organization_id==org.id).order_by(Opportunity.created_at.desc()).all()
    return [to_out(db, o) for o in opps]

@router.get("/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opp = db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return to_out(db, opp)

@router.put("/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(opportunity_id: int, payload: OpportunityUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    opp = db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if current_user.role != UserRole.ADMIN and (not org or opp.organization_id != org.id):
        raise HTTPException(status_code=403, detail="Not allowed")
    for k,v in payload.model_dump(exclude_unset=True).items():
        if k == 'status' and v is not None:
            setattr(opp, k, OpportunityStatus(v))
        else:
            setattr(opp, k, v)
    db.commit(); db.refresh(opp)
    return to_out(db, opp)

@router.delete("/{opportunity_id}")
def delete_opportunity(opportunity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    opp = db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if current_user.role != UserRole.ADMIN and (not org or opp.organization_id != org.id):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(opp); db.commit()
    return {"ok": True}
