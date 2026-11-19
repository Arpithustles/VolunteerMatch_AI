from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import require_roles, get_current_user
from app.models import User, UserRole
from app.schemas.common import UserOut
from app.models import Organization

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/{user_id}/status")
def update_status(user_id: int, is_active: bool, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"ok": True, "user_id": user_id, "is_active": is_active}

@router.get("/ngos")
def list_ngos(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    orgs = db.query(Organization).join(User).order_by(Organization.created_at.desc()).all()
    return [{
        "id": o.id,
        "name": o.name,
        "email": o.user.email if o.user else None,
        "location": o.location,
        "mission": o.mission,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    } for o in orgs]
