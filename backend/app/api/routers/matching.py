from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import require_roles
from app.models import User, UserRole, Notification
from app.services.matching_engine import recommend_for_user
from app.schemas.matching import RecommendationResponse, MatchResult

router = APIRouter(prefix="/matching", tags=["matching"])

@router.get("/recommendations", response_model=RecommendationResponse)
def recommendations(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    items = recommend_for_user(db, current_user)
    for item in items:
        if item["match_percentage"] < 70:
            continue
        target_url = f"/opportunities/{item['opportunity_id']}"
        exists = db.query(Notification.id).filter(
            Notification.user_id == current_user.id,
            Notification.title == "New opportunity matches your profile",
            Notification.target_url == target_url,
        ).first()
        if not exists:
            db.add(Notification(
                user_id=current_user.id,
                title="New opportunity matches your profile",
                message=f"{item['opportunity_title']} matches your profile. {item['explanation']}",
                target_url=target_url,
            ))
    db.commit()
    return RecommendationResponse(items=[MatchResult(**i) for i in items], total=len(items))
