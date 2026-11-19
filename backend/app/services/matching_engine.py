from __future__ import annotations
from dataclasses import dataclass
from datetime import date
from typing import List, Dict, Any
import json
import math
import re
from sqlalchemy.orm import Session
from app.models import Opportunity, VolunteerProfile, User, Application, ApplicationStatus, Schedule, ScheduleStatus
from app.core.config import settings

_BASE_WEIGHTS = {
    "skills": 30.0, "interests": 20.0, "availability": 15.0,
    "location": 10.0, "experience": 10.0, "profession": 10.0,
    "preferences": 5.0,
}
_configured_weights = json.loads(settings.MATCH_WEIGHTS)
if set(_configured_weights) != set(_BASE_WEIGHTS) or any(float(value) < 0 for value in _configured_weights.values()):
    raise ValueError("MATCH_WEIGHTS must define non-negative weights for all recommendation dimensions")
_weight_total = sum(float(value) for value in _configured_weights.values())
if _weight_total <= 0:
    raise ValueError("MATCH_WEIGHTS must have a positive total")
WEIGHTS = {key: float(value) * 100.0 / _weight_total for key, value in _configured_weights.items()}

def _split_csv(val: str | None) -> List[str]:
    if not val:
        return []
    # allow comma or newline separated
    parts = []
    for chunk in val.replace("\n", ",").split(","):
        s = chunk.strip()
        if s:
            parts.append(s)
    # de-dup preserving order case-insensitively
    seen = set()
    out = []
    for p in parts:
        k = p.lower()
        if k not in seen:
            seen.add(k)
            out.append(p)
    return out

def _norm(s: str | None) -> str:
    return (s or "").strip().lower()

def _tfidf_cosine(left: str, right: str) -> float:
    stop_words = {"a", "an", "and", "are", "for", "in", "of", "on", "or", "the", "to", "with"}
    documents = [
        [token for token in re.findall(r"[a-z0-9]+", text.lower()) if token not in stop_words]
        for text in (left, right)
    ]
    if not documents[0] or not documents[1]:
        return 0.0
    vocab = set(documents[0]) | set(documents[1])
    vectors = []
    for document in documents:
        counts = {term: document.count(term) for term in set(document)}
        vectors.append({
            term: (count / len(document)) * (math.log(3 / (1 + sum(term in doc for doc in documents))) + 1)
            for term, count in counts.items()
        })
    dot = sum(vectors[0].get(term, 0) * vectors[1].get(term, 0) for term in vocab)
    norm_left = math.sqrt(sum(weight * weight for weight in vectors[0].values()))
    norm_right = math.sqrt(sum(weight * weight for weight in vectors[1].values()))
    return dot / (norm_left * norm_right) if norm_left and norm_right else 0.0

def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = {x.lower() for x in a}, {x.lower() for x in b}
    if not sa and not sb:
        return 0.0
    if not sa or not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb)
    return inter / union if union else 0.0

def _overlap_ratio(required: List[str], have: List[str]) -> float:
    if not required:
        return 1.0
    sr = [x.lower() for x in required]
    sh = {x.lower() for x in have}
    matched = sum(1 for x in sr if x in sh)
    return matched / len(sr)

def is_opportunity_recommendable(opp: Opportunity, approved_count: int) -> bool:
    today = date.today()
    if opp.status.value not in ("open",):
        return False
    if opp.application_deadline and opp.application_deadline < today:
        return False
    if opp.end_date and opp.end_date < today:
        return False
    if opp.volunteers_required is not None and approved_count >= opp.volunteers_required:
        return False
    return True

def compute_match(vol_profile: VolunteerProfile | None, opp: Opportunity, *, has_schedule_conflict: bool = False, conflict_note: str | None = None) -> Dict[str, Any]:
    v_skills = _split_csv(vol_profile.skills if vol_profile else None)
    v_interests = _split_csv(vol_profile.interests if vol_profile else None)
    v_pref_cats = _split_csv(vol_profile.preferred_categories if vol_profile else None)
    v_days = _split_csv(vol_profile.availability_days if vol_profile else None)
    v_slots = _split_csv(vol_profile.available_time_slots if vol_profile else None)
    v_loc = _norm(vol_profile.location if vol_profile else None)
    v_remote = _norm(vol_profile.remote_preference if vol_profile else None)
    v_exp = _norm(vol_profile.experience if vol_profile else None)
    v_profession = _norm(getattr(vol_profile, "profession", None))
    v_education = _norm(getattr(vol_profile, "education", None))

    req_skills = _split_csv(opp.required_skills)
    pref_skills = _split_csv(opp.preferred_skills)
    opp_cat = _norm(opp.category)
    opp_days = _split_csv(opp.available_days)
    opp_loc = _norm(opp.location)
    opp_mode = _norm(opp.mode)
    opp_exp = _norm(opp.experience_required)
    profession_text = " ".join(filter(None, (opp.title, opp.description, opp.required_skills, opp.preferred_skills))).lower()
    profile_text = " ".join(filter(None, (
        vol_profile.skills if vol_profile else None,
        vol_profile.interests if vol_profile else None,
        vol_profile.experience if vol_profile else None,
        getattr(vol_profile, "education", None),
        getattr(vol_profile, "description", None),
        v_profession,
    )))
    content_similarity = _tfidf_cosine(profile_text, profession_text) * 100.0

    # Skills (35): required coverage primary, preferred as small bonus
    req_ratio = _overlap_ratio(req_skills, v_skills)
    pref_ratio = _overlap_ratio(pref_skills, v_skills) if pref_skills else 0.0
    if req_skills and pref_skills:
        skills_score = (0.85 * req_ratio + 0.15 * pref_ratio) * 100
    elif req_skills:
        skills_score = req_ratio * 100
    elif pref_skills:
        skills_score = (0.5 + 0.5 * pref_ratio) * 100  # no hard reqs
    else:
        skills_score = 70.0 if v_skills else 50.0
    matched_skills = [s for s in req_skills if s.lower() in {x.lower() for x in v_skills}]
    # include preferred matches in display but missing is from required
    missing_skills = [s for s in req_skills if s.lower() not in {x.lower() for x in v_skills}]

    # Interests (20): category vs interests/preferred categories
    interest_hits = 0
    interest_total = 0
    if opp_cat:
        interest_total += 1
        if opp_cat in {i.lower() for i in v_interests} or opp_cat in {i.lower() for i in v_pref_cats}:
            interest_hits += 1
    if v_pref_cats:
        interest_total += 1
        # partial if any overlap by tokens
        if opp_cat and opp_cat in {i.lower() for i in v_pref_cats}:
            interest_hits += 1
        elif v_interests and _jaccard(v_interests, [opp.category]) > 0:
            interest_hits += 0.5
    interests_score = (interest_hits / interest_total * 100) if interest_total else 50.0
    if not v_interests and not v_pref_cats:
        interests_score = 40.0
    else:
        interests_score = 0.8 * interests_score + 0.2 * content_similarity

    # Availability (20): day overlap and no conflict
    if not opp_days or not v_days:
        avail_score = 60.0
        avail_note = "Availability information incomplete; assumed partial compatibility."
    else:
        overlap = len({d.lower() for d in opp_days} & {d.lower() for d in v_days})
        if overlap > 0:
            avail_score = 100.0 if overlap >= min(len(opp_days), len(v_days)) else 80.0
        else:
            # weekend/weekday heuristic
            wknds_a = {"saturday","sunday","weekend","weekends"}
            wknds_o = {"saturday","sunday","weekend","weekends"}
            if ({d.lower() for d in v_days} & wknds_a) and ({d.lower() for d in opp_days} & wknds_o):
                avail_score = 90.0
            else:
                avail_score = 25.0
        avail_note = None
    if has_schedule_conflict:
        avail_score = min(avail_score, 30.0)

    # Experience (10): simple heuristic levels
    levels = {"none":0,"beginner":1,"entry":1,"basic":1,"intermediate":2,"some":2,"experienced":3,"advanced":3,"expert":4}
    def level_of(text: str) -> int:
        t = text.lower()
        for k,v in levels.items():
            if k in t:
                return v
        # if volunteer has experience text but unspecified, assume some
        return 2 if t else 1
    if not opp_exp:
        exp_score = 80.0 if v_exp else 60.0
    else:
        req_lvl = level_of(opp_exp)
        vol_lvl = level_of(v_exp) if v_exp else 0
        if vol_lvl >= req_lvl:
            exp_score = 100.0
        elif vol_lvl == req_lvl - 1:
            exp_score = 70.0
        else:
            exp_score = 35.0

    qualification_terms = {
        "teacher": ("teacher", "teaching", "education"),
        "professor": ("professor", "teaching", "education"),
        "student": ("student", "school", "college"),
        "mathematics": ("mathematics", "math", "teaching"),
        "science": ("science", "stem", "teaching"),
    }
    relevant_terms = {term for key, terms in qualification_terms.items() if key in profession_text for term in terms}
    profile_qualification = f"{v_profession} {v_education}"
    if relevant_terms and profile_qualification.strip():
        profession_score = 100.0 if any(term in profile_qualification for term in relevant_terms) else 55.0
    elif v_profession or v_education:
        profession_score = 75.0
    else:
        profession_score = 50.0

    # Location (10)
    if opp_mode == "remote":
        loc_score = 100.0 if v_remote in ("remote", "any", "hybrid", "") else 90.0
    else:
        if v_loc and opp_loc and (v_loc in opp_loc or opp_loc in v_loc):
            loc_score = 100.0
        elif v_loc and opp_loc:
            # token overlap
            vt = set(v_loc.replace(',', ' ').split())
            ot = set(opp_loc.replace(',', ' ').split())
            loc_score = 80.0 if vt & ot else 45.0
        elif v_remote in ("remote",) and opp_mode in ("on-site", "hybrid"):
            loc_score = 40.0
        else:
            loc_score = 55.0

    # Preferences (5): mode/category preference alignment
    pref_score = 60.0
    pref_hits = 0
    pref_total = 0
    if v_remote:
        pref_total += 1
        if v_remote == "any" or v_remote == opp_mode or (v_remote == "hybrid" and opp_mode in ("hybrid","remote")):
            pref_hits += 1
        elif opp_mode == "remote":
            pref_hits += 0.8
    if v_pref_cats:
        pref_total += 1
        if opp_cat in {c.lower() for c in v_pref_cats}:
            pref_hits += 1
    if pref_total:
        pref_score = 100.0 * (pref_hits / pref_total)
    else:
        pref_score = 55.0

    scores = {
        "skills": max(0.0, min(100.0, skills_score)),
        "interests": max(0.0, min(100.0, interests_score)),
        "availability": max(0.0, min(100.0, avail_score)),
        "experience": max(0.0, min(100.0, exp_score)),
        "location": max(0.0, min(100.0, loc_score)),
        "preferences": max(0.0, min(100.0, pref_score)),
        "profession": max(0.0, min(100.0, profession_score)),
        "content_similarity": max(0.0, min(100.0, content_similarity)),
    }
    available_dimensions = set(WEIGHTS)
    if not v_skills and (req_skills or pref_skills):
        available_dimensions.discard("skills")
    if not v_interests and not v_pref_cats:
        available_dimensions.discard("interests")
    if not v_days:
        available_dimensions.discard("availability")
    if not v_loc and not v_remote:
        available_dimensions.discard("location")
    if not v_exp:
        available_dimensions.discard("experience")
    if not v_profession and not v_education:
        available_dimensions.discard("profession")
    if not v_remote and not v_pref_cats:
        available_dimensions.discard("preferences")
    weight_total = sum(WEIGHTS[key] for key in available_dimensions)
    total = sum(scores[key] * WEIGHTS[key] for key in available_dimensions) / weight_total if weight_total else 0.0
    total = round(max(0.0, min(100.0, total)), 2)

    if total >= 85:
        category = "Excellent Match"
    elif total >= 70:
        category = "Strong Match"
    elif total >= 50:
        category = "Good Match"
    else:
        category = "Partial Match"

    explanation_parts = []
    if matched_skills:
        explanation_parts.append(f"Matches required skills: {', '.join(matched_skills)}.")
    elif req_skills:
        explanation_parts.append("Some required skills are not yet matched.")
    else:
        explanation_parts.append("No strict required skills were specified.")
    if scores["interests"] >= 70:
        explanation_parts.append(f"Your interests align with the {opp.category} category.")
    if scores["availability"] >= 80:
        explanation_parts.append("Your availability is compatible with this opportunity.")
    elif has_schedule_conflict:
        explanation_parts.append("There is a potential schedule conflict with your existing commitments.")
    if opp_mode == "remote" and scores["location"] >= 90:
        explanation_parts.append("Remote/hybrid format fits your location preferences.")
    if scores["experience"] >= 80:
        explanation_parts.append("Your experience meets the stated expectations.")
    if scores["profession"] >= 80:
        explanation_parts.append("Your profession or qualifications fit this opportunity.")
    explanation = " ".join(explanation_parts)[:600]

    suggestions = []
    if missing_skills:
        suggestions.append(f"Build skills: {', '.join(missing_skills[:5])}.")
    if scores["availability"] < 60:
        suggestions.append("Update availability or look for opportunities on matching days/time slots.")
    if scores["experience"] < 60 and opp_exp:
        suggestions.append("Gain related experience or start with beginner-friendly opportunities in this category.")
    if scores["location"] < 60 and opp_mode != "remote":
        suggestions.append("Consider remote opportunities or update your preferred location.")
    if not suggestions:
        suggestions.append("Your profile is a strong fit. Applying soon is recommended.")

    return {
        "opportunity_id": opp.id,
        "opportunity_title": opp.title,
        "organization_name": getattr(getattr(opp, 'organization', None), 'name', None),
        "match_percentage": total,
        "match_category": category,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "interest_compatibility": round(scores["interests"], 2),
        "availability_compatibility": round(scores["availability"], 2),
        "experience_compatibility": round(scores["experience"], 2),
        "location_compatibility": round(scores["location"], 2),
        "preference_compatibility": round(scores["preferences"], 2),
        "profession_compatibility": round(scores["profession"], 2),
        "content_similarity": round(scores["content_similarity"], 2),
        "explanation": explanation,
        "improvement_suggestions": suggestions,
        "has_schedule_conflict": has_schedule_conflict,
        "schedule_conflict_note": conflict_note,
        "breakdown": scores,
    }

def recommend_for_user(db: Session, user: User, limit: int = 50) -> List[Dict[str, Any]]:
    profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == user.id).first()
    opps = db.query(Opportunity).all()
    # precompute approved counts
    approved_rows = db.query(Application.opportunity_id).filter(Application.status == ApplicationStatus.APPROVED).all()
    counts: Dict[int,int] = {}
    for (oid,) in approved_rows:
        counts[oid] = counts.get(oid, 0) + 1
    # existing accepted schedules for conflict hint (by date if available)
    my_sched_dates = set()
    my_apps = db.query(Application).filter(Application.volunteer_id == user.id, Application.status == ApplicationStatus.APPROVED).all()
    app_ids = [a.id for a in my_apps]
    if app_ids:
        scheds = db.query(Schedule).filter(Schedule.application_id.in_(app_ids)).all()
        for s in scheds:
            if s.scheduled_date:
                my_sched_dates.add(s.scheduled_date)
    results = []
    for opp in opps:
        approved = counts.get(opp.id, 0)
        if not is_opportunity_recommendable(opp, approved):
            continue
        conflict = False
        note = None
        if opp.start_date and opp.start_date in my_sched_dates:
            conflict = True
            note = f"Potential conflict: you already have a commitment on {opp.start_date}."
        m = compute_match(profile, opp, has_schedule_conflict=conflict, conflict_note=note)
        m["opportunity"] = {
            "id": opp.id, "title": opp.title, "description": opp.description, "category": opp.category,
            "location": opp.location, "mode": opp.mode, "start_date": opp.start_date.isoformat() if opp.start_date else None,
            "end_date": opp.end_date.isoformat() if opp.end_date else None, "available_days": opp.available_days,
            "working_hours": opp.working_hours, "volunteers_required": opp.volunteers_required,
            "status": opp.status.value, "required_skills": opp.required_skills, "preferred_skills": opp.preferred_skills,
            "organization_name": getattr(getattr(opp,'organization',None),'name',None),
            "cover_image": getattr(opp, "cover_image", None),
            "is_demo": bool(getattr(opp, "is_demo", False)),
            "application_deadline": opp.application_deadline.isoformat() if opp.application_deadline else None,
        }
        results.append(m)
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results[:limit]
