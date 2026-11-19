from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.common import UserCreate, Token, LoginRequest, UserOut
from app.models import User, UserRole, VolunteerProfile, Organization
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin registration not allowed")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole(payload.role.value),
    )
    db.add(user)
    db.flush()
    if user.role == UserRole.VOLUNTEER:
        db.add(VolunteerProfile(user_id=user.id))
    elif user.role == UserRole.NGO:
        db.add(Organization(user_id=user.id, name=payload.full_name.strip() or "My Organization"))
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=token, role=user.role.value, user_id=user.id, full_name=user.full_name)

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")
    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=token, role=user.role.value, user_id=user.id, full_name=user.full_name)

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
