from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import HarvestRecord, Variety, Plot, PlotStatusHistory, AuditLog
from app.schemas.schemas import HarvestCreate, HarvestOut

router = APIRouter(prefix="/harvest", tags=["Harvest Management"])

@router.get("/trial/{trial_id}")
def get_harvest_records(trial_id: int, db: Session = Depends(get_db)):
    records = db.query(HarvestRecord).filter(HarvestRecord.trial_id == trial_id).order_by(HarvestRecord.created_at.desc()).all()
    res = []
    for r in records:
        v = db.query(Variety).filter(Variety.id == r.entry_id).first()
        res.append({
            "id": r.id,
            "trial_id": r.trial_id,
            "plot_id": r.plot_id,
            "entry_id": r.entry_id,
            "variety_code": v.variety_code if v else "",
            "variety_name": v.variety_name if v else "Variety",
            "replication": r.replication,
            "harvest_date": r.harvest_date,
            "yield_value": r.yield_value,
            "yield_unit": r.yield_unit,
            "grain_weight": r.grain_weight,
            "moisture_percentage": r.moisture_percentage,
            "recorded_by": r.recorded_by,
            "notes": r.notes,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""
        })
    return res

@router.post("", response_model=HarvestOut)
def record_harvest(harvest_in: HarvestCreate, db: Session = Depends(get_db)):
    variety = db.query(Variety).filter(Variety.id == harvest_in.entry_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="Variety not found")
        
    rec = HarvestRecord(
        trial_id=harvest_in.trial_id,
        plot_id=harvest_in.plot_id,
        entry_id=harvest_in.entry_id,
        replication=harvest_in.replication,
        harvest_date=harvest_in.harvest_date,
        yield_value=harvest_in.yield_value,
        yield_unit=harvest_in.yield_unit,
        grain_weight=harvest_in.grain_weight,
        moisture_percentage=harvest_in.moisture_percentage,
        recorded_by="Field Staff",
        notes=harvest_in.notes
    )
    db.add(rec)
    
    # Update plot status to Harvested
    plot = db.query(Plot).filter(Plot.id == harvest_in.plot_id).first()
    if plot and plot.status != "Harvested":
        plot.status = "Harvested"
        hist = PlotStatusHistory(
            plot_id=plot.id,
            trial_id=harvest_in.trial_id,
            status="Harvested",
            changed_by="Field Staff",
            notes=f"Harvest recorded for {variety.variety_name}"
        )
        db.add(hist)
        
    audit = AuditLog(
        user_name="Field Staff",
        action="RECORD_HARVEST",
        entity="Harvest",
        entity_id=str(harvest_in.trial_id),
        new_value_json=f"Variety: {variety.variety_name}, Yield: {harvest_in.yield_value} {harvest_in.yield_unit}"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(rec)
    return rec
