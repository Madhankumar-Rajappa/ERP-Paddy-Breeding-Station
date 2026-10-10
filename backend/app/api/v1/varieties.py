from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Variety
from app.schemas.schemas import VarietyCreate, VarietyOut
from app.services.report_service import generate_csv_report

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

@router.get("/export/csv")
def export_varieties_csv(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Variety)
    if search:
        query = query.filter(
            (Variety.variety_name.ilike(f"%{search}%")) | 
            (Variety.variety_code.ilike(f"%{search}%"))
        )
    varieties = query.all()
    headers = [
        "ID", "Variety Code", "Variety Name", "Duration (Days)", 
        "Maturity Classification", "Breeding Source", "Description", "Created At"
    ]
    rows = []
    for v in varieties:
        days = v.duration_days or 120
        if days < 115:
            mat_class = "Short (<115 days)"
        elif days <= 135:
            mat_class = "Medium (115-135 days)"
        else:
            mat_class = "Long (>135 days)"
            
        rows.append([
            v.id,
            v.variety_code,
            v.variety_name,
            v.duration_days or "",
            mat_class,
            v.source or "",
            v.description or "",
            v.created_at.strftime("%Y-%m-%d %H:%M") if v.created_at else ""
        ])
    csv_str = generate_csv_report(headers, rows)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paddy_varieties_catalog.csv"}
    )

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

