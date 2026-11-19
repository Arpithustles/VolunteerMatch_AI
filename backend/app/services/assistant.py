from __future__ import annotations
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import User, Opportunity, Application, ApplicationStatus, Schedule, ScheduleStatus, VolunteerProfile, Organization
from app.services.matching_engine import recommend_for_user
from app.core.config import settings
import httpx
import re

def _opp_brief(o: Opportunity) -> Dict[str, Any]:
    return {
        "id": o.id,
        "title": o.title,
        "category": o.category,
        "location": o.location,
        "mode": o.mode,
        "available_days": o.available_days,
        "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
        "organization_name": o.organization.name if o.organization else None,
        "start_date": o.start_date.isoformat() if o.start_date else None,
    }

def _user_context(db: Session, user: User) -> Dict[str, Any]:
    ctx: Dict[str, Any] = {"user": {"id": user.id, "name": user.full_name, "role": user.role.value}}
    if user.role.value == 'volunteer':
        profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id==user.id).first()
        ctx["profile"] = {
            "skills": profile.skills if profile else None,
            "interests": profile.interests if profile else None,
            "availability_days": profile.availability_days if profile else None,
            "location": profile.location if profile else None,
            "experience": profile.experience if profile else None,
            "remote_preference": profile.remote_preference if profile else None,
        }
        apps = db.query(Application).filter(Application.volunteer_id==user.id).all()
        ctx["applications"] = [{
            "id": a.id, "status": a.status.value, "opportunity": a.opportunity.title if a.opportunity else None,
            "opportunity_id": a.opportunity_id
        } for a in apps]
        recs = recommend_for_user(db, user, limit=5)
        ctx["top_recommendations"] = [{k: v for k, v in r.items() if k != 'opportunity'} for r in recs]
        # upcoming schedules
        app_ids = [a.id for a in apps if a.status == ApplicationStatus.APPROVED]
        scheds = db.query(Schedule).filter(Schedule.application_id.in_(app_ids)).all() if app_ids else []
        ctx["upcoming_schedules"] = [{
            "opportunity": s.application.opportunity.title if s.application and s.application.opportunity else None,
            "date": s.scheduled_date.isoformat() if s.scheduled_date else None,
            "status": s.status.value,
        } for s in scheds]
    return ctx

def rule_based_reply(db: Session, user: User, message: str) -> Tuple[str, List[Dict[str, Any]]]:
    msg = message.lower()
    opps_out: List[Dict[str, Any]] = []

    if user.role.value != 'volunteer':
        # basic NGO/admin help
        if 'opportunit' in msg:
            org = db.query(Organization).filter(Organization.user_id==user.id).first()
            if org:
                opps = db.query(Opportunity).filter(Opportunity.organization_id==org.id).order_by(Opportunity.created_at.desc()).limit(5).all()
                opps_out = [_opp_brief(o) for o in opps]
                return (f"You have {len(opps_out)} recent opportunities listed. I can help you review applicants, tasks, and participation from your dashboard.", opps_out)
        return ("I can help with managing opportunities, reviewing applications, assigning tasks, and viewing participation analytics. Use the dashboard sections for detailed actions.", [])

    # Volunteer intents
    if any(w in msg for w in ['upcoming', 'schedule', 'my activities', 'my events']):
        apps = db.query(Application).filter(Application.volunteer_id==user.id, Application.status==ApplicationStatus.APPROVED).all()
        app_ids = [a.id for a in apps]
        scheds = db.query(Schedule).filter(Schedule.application_id.in_(app_ids)).all() if app_ids else []
        if not scheds:
            return ("You have no upcoming scheduled activities right now. Check AI Recommendations to find opportunities that fit you.", [])
        lines = []
        for s in scheds:
            t = s.application.opportunity.title if s.application and s.application.opportunity else 'Opportunity'
            lines.append(f"- {t} on {s.scheduled_date or 'TBD'} ({s.status.value})")
        return ("Here are your upcoming activities:\n" + "\n".join(lines), [])

    if 'application' in msg and any(w in msg for w in ['status', 'my', 'show', 'track']):
        apps = db.query(Application).filter(Application.volunteer_id==user.id).order_by(Application.applied_at.desc()).all()
        if not apps:
            return ("You have not submitted any applications yet.", [])
        lines = [f"- {a.opportunity.title if a.opportunity else 'Opportunity'}: {a.status.value}" for a in apps[:8]]
        return ("Your application statuses:\n" + "\n".join(lines), [])

    wants_recs = any(w in msg for w in ['recommend', 'match my', 'best for me', 'suitable', 'why did i receive'])
    wants_why = ('why' in msg and 'recommend' in msg) or ('why' in msg and 'match' in msg)
    wants_improve = any(w in msg for w in ['improve', 'missing', 'skills should i', 'what skills'])
    wants_remote = 'remote' in msg
    wants_weekend = 'weekend' in msg

    recs = recommend_for_user(db, user, limit=10)
    filtered = recs
    if wants_remote:
        filtered = [r for r in filtered if (r.get('opportunity') or {}).get('mode') == 'remote'] or filtered
    if wants_weekend:
        filtered = [r for r in filtered if 'weekend' in ((r.get('opportunity') or {}).get('available_days') or '').lower() or 'saturday' in ((r.get('opportunity') or {}).get('available_days') or '').lower() or 'sunday' in ((r.get('opportunity') or {}).get('available_days') or '').lower()] or filtered

    if wants_improve:
        if filtered:
            top = filtered[0]
            missing = top.get('missing_skills') or []
            sugg = top.get('improvement_suggestions') or []
            if missing:
                return (f"For '{top['opportunity_title']}', skills to improve/add: {', '.join(missing)}. " + (" ".join(sugg)), [top.get('opportunity')] if top.get('opportunity') else [])
            return ("Your top matches do not show missing required skills. " + (" ".join(sugg) if sugg else "Keep your profile updated for better matches."), [top.get('opportunity')] if top.get('opportunity') else [])
        return ("Update your profile skills and interests so I can suggest improvements based on real opportunities.", [])

    if wants_recs or wants_why or wants_remote or wants_weekend or 'find' in msg or 'search' in msg or 'opportunit' in msg:
        if not filtered:
            return ("I couldn't find open opportunities matching that request right now. Try broadening your filters or updating your profile.", [])
        topn = filtered[:5]
        opps_out = [r.get('opportunity') for r in topn if r.get('opportunity')]
        lines = []
        for r in topn[:3]:
            lines.append(f"- {r['opportunity_title']} ({r['match_percentage']}% {r['match_category']}): {r['explanation']}")
        prefix = "Based on your profile, here are strong matches" if not wants_weekend and not wants_remote else "Here are opportunities matching your request"
        reply = prefix + ":\n" + "\n".join(lines)
        if wants_why and topn:
            reply += f"\n\nWhy top match: {topn[0]['explanation']}"
        return (reply, opps_out)

    # default helpful response with context
    if recs:
        top = recs[0]
        return (f"I can help you find opportunities, explain recommendations, show application status, or list upcoming activities. Your current top match is '{top['opportunity_title']}' at {top['match_percentage']}%.", [top.get('opportunity')] if top.get('opportunity') else [])
    return ("I can help you find volunteering opportunities, explain AI matches, check application status, and show upcoming activities. Complete your volunteer profile to get personalized recommendations.", [])

async def generate_reply(db: Session, user: User, message: str) -> Tuple[str, List[Dict[str, Any]]]:
    # Always compute grounded fallback first
    fallback_reply, opps = rule_based_reply(db, user, message)
    if not settings.OPENAI_API_KEY:
        return fallback_reply, opps
    # Try LLM with grounded context; on any error fallback
    try:
        ctx = _user_context(db, user)
        system = (
            "You are VolunteerMatch AI assistant. Use ONLY the provided context facts. "
            "Do not invent opportunities, application statuses, schedules, or user data. "
            "If information is unavailable, say so clearly. Be concise and helpful."
        )
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": f"Context (JSON): {ctx}\n\nUser question: {message}\n\nDraft factual answer: {fallback_reply}"},
            ],
            "temperature": 0.2,
        }
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
        base = settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
        url = base.rstrip('/') + "/chat/completions"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                return fallback_reply, opps
            data = resp.json()
            text = data.get('choices', [{}])[0].get('message', {}).get('content')
            if text and isinstance(text, str):
                return text.strip(), opps
    except Exception:
        return fallback_reply, opps
    return fallback_reply, opps
