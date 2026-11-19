from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time

class ApplicationCreate(BaseModel):
    opportunity_id: int
    message: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: str

class ApplicationOut(BaseModel):
    id: int
    opportunity_id: int
    volunteer_id: int
    status: str
    message: Optional[str] = None
    applied_at: datetime
    updated_at: Optional[datetime] = None
    opportunity_title: Optional[str] = None
    organization_name: Optional[str] = None
    opportunity_category: Optional[str] = None
    opportunity_cover_image: Optional[str] = None
    opportunity_start_date: Optional[date] = None
    opportunity_location: Optional[str] = None
    opportunity_mode: Optional[str] = None
    is_demo: bool = False
    volunteer_name: Optional[str] = None
    volunteer_email: Optional[str] = None
    class Config:
        from_attributes = True

class ScheduleOut(BaseModel):
    id: int
    application_id: int
    scheduled_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    status: str
    opportunity_title: Optional[str] = None
    organization_name: Optional[str] = None
    has_conflict: bool = False
    conflict_details: Optional[str] = None
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    opportunity_id: int
    assigned_to_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None

class TaskOut(BaseModel):
    id: int
    opportunity_id: int
    assigned_to_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    opportunity_title: Optional[str] = None
    assignee_name: Optional[str] = None
    class Config:
        from_attributes = True

class ParticipationCreate(BaseModel):
    application_id: int
    hours: float
    notes: Optional[str] = None
    verified: bool = True

class ParticipationOut(BaseModel):
    id: int
    application_id: int
    volunteer_id: int
    opportunity_id: int
    hours: float
    verified: bool
    notes: Optional[str] = None
    completed_at: datetime
    opportunity_title: Optional[str] = None
    volunteer_name: Optional[str] = None
    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    application_id: int
    rating: int
    comment: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    application_id: int
    volunteer_id: int
    opportunity_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    opportunity_title: Optional[str] = None
    class Config:
        from_attributes = True
