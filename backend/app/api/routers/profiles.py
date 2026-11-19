from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, VolunteerProfile, Organization, ConsentRecord, Application, ApplicationStatus, Opportunity, OpportunityStatus
from app.schemas.profiles import VolunteerProfileOut, VolunteerProfileUpdate, OrganizationOut, OrganizationUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])

def calc_completion(p: VolunteerProfile) -> int:
    required = {
        "Contact details": p.phone,
        "Location": (p.city and p.state and p.pincode) or p.location,
        "Profession": p.profession,
        "Skills": p.skills,
        "Volunteering interests": p.preferred_categories or p.interests,
        "Availability": p.availability_days and p.available_time_slots,
        "Work preference": p.remote_preference,
        "Introduction": p.description,
    }
    missing = [section for section, value in required.items() if not value or not str(value).strip()]
    return int(((len(required) - len(missing)) / len(required)) * 100)

def missing_sections(p: VolunteerProfile) -> list[str]:
    required = {
        "Contact details": p.phone,
        "Location": (p.city and p.state and p.pincode) or p.location,
        "Profession": p.profession,
        "Skills": p.skills,
        "Volunteering interests": p.preferred_categories or p.interests,
        "Availability": p.availability_days and p.available_time_slots,
        "Work preference": p.remote_preference,
        "Introduction": p.description,
    }
    return [section for section, value in required.items() if not value or not str(value).strip()]

def populate_status(out: VolunteerProfileOut, profile: VolunteerProfile) -> VolunteerProfileOut:
    out.completion_percentage = calc_completion(profile)
    out.missing_sections = missing_sections(profile)
    out.profile_status = "profile_complete" if out.completion_percentage == 100 else "profile_incomplete"
    return out

class ConsentUpdate(BaseModel):
    registration_accurate: bool
    processing_consent: bool
    terms_accepted: bool
    privacy_accepted: bool
    safety_guidelines_accepted: bool
    organizer_sharing_consent: bool
    additional_verification_consent: bool = False

class SafetyDeclarationUpdate(BaseModel):
    answer: str

POLICY_VERSION = "2026-01"

@router.get("/volunteer/me", response_model=VolunteerProfileOut)
def get_my_volunteer_profile(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    p = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()
    if not p:
        p = VolunteerProfile(user_id=current_user.id)
        db.add(p); db.commit(); db.refresh(p)
    out = VolunteerProfileOut.model_validate(p)
    out.full_name = current_user.full_name
    out.email = current_user.email
    return populate_status(out, p)

@router.put("/volunteer/me", response_model=VolunteerProfileOut)
def update_my_volunteer_profile(payload: VolunteerProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    p = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()
    if not p:
        p = VolunteerProfile(user_id=current_user.id)
        db.add(p)
    data = payload.model_dump(exclude_unset=True)
    data.pop("profile_status", None)
    full_name = data.pop("full_name", None)
    if full_name:
        current_user.full_name = full_name
    for k, v in data.items():
        setattr(p, k, v)
    p.profile_status = "profile_complete" if calc_completion(p) == 100 else "profile_incomplete"
    db.commit(); db.refresh(p); db.refresh(current_user)
    out = VolunteerProfileOut.model_validate(p)
    out.full_name = current_user.full_name
    out.email = current_user.email
    return populate_status(out, p)

@router.post("/volunteer/consent")
def record_volunteer_consent(
    payload: ConsentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
):
    required = (
        payload.registration_accurate, payload.processing_consent, payload.terms_accepted,
        payload.privacy_accepted, payload.safety_guidelines_accepted, payload.organizer_sharing_consent,
    )
    if not all(required):
        raise HTTPException(status_code=400, detail="All required declarations must be accepted")
    record = ConsentRecord(user_id=current_user.id, policy_version=POLICY_VERSION, **payload.model_dump())
    db.add(record)
    db.commit()
    return {"status": "recorded", "policy_version": POLICY_VERSION, "created_at": record.created_at}

@router.get("/volunteer/consent")
def get_volunteer_consent(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
):
    record = db.query(ConsentRecord).filter(ConsentRecord.user_id == current_user.id).order_by(ConsentRecord.created_at.desc()).first()
    return record

@router.patch("/volunteer/safety-declaration")
def update_safety_declaration(
    payload: SafetyDeclarationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.VOLUNTEER)),
):
    allowed = {"yes", "no", "confidential"}
    answer = payload.answer.strip().lower()
    if answer not in allowed:
        raise HTTPException(status_code=400, detail="Choose yes, no, or confidential")
    profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()
    if not profile:
        profile = VolunteerProfile(user_id=current_user.id)
        db.add(profile)
    profile.safety_declaration = answer
    db.commit()
    return {"status": "saved", "answer": answer}

@router.get("/organization/me", response_model=OrganizationOut)
def get_my_org(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if not org:
        org = Organization(user_id=current_user.id, name=current_user.full_name)
        db.add(org); db.commit(); db.refresh(org)
    return org

@router.put("/organization/me", response_model=OrganizationOut)
def update_my_org(payload: OrganizationUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id == current_user.id).first()
    if not org:
        org = Organization(user_id=current_user.id, name=current_user.full_name)
        db.add(org)
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(org, k, v)
    db.commit(); db.refresh(org)
    return org

@router.get("/volunteer/{user_id}", response_model=VolunteerProfileOut)
def get_volunteer_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.VOLUNTEER and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    can_share_contact = current_user.role == UserRole.VOLUNTEER and current_user.id == user_id
    if current_user.role == UserRole.NGO:
        organization = db.query(Organization).filter(Organization.user_id == current_user.id).first()
        application = db.query(Application).join(Application.opportunity).filter(
            Application.volunteer_id == user_id,
            Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED]),
            Opportunity.status == OpportunityStatus.OPEN,
            Opportunity.organization_id == organization.id if organization else False,
        ).first()
        consent = db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).order_by(ConsentRecord.created_at.desc()).first()
        event_active = bool(application and (not application.opportunity.end_date or application.opportunity.end_date >= date.today()))
        if not event_active or not consent or not consent.organizer_sharing_consent:
            raise HTTPException(status_code=403, detail="Volunteer profile details are shared only after mutual acceptance and consent")
        can_share_contact = True
    elif current_user.role not in (UserRole.VOLUNTEER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not allowed")
    user = db.get(User, user_id)
    if not user or user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    p = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == user_id).first()
    if not p:
        p = VolunteerProfile(user_id=user_id)
    out = VolunteerProfileOut.model_validate(p)
    out.full_name = user.full_name
    out.email = user.email if can_share_contact else None
    if not (current_user.role == UserRole.VOLUNTEER and current_user.id == user_id):
        out.address = None
        out.pincode = None
        out.date_of_birth = None
    if not can_share_contact:
        out.phone = None
    return populate_status(out, p)
