import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Plot, Trial, TrialEntry, Variety, Layout, PlantingRecord, Observation, HarvestRecord, PlotStatusHistory

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/plots/{plot_id}")
def get_plot_dashboard_summary(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    active_trial = db.query(Trial).filter(Trial.plot_id == plot_id).order_by(Trial.created_at.desc()).first()
    
    trial_data = None
    entries_count = 0
    reps_count = 0
    varieties_list = []
    
    if active_trial:
        entries_count = active_trial.num_entries
        reps_count = active_trial.num_replications
        entries = db.query(TrialEntry).filter(TrialEntry.trial_id == active_trial.id).all()
        for e in entries:
            v = db.query(Variety).filter(Variety.id == e.variety_id).first()
            if v:
                varieties_list.append({
                    "id": v.id,
                    "code": v.variety_code,
                    "name": v.variety_name,
                    "duration": v.duration_days
                })
        trial_data = {
            "id": active_trial.id,
            "trial_code": active_trial.trial_code,
            "name": active_trial.name,
            "crop": active_trial.crop,
            "season": active_trial.season,
            "year": active_trial.year,
            "design_type": active_trial.design_type,
            "start_date": active_trial.start_date,
            "expected_harvest_date": active_trial.expected_harvest_date
        }
        
    latest_layout = db.query(Layout).filter(Layout.plot_id == plot_id).order_by(Layout.version_number.desc()).first()
    layout_data = None
    if latest_layout:
        layout_data = {
            "id": latest_layout.id,
            "version_number": latest_layout.version_number,
            "row_spacing_cm": latest_layout.row_spacing_cm,
            "plant_spacing_cm": latest_layout.plant_spacing_cm,
            "num_rows": latest_layout.num_rows,
            "grid_summary": json.loads(latest_layout.generated_grid_json).get("summary") if latest_layout.generated_grid_json else None
        }
        
    planting = db.query(PlantingRecord).filter(PlantingRecord.plot_id == plot_id).order_by(PlantingRecord.created_at.desc()).first()
    
    # Observations analytics
    obs_count = db.query(Observation).filter(Observation.plot_id == plot_id).count()
    
    # Harvest analytics
    harvest_records = db.query(HarvestRecord).filter(HarvestRecord.plot_id == plot_id).all()
    total_yield = sum(h.yield_value for h in harvest_records)
    avg_moisture = (sum(h.moisture_percentage for h in harvest_records if h.moisture_percentage) / len(harvest_records)) if harvest_records else 0
    
    # Timeline History
    history = db.query(PlotStatusHistory).filter(PlotStatusHistory.plot_id == plot_id).order_by(PlotStatusHistory.timestamp.asc()).all()
    timeline = [
        {
            "status": h.status,
            "changed_by": h.changed_by,
            "notes": h.notes,
            "date": h.timestamp.strftime("%Y-%m-%d") if h.timestamp else ""
        } for h in history
    ]
    
    return {
        "plot": {
            "id": plot.id,
            "plot_code": plot.plot_code,
            "name": plot.name,
            "north_length_m": plot.north_length_m,
            "east_length_m": plot.east_length_m,
            "west_length_m": plot.west_length_m,
            "south_length_m": plot.south_length_m,
            "additional_measurement_value": plot.additional_measurement_value,
            "additional_measurement_unit": plot.additional_measurement_unit,
            "additional_measurement_description": plot.additional_measurement_description,
            "area_sqm": plot.area_sqm,
            "perimeter_m": plot.perimeter_m,
            "status": plot.status,
            "geometry_source": plot.geometry_source
        },
        "trial": trial_data,
        "entries_count": entries_count,
        "replications_count": reps_count,
        "varieties": varieties_list,
        "layout": layout_data,
        "planting": {
            "date": planting.planting_date if planting else None,
            "status": planting.status if planting else plot.status,
            "notes": planting.notes if planting else None
        } if planting else None,
        "observations_count": obs_count,
        "harvest": {
            "total_yield_kg": round(total_yield, 2),
            "avg_moisture_pct": round(avg_moisture, 1),
            "records_count": len(harvest_records)
        },
        "timeline": timeline
    }
