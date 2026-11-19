from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models import Notification, User

router = APIRouter(prefix="/notifications", tags=["notifications"])


def create_notification(db: Session, user_id: int, title: str, message: str, target_url: str | None = None) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, target_url=target_url))


def notification_out(item: Notification) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "message": item.message,
        "target_url": item.target_url,
        "is_read": item.is_read,
        "created_at": item.created_at,
    }


@router.get("")
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100).all()
    return {"items": [notification_out(item) for item in items], "unread_count": sum(not item.is_read for item in items)}


@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.commit()
    return notification_out(item)


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update(
        {"is_read": True}, synchronize_session=False
    )
    db.commit()
    return {"status": "ok"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted"}
