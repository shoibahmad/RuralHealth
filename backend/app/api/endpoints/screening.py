from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models.user import User
from backend.app.models.screening import Patient, Screening
from backend.app.schemas.screening import PatientCreate, PatientInDB, ScreeningCreate, ScreeningInDB
from backend.app.api.endpoints.auth import get_db, read_users_me

router = APIRouter()

@router.post("/patients", response_model=PatientInDB)
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(read_users_me)
):
    # Check if patient exists? For now assume new.
    db_patient = Patient(**patient.model_dump(), health_worker_id=current_user.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/patients", response_model=List[PatientInDB])
def get_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(read_users_me)
):
    # Return all patients or just for this worker? Let's return all for now to simulate community view.
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.post("/screenings", response_model=ScreeningInDB)
def create_screening(
    screening: ScreeningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(read_users_me)
):
    # Here we would implement the Risk Calculation Logic
    # For now, simplistic mock logic
    
    risk_score = 0
    if screening.systolic_bp and screening.systolic_bp > 140:
        risk_score += 30
    if screening.glucose_level and screening.glucose_level > 140:
        risk_score += 30
    
    risk_level = "Low"
    if risk_score > 50:
        risk_level = "High"
    elif risk_score > 20:
        risk_level = "Medium"

    db_screening = Screening(
        **screening.model_dump(),
        risk_score=risk_score,
        risk_level=risk_level,
        risk_notes="Automated risk assessment."
    )
    db.add(db_screening)
    db.commit()
    db.refresh(db_screening)
    return db_screening
