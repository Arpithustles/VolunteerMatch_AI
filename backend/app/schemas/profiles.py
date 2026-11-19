from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class VolunteerProfileBase(BaseModel):
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    profession: Optional[str] = None
    profession_details: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    interests: Optional[str] = None
    experience: Optional[str] = None
    preferred_categories: Optional[str] = None
    availability_days: Optional[str] = None
    available_time_slots: Optional[str] = None
    remote_preference: Optional[str] = None
    maximum_travel_distance: Optional[int] = None
    willing_to_travel: Optional[bool] = None
    volunteering_preference: Optional[str] = None
    weekday_availability: Optional[bool] = None
    weekend_availability: Optional[bool] = None
    skill_proficiency: Optional[str] = None
    safety_declaration: Optional[str] = None
    profile_status: Optional[str] = None
    languages: Optional[str] = None
    description: Optional[str] = None

class VolunteerProfileUpdate(VolunteerProfileBase):
    full_name: Optional[str] = None

class VolunteerProfileOut(VolunteerProfileBase):
    id: int
    user_id: int
    updated_at: Optional[datetime] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    completion_percentage: int = 0
    missing_sections: list[str] = Field(default_factory=list)
    class Config:
        from_attributes = True

class OrganizationBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mission: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None

class OrganizationUpdate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True
