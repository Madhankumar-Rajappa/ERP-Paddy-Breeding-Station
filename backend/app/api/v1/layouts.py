import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Plot, Trial, TrialEntry, Variety, Layout, AuditLog
from app.schemas.schemas import LayoutGenerateRequest, LayoutOut
from app.services.layout_engine import generate_rbd_layout

router = APIRouter(prefix="/layouts", tags=["Dynamic Plot Design Engine"])

@router.post("/generate")
def generate_layout(req: LayoutGenerateRequest, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == req.plot_id).first()
    if not plot or not plot.geometry_geojson:
        raise HTTPException(status_code=404, detail="Plot or plot geometry not found")
        
    trial = db.query(Trial).filter(Trial.id == req.trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    entries = db.query(TrialEntry).filter(TrialEntry.trial_id == req.trial_id).all()
    varieties_list = []
    for e in entries:
        v = db.query(Variety).filter(Variety.id == e.variety_id).first()
        if v:
            varieties_list.append({
                "id": v.id,
                "variety_code": v.variety_code,
                "variety_name": v.variety_name
            })
            
    if not varieties_list:
        # Fallback to default entries if none assigned yet
        varieties_list = [{"id": i+1, "variety_code": f"V-{i+1}", "variety_name": f"Paddy Variety {i+1}"} for i in range(req.num_entries)]
        
    layout_data = generate_rbd_layout(
        plot_geometry_geojson=plot.geometry_geojson,
        north_m=plot.north_length_m,
        east_m=plot.east_length_m,
        west_m=plot.west_length_m,
        south_m=plot.south_length_m,
        num_rows=req.num_rows,
        row_spacing_cm=req.row_spacing_cm,
        plant_spacing_cm=req.plant_spacing_cm,
        border_buffer_m=req.border_buffer_m,
        pathway_width_m=req.pathway_width_m,
        num_entries=req.num_entries,
        num_replications=req.num_replications,
        varieties=varieties_list,
        randomization_seed=req.randomization_seed or 42
    )
    
    return layout_data

@router.post("", response_model=LayoutOut)
def save_layout_version(req: LayoutGenerateRequest, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == req.plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    # Generate complete layout grid payload
    layout_grid = generate_layout(req, db)
    
    # Calculate version number
    latest_layout = db.query(Layout).filter(Layout.plot_id == req.plot_id, Layout.trial_id == req.trial_id).order_by(Layout.version_number.desc()).first()
    new_version = (latest_layout.version_number + 1) if latest_layout else 1
    
    # Archive old active layouts for this trial
    db.query(Layout).filter(Layout.trial_id == req.trial_id).update({"status": "Archived"})
    
    layout_obj = Layout(
        plot_id=req.plot_id,
        trial_id=req.trial_id,
        version_number=new_version,
        design_type=req.design_type,
        num_rows=req.num_rows,
        row_spacing_cm=req.row_spacing_cm,
        plant_spacing_cm=req.plant_spacing_cm,
        border_buffer_m=req.border_buffer_m,
        pathway_width_m=req.pathway_width_m,
        randomization_seed=req.randomization_seed,
        parameters_json=json.dumps(req.model_dump()),
        generated_grid_json=json.dumps(layout_grid),
        status="Active",
        created_by="Researcher"
    )
    db.add(layout_obj)
    
    audit = AuditLog(
        user_name="Researcher",
        action="SAVE_LAYOUT",
        entity="Layout",
        entity_id=str(req.plot_id),
        new_value_json=json.dumps({"version": new_version, "design": req.design_type})
    )
    db.add(audit)
    
    db.commit()
    db.refresh(layout_obj)
    return layout_obj

@router.get("/plots/{plot_id}", response_model=List[LayoutOut])
def list_plot_layouts(plot_id: int, db: Session = Depends(get_db)):
    return db.query(Layout).filter(Layout.plot_id == plot_id).order_by(Layout.version_number.desc()).all()

@router.get("/{layout_id}")
def get_layout_detail(layout_id: int, db: Session = Depends(get_db)):
    layout = db.query(Layout).filter(Layout.id == layout_id).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
        
    return {
        "layout": LayoutOut.model_validate(layout),
        "grid": json.loads(layout.generated_grid_json) if layout.generated_grid_json else None
    }
