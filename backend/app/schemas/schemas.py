from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime

# Auth & User
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True

# Plot & Geometry
class PlotBase(BaseModel):
    plot_code: str
    name: str
    description: Optional[str] = None
    north_length_m: float = 36.0
    east_length_m: float = 30.0
    west_length_m: float = 31.2
    south_length_m: float = 34.8
    additional_measurement_value: Optional[float] = 80.0
    additional_measurement_unit: Optional[str] = "cm"
    additional_measurement_description: Optional[str] = "Handwritten 80 cm note"
    geometry_geojson: Optional[str] = None
    status: Optional[str] = "Planned"

class PlotCreate(PlotBase):
    block_id: Optional[int] = None

class PlotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    north_length_m: Optional[float] = None
    east_length_m: Optional[float] = None
    west_length_m: Optional[float] = None
    south_length_m: Optional[float] = None
    additional_measurement_value: Optional[float] = None
    geometry_geojson: Optional[str] = None
    status: Optional[str] = None

class PlotOut(PlotBase):
    id: int
    block_id: Optional[int] = None
    crs: str
    area_sqm: Optional[float] = None
    perimeter_m: Optional[float] = None
    geometry_source: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class GeometryUpdate(BaseModel):
    geometry_geojson: str
    notes: Optional[str] = "Updated plot polygon boundary"

# Variety
class VarietyCreate(BaseModel):
    variety_code: str
    variety_name: str
    description: Optional[str] = None
    duration_days: int = 120
    source: Optional[str] = "Paddy Breeding Station"

class VarietyOut(VarietyCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Trial
class TrialCreate(BaseModel):
    trial_code: str
    name: str
    plot_id: int
    crop: str = "Paddy / Rice"
    season: str = "Kharif 2026"
    year: int = 2026
    design_type: str = "RBD" # RBD, Simple Lattice, Replication, Custom
    num_entries: int = 5
    num_replications: int = 3
    start_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    variety_ids: List[int] = []
    notes: Optional[str] = None

class TrialOut(BaseModel):
    id: int
    trial_code: str
    name: str
    plot_id: int
    crop: str
    season: str
    year: int
    design_type: str
    num_entries: int
    num_replications: int
    start_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Layout Engine
class LayoutGenerateRequest(BaseModel):
    plot_id: int
    trial_id: int
    design_type: str = "RBD"
    num_rows: int = 20
    row_spacing_cm: float = 20.0
    plant_spacing_cm: float = 15.0
    border_buffer_m: float = 0.5
    pathway_width_m: float = 0.5
    num_entries: int = 5
    num_replications: int = 3
    randomization_seed: Optional[int] = 42

class LayoutOut(BaseModel):
    id: int
    plot_id: int
    trial_id: int
    version_number: int
    design_type: str
    num_rows: int
    row_spacing_cm: float
    plant_spacing_cm: float
    border_buffer_m: float
    pathway_width_m: float
    randomization_seed: Optional[int] = None
    parameters_json: Optional[str] = None
    generated_grid_json: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Planting
class PlantingCreate(BaseModel):
    trial_id: int
    plot_id: int
    layout_id: Optional[int] = None
    planting_date: str
    status: str # Planned, Planted, Partially Planted, Failed, Replanted
    notes: Optional[str] = None

class PlantingOut(PlantingCreate):
    id: int
    updated_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Trait & Observations
class TraitCreate(BaseModel):
    trait_code: str
    name: str
    category: str = "Morphological"
    unit: Optional[str] = "cm"
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    description: Optional[str] = None

class TraitOut(TraitCreate):
    id: int
    
    class Config:
        from_attributes = True

class ObservationCreate(BaseModel):
    trial_id: int
    plot_id: int
    entry_id: Optional[int] = None
    experimental_unit_id: Optional[int] = None
    trait_id: int
    replication: Optional[int] = None
    row_number: Optional[int] = None
    plant_position: Optional[int] = None
    value: float
    unit: Optional[str] = None
    observation_date: str
    remarks: Optional[str] = None

class ObservationOut(ObservationCreate):
    id: int
    recorded_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Harvest
class HarvestCreate(BaseModel):
    trial_id: int
    plot_id: int
    entry_id: int
    replication: int
    harvest_date: str
    yield_value: float
    yield_unit: str = "kg/plot"
    grain_weight: Optional[float] = None
    moisture_percentage: Optional[float] = None
    notes: Optional[str] = None

class HarvestOut(HarvestCreate):
    id: int
    recorded_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True
