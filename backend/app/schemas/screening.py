from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PatientBase(BaseModel):
    full_name: str
    age: int
    gender: str
    village: str
    phone: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientInDB(PatientBase):
    id: int
    health_worker_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ScreeningBase(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    smoking_status: Optional[str] = None
    alcohol_usage: Optional[str] = None
    physical_activity: Optional[str] = None
    glucose_level: Optional[float] = None
    cholesterol_level: Optional[float] = None

class ScreeningCreate(ScreeningBase):
    patient_id: int

class ScreeningInDB(ScreeningBase):
    id: int
    patient_id: int
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
