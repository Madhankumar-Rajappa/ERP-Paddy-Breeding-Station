import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import Plot, PlotGeometryVersion, PlotStatusHistory, AuditLog, Trial, Block
from app.schemas.schemas import PlotCreate, PlotUpdate, PlotOut, GeometryUpdate
from app.services.gis_service import generate_prototype_polygon, calculate_area_and_perimeter

router = APIRouter(prefix="/plots", tags=["Plot Management"])

@router.get("", response_model=List[PlotOut])
def list_plots(db: Session = Depends(get_db)):
    return db.query(Plot).all()

@router.get("/{plot_id}", response_model=PlotOut)
def get_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail=f"Plot with ID {plot_id} not found")
    return plot

@router.post("", response_model=PlotOut)
def create_plot(plot_in: PlotCreate, db: Session = Depends(get_db)):
    existing = db.query(Plot).filter(Plot.plot_code == plot_in.plot_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Plot code {plot_in.plot_code} already exists")
        
    # Generate prototype geometry if not provided
    geo_json_str = plot_in.geometry_geojson
    if not geo_json_str:
        poly_dict = generate_prototype_polygon(
            north_m=plot_in.north_length_m,
            east_m=plot_in.east_length_m,
            west_m=plot_in.west_length_m,
            south_m=plot_in.south_length_m
        )
        geo_json_str = json.dumps(poly_dict)
        
    area, perim = calculate_area_and_perimeter(geo_json_str)
    
    plot = Plot(
        plot_code=plot_in.plot_code,
        name=plot_in.name,
        block_id=plot_in.block_id,
        description=plot_in.description,
        north_length_m=plot_in.north_length_m,
        east_length_m=plot_in.east_length_m,
        west_length_m=plot_in.west_length_m,
        south_length_m=plot_in.south_length_m,
        additional_measurement_value=plot_in.additional_measurement_value,
        additional_measurement_unit=plot_in.additional_measurement_unit,
        additional_measurement_description=plot_in.additional_measurement_description,
        geometry_geojson=geo_json_str,
        area_sqm=area,
        perimeter_m=perim,
        status=plot_in.status or "Planned"
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)
    
    # Save initial geometry version
    ver = PlotGeometryVersion(
        plot_id=plot.id,
        version_number=1,
        geometry_geojson=geo_json_str,
        source="Prototype Geometry",
        notes="Initial creation"
    )
    db.add(ver)
    db.commit()
    return plot

@router.put("/{plot_id}", response_model=PlotOut)
def update_plot(plot_id: int, plot_in: PlotUpdate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    for field, val in plot_in.model_dump(exclude_unset=True).items():
        setattr(plot, field, val)
        
    if plot_in.geometry_geojson:
        area, perim = calculate_area_and_perimeter(plot_in.geometry_geojson)
        plot.area_sqm = area
        plot.perimeter_m = perim
        
    db.commit()
    db.refresh(plot)
    return plot

@router.put("/{plot_id}/geometry")
def update_plot_geometry(plot_id: int, geo_in: GeometryUpdate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    area, perim = calculate_area_and_perimeter(geo_in.geometry_geojson)
    plot.geometry_geojson = geo_in.geometry_geojson
    plot.area_sqm = area
    plot.perimeter_m = perim
    plot.geometry_source = "User Edited Boundary"
    
    # Get latest version number
    latest_ver = db.query(PlotGeometryVersion).filter(PlotGeometryVersion.plot_id == plot_id).order_by(PlotGeometryVersion.version_number.desc()).first()
    new_ver_num = (latest_ver.version_number + 1) if latest_ver else 1
    
    ver = PlotGeometryVersion(
        plot_id=plot_id,
        version_number=new_ver_num,
        geometry_geojson=geo_in.geometry_geojson,
        source="Boundary Editor",
        notes=geo_in.notes or f"Updated boundary v{new_ver_num}"
    )
    db.add(ver)
    
    audit = AuditLog(
        user_name="Researcher",
        action="UPDATE_GEOMETRY",
        entity="Plot",
        entity_id=str(plot_id),
        new_value_json=json.dumps({"version": new_ver_num, "area": area, "perimeter": perim})
    )
    db.add(audit)
    
    db.commit()
    return {"message": "Geometry updated successfully", "version": new_ver_num, "area_sqm": area, "perimeter_m": perim}

@router.get("/{plot_id}/history")
def get_plot_history(plot_id: int, db: Session = Depends(get_db)):
    status_hist = db.query(PlotStatusHistory).filter(PlotStatusHistory.plot_id == plot_id).order_by(PlotStatusHistory.timestamp.desc()).all()
    geo_versions = db.query(PlotGeometryVersion).filter(PlotGeometryVersion.plot_id == plot_id).order_by(PlotGeometryVersion.version_number.desc()).all()
    
    return {
        "status_history": [
            {
                "id": h.id,
                "status": h.status,
                "changed_by": h.changed_by,
                "notes": h.notes,
                "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M:%S") if h.timestamp else ""
            } for h in status_hist
        ],
        "geometry_versions": [
            {
                "id": g.id,
                "version_number": g.version_number,
                "source": g.source,
                "notes": g.notes,
                "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S") if g.created_at else ""
            } for g in geo_versions
        ]
    }

@router.delete("/{plot_id}")
def delete_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    active_trials = db.query(Trial).filter(Trial.plot_id == plot_id).count()
    if active_trials > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete plot '{plot.plot_code}' because it has {active_trials} active trial(s) associated with it."
        )
        
    db.delete(plot)
    db.commit()
    return {"message": f"Plot '{plot.plot_code}' deleted successfully"}
