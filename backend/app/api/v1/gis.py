import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.models.models import Plot, Station, Block, Trial, Layout
from app.services.gis_service import calculate_area_and_perimeter

router = APIRouter(prefix="/gis", tags=["GIS Engine"])

@router.get("/layers")
def get_gis_layers(db: Session = Depends(get_db)):
    """Returns complete GeoJSON FeatureCollection containing Station, Block, Plots, and active layout features."""
    features = []
    
    # 1. Station Features
    stations = db.query(Station).all()
    for st in stations:
        if st.boundary_geojson:
            features.append({
                "type": "Feature",
                "properties": {
                    "id": st.id,
                    "layer_type": "station",
                    "code": st.station_code,
                    "name": st.name,
                    "location": st.location_name
                },
                "geometry": json.loads(st.boundary_geojson)
            })
            
    # 2. Block Features
    blocks = db.query(Block).all()
    for bk in blocks:
        if bk.boundary_geojson:
            features.append({
                "type": "Feature",
                "properties": {
                    "id": bk.id,
                    "layer_type": "block",
                    "code": bk.block_code,
                    "name": bk.name
                },
                "geometry": json.loads(bk.boundary_geojson)
            })
            
    # 3. Plot Features
    plots = db.query(Plot).all()
    for pt in plots:
        if pt.geometry_geojson:
            # Check active trial
            active_trial = db.query(Trial).filter(Trial.plot_id == pt.id).order_by(Trial.created_at.desc()).first()
            trial_info = {
                "id": active_trial.id,
                "name": active_trial.name,
                "design": active_trial.design_type,
                "crop": active_trial.crop
            } if active_trial else None
            
            features.append({
                "type": "Feature",
                "properties": {
                    "id": pt.id,
                    "layer_type": "plot",
                    "plot_code": pt.plot_code,
                    "name": pt.name,
                    "north_length_m": pt.north_length_m,
                    "east_length_m": pt.east_length_m,
                    "west_length_m": pt.west_length_m,
                    "south_length_m": pt.south_length_m,
                    "additional_measurement_value": pt.additional_measurement_value,
                    "additional_measurement_unit": pt.additional_measurement_unit,
                    "additional_measurement_description": pt.additional_measurement_description,
                    "area_sqm": pt.area_sqm,
                    "perimeter_m": pt.perimeter_m,
                    "status": pt.status,
                    "geometry_source": pt.geometry_source,
                    "current_trial": trial_info
                },
                "geometry": json.loads(pt.geometry_geojson)
            })
            
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/plots/{plot_id}/geojson")
def export_plot_geojson(plot_id: int, db: Session = Depends(get_db)):
    """Exports single plot polygon as a QGIS-compatible GeoJSON Feature."""
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot or not plot.geometry_geojson:
        raise HTTPException(status_code=404, detail="Plot polygon geometry not found")
        
    return {
        "type": "Feature",
        "properties": {
            "plot_id": plot.id,
            "plot_code": plot.plot_code,
            "name": plot.name,
            "north_length_m": plot.north_length_m,
            "east_length_m": plot.east_length_m,
            "west_length_m": plot.west_length_m,
            "south_length_m": plot.south_length_m,
            "additional_measurement_value": plot.additional_measurement_value,
            "additional_measurement_unit": plot.additional_measurement_unit,
            "area_sqm": plot.area_sqm,
            "perimeter_m": plot.perimeter_m,
            "status": plot.status,
            "crs": plot.crs
        },
        "geometry": json.loads(plot.geometry_geojson)
    }

@router.post("/plots/{plot_id}/geojson/import")
async def import_plot_geojson(plot_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Imports GeoJSON boundary file, validates geometry, and associates with plot."""
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    content = await file.read()
    try:
        geo_data = json.loads(content.decode("utf-8"))
        
        # Extract geometry if passed inside Feature/FeatureCollection
        geometry = geo_data
        if geo_data.get("type") == "Feature":
            geometry = geo_data.get("geometry")
        elif geo_data.get("type") == "FeatureCollection":
            geometry = geo_data["features"][0].get("geometry")
            
        geo_str = json.dumps(geometry)
        area, perim = calculate_area_and_perimeter(geo_str)
        
        plot.geometry_geojson = geo_str
        plot.area_sqm = area
        plot.perimeter_m = perim
        plot.geometry_source = f"Uploaded GeoJSON ({file.filename})"
        db.commit()
        db.refresh(plot)
        return {"message": "GeoJSON polygon imported successfully", "area_sqm": area, "perimeter_m": perim}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid GeoJSON file: {str(e)}")
