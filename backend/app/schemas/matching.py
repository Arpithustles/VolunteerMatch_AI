from pydantic import BaseModel
from typing import List, Optional, Any

class MatchBreakdown(BaseModel):
    skills: float
    interests: float
    availability: float
    experience: float
    location: float
    preferences: float
    profession: float
    content_similarity: float

class MatchResult(BaseModel):
    opportunity_id: int
    opportunity_title: str
    organization_name: Optional[str] = None
    match_percentage: float
    match_category: str
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    interest_compatibility: float
    availability_compatibility: float
    experience_compatibility: float
    location_compatibility: float
    preference_compatibility: float
    profession_compatibility: float
    content_similarity: float
    breakdown: MatchBreakdown
    explanation: str
    improvement_suggestions: List[str] = []
    has_schedule_conflict: bool = False
    schedule_conflict_note: Optional[str] = None
    opportunity: Optional[dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    items: List[MatchResult]
    total: int

class AssistantRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class AssistantResponse(BaseModel):
    reply: str
    conversation_id: Optional[int] = None
    opportunities: List[dict[str, Any]] = []
