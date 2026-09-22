from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import PlantingRecord, Plot, PlotStatusHistory, AuditLog
from app.schemas.schemas import PlantingCreate, PlantingOut

router = APIRouter(prefix="/planting", tags=["Planting Management"])

@router.get("/trial/{trial_id}", response_model=List[PlantingOut])
def get_planting_records(trial_id: int, db: Session = Depends(get_db)):
    return db.query(PlantingRecord).filter(PlantingRecord.trial_id == trial_id).order_by(PlantingRecord.created_at.desc()).all()

@router.post("", response_model=PlantingOut)
def record_planting(planting_in: PlantingCreate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == planting_in.plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    rec = PlantingRecord(
        trial_id=planting_in.trial_id,
        plot_id=planting_in.plot_id,
        layout_id=planting_in.layout_id,
        planting_date=planting_in.planting_date,
        status=planting_in.status,
        updated_by="Field Staff",
        notes=planting_in.notes
    )
    db.add(rec)
    
    # Update master plot status
    old_status = plot.status
    plot.status = planting_in.status
    
    hist = PlotStatusHistory(
        plot_id=plot.id,
        trial_id=planting_in.trial_id,
        status=planting_in.status,
        changed_by="Field Staff",
        notes=f"Planting status updated from {old_status} to {planting_in.status}"
    )
    db.add(hist)
    
    audit = AuditLog(
        user_name="Field Staff",
        action="UPDATE_PLANTING_STATUS",
        entity="Plot",
        entity_id=str(plot.id),
        old_value_json=old_status,
        new_value_json=planting_in.status
    )
    db.add(audit)
    
    db.commit()
    db.refresh(rec)
    return rec
