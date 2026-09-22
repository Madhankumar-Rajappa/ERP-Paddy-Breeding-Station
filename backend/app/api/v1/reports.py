from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Plot, Trial, Observation, ObservationTrait, HarvestRecord, Variety
from app.services.report_service import generate_pdf_report, generate_csv_report

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/pdf/{plot_id}")
def export_pdf_report(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    trial = db.query(Trial).filter(Trial.plot_id == plot_id).order_by(Trial.created_at.desc()).first()
    
    plot_dict = {
        "plot_code": plot.plot_code,
        "name": plot.name,
        "north_length_m": plot.north_length_m,
        "south_length_m": plot.south_length_m,
        "east_length_m": plot.east_length_m,
        "west_length_m": plot.west_length_m,
        "additional_measurement_value": plot.additional_measurement_value,
        "additional_measurement_unit": plot.additional_measurement_unit,
        "status": plot.status
    }
    
    trial_dict = {
        "trial_code": trial.trial_code if trial else "N/A",
        "name": trial.name if trial else "N/A",
        "design_type": trial.design_type if trial else "N/A",
        "season": trial.season if trial else "N/A",
        "year": trial.year if trial else 2026,
        "num_entries": trial.num_entries if trial else 0,
        "num_replications": trial.num_replications if trial else 0
    } if trial else {}
    
    observations = []
    if trial:
        obs_raw = db.query(Observation).filter(Observation.trial_id == trial.id).all()
        for o in obs_raw:
            tr = db.query(ObservationTrait).filter(ObservationTrait.id == o.trait_id).first()
            observations.append({
                "observation_date": o.observation_date,
                "trait_name": tr.name if tr else "Trait",
                "value": o.value,
                "unit": o.unit or "",
                "recorded_by": o.recorded_by
            })
            
    harvest_data = []
    if trial:
        h_raw = db.query(HarvestRecord).filter(HarvestRecord.trial_id == trial.id).all()
        for h in h_raw:
            v = db.query(Variety).filter(Variety.id == h.entry_id).first()
            harvest_data.append({
                "variety_name": v.variety_name if v else "Variety",
                "replication": h.replication,
                "harvest_date": h.harvest_date,
                "yield_value": h.yield_value,
                "grain_weight": h.grain_weight,
                "moisture_percentage": h.moisture_percentage
            })
            
    pdf_bytes = generate_pdf_report(
        title=f"Plot {plot.plot_code} Complete Trial Evaluation",
        plot_data=plot_dict,
        trial_data=trial_dict,
        observations=observations,
        harvest_data=harvest_data
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={plot.plot_code}_Report.pdf"}
    )

@router.get("/csv/{plot_id}")
def export_csv_report(plot_id: int, type: str = "harvest", db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    trial = db.query(Trial).filter(Trial.plot_id == plot_id).order_by(Trial.created_at.desc()).first()
    if not trial:
        raise HTTPException(status_code=404, detail="No active trial found for this plot")
        
    if type == "observations":
        headers = ["Trial ID", "Plot ID", "Trait Code", "Trait Name", "Replication", "Row", "Plant Position", "Value", "Unit", "Date", "Recorded By"]
        rows = []
        obs_raw = db.query(Observation).filter(Observation.trial_id == trial.id).all()
        for o in obs_raw:
            tr = db.query(ObservationTrait).filter(ObservationTrait.id == o.trait_id).first()
            rows.append([
                trial.trial_code, plot.plot_code, tr.trait_code if tr else "", tr.name if tr else "",
                o.replication or "", o.row_number or "", o.plant_position or "", o.value, o.unit or "", o.observation_date, o.recorded_by
            ])
        csv_str = generate_csv_report(headers, rows)
    else:
        headers = ["Trial ID", "Plot ID", "Variety Code", "Variety Name", "Replication", "Harvest Date", "Yield (kg/plot)", "Grain Weight (g)", "Moisture %", "Notes"]
        rows = []
        h_raw = db.query(HarvestRecord).filter(HarvestRecord.trial_id == trial.id).all()
        for h in h_raw:
            v = db.query(Variety).filter(Variety.id == h.entry_id).first()
            rows.append([
                trial.trial_code, plot.plot_code, v.variety_code if v else "", v.variety_name if v else "",
                h.replication, h.harvest_date, h.yield_value, h.grain_weight or "", h.moisture_percentage or "", h.notes or ""
            ])
        csv_str = generate_csv_report(headers, rows)
        
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={plot.plot_code}_{type}_export.csv"}
    )
