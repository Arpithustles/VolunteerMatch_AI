from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models import User, ChatConversation, ChatMessage
from app.schemas.matching import AssistantRequest, AssistantResponse
from app.services.assistant import generate_reply

router = APIRouter(prefix="/assistant", tags=["assistant"])

@router.post("/chat", response_model=AssistantResponse)
async def chat(payload: AssistantRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    conv = None
    if payload.conversation_id:
        conv = db.get(ChatConversation, payload.conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    if not conv:
        conv = ChatConversation(user_id=current_user.id, title=payload.message.strip()[:60])
        db.add(conv); db.commit(); db.refresh(conv)
    user_msg = ChatMessage(conversation_id=conv.id, role="user", content=payload.message.strip())
    db.add(user_msg); db.commit()
    reply, opps = await generate_reply(db, current_user, payload.message.strip())
    asst_msg = ChatMessage(conversation_id=conv.id, role="assistant", content=reply)
    db.add(asst_msg); db.commit()
    return AssistantResponse(reply=reply, conversation_id=conv.id, opportunities=opps)

@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.get(ChatConversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id==conversation_id).order_by(ChatMessage.created_at.asc()).all()
    return {"id": conv.id, "title": conv.title, "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs]}
