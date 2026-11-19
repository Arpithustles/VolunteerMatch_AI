from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class OpportunityBase(BaseModel):
    title: str
    description: str
    category: str
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    experience_required: Optional[str] = None
    location: Optional[str] = None
    mode: str = "on-site"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    available_days: Optional[str] = None
    working_hours: Optional[str] = None
    volunteers_required: int = 1
    application_deadline: Optional[date] = None
    cover_image: Optional[str] = None
    status: Optional[str] = "open"

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    experience_required: Optional[str] = None
    location: Optional[str] = None
    mode: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    available_days: Optional[str] = None
    working_hours: Optional[str] = None
    volunteers_required: Optional[int] = None
    application_deadline: Optional[date] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None

class OpportunityOut(OpportunityBase):
    id: int
    organization_id: int
    organization_name: Optional[str] = None
    created_at: Optional[datetime] = None
    approved_count: int = 0
    is_full: bool = False
    is_demo: bool = False
    class Config:
        from_attributes = True

class OpportunityList(BaseModel):
    items: List[OpportunityOut]
    total: int
    page: int
    page_size: int
