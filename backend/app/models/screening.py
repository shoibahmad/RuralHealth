from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.base import Base
import enum

class Gender(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class RiskLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    health_worker_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String) # Storing Enum as string for simplicity
    village = Column(String, index=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    screenings = relationship("Screening", back_populates="patient")
    # health_worker = relationship("User", back_populates="patients") # If we add back_populates to User

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Vitals
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    
    # Lifestyle
    smoking_status = Column(String, nullable=True) # "Never", "Former", "Current"
    alcohol_usage = Column(String, nullable=True)
    physical_activity = Column(String, nullable=True)
    
    # Lab Data (Optional)
    glucose_level = Column(Float, nullable=True)
    cholesterol_level = Column(Float, nullable=True)
    
    # Result
    risk_score = Column(Float, nullable=True) # 0-100
    risk_level = Column(String, default=RiskLevel.LOW.value)
    risk_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="screenings")
