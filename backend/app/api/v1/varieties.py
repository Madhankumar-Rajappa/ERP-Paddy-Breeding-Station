from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Variety
from app.schemas.schemas import VarietyCreate, VarietyOut

router = APIRouter(prefix="/varieties", tags=["Variety Management"])

@router.get("", response_model=List[VarietyOut])
def list_varieties(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Variety)
    if search:
        query = query.filter(
            (Variety.variety_name.ilike(f"%{search}%")) | 
            (Variety.variety_code.ilike(f"%{search}%"))
        )
    return query.all()

@router.post("", response_model=VarietyOut)
def create_variety(variety_in: VarietyCreate, db: Session = Depends(get_db)):
    existing = db.query(Variety).filter(Variety.variety_code == variety_in.variety_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Variety code {variety_in.variety_code} already exists")
        
    variety = Variety(**variety_in.model_dump())
    db.add(variety)
    db.commit()
    db.refresh(variety)
    return variety

@router.get("/{variety_id}", response_model=VarietyOut)
def get_variety(variety_id: int, db: Session = Depends(get_db)):
    variety = db.query(Variety).filter(Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="Variety not found")
    return variety

@router.delete("/{variety_id}")
def delete_variety(variety_id: int, db: Session = Depends(get_db)):
    from app.models.models import TrialEntry, Observation, HarvestRecord
    variety = db.query(Variety).filter(Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="Variety not found")
        
    in_trials = db.query(TrialEntry).filter(TrialEntry.variety_id == variety_id).first()
    in_obs = db.query(Observation).filter(Observation.entry_id == variety_id).first()
    in_harvest = db.query(HarvestRecord).filter(HarvestRecord.entry_id == variety_id).first()
    
    if in_trials or in_obs or in_harvest:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete variety '{variety.variety_name}' because it is linked to active trials, observations, or harvest records."
        )
        
    db.delete(variety)
    db.commit()
    return {"message": "Variety deleted successfully"}

