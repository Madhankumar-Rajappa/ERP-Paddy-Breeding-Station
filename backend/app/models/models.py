from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="Field Staff") # Administrator, Researcher, Field Staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Station(Base):
    __tablename__ = "stations"
    
    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    boundary_geojson = Column(Text, nullable=True) # Stored GeoJSON
    location_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    blocks = relationship("Block", back_populates="station", cascade="all, delete-orphan")

class Block(Base):
    __tablename__ = "blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    block_code = Column(String(50), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    boundary_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    station = relationship("Station", back_populates="blocks")
    plots = relationship("Plot", back_populates="block", cascade="all, delete-orphan")

class Plot(Base):
    __tablename__ = "plots"
    
    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    plot_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. E4A
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Measurements from field notes
    north_length_m = Column(Float, nullable=False, default=36.0)
    east_length_m = Column(Float, nullable=False, default=30.0)
    west_length_m = Column(Float, nullable=False, default=31.2)
    south_length_m = Column(Float, nullable=False, default=34.8)
    
    additional_measurement_value = Column(Float, nullable=True, default=80.0)
    additional_measurement_unit = Column(String(20), nullable=True, default="cm")
    additional_measurement_description = Column(String(255), nullable=True, default="Handwritten 80 cm note (unspecified meaning/bund width)")
    
    # GIS Geometry & Attributes
    geometry_geojson = Column(Text, nullable=True) # Polygon GeoJSON
    crs = Column(String(50), default="EPSG:4326")
    area_sqm = Column(Float, nullable=True)
    perimeter_m = Column(Float, nullable=True)
    status = Column(String(50), default="Planned") # Planned, Prepared, Planted, Growing, Harvesting, Harvested, Completed
    geometry_source = Column(String(100), default="Prototype / Local Coordinate Geometry")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    block = relationship("Block", back_populates="plots")
    geometry_versions = relationship("PlotGeometryVersion", back_populates="plot", cascade="all, delete-orphan")
    trials = relationship("Trial", back_populates="plot", cascade="all, delete-orphan")
    layouts = relationship("Layout", back_populates="plot", cascade="all, delete-orphan")
    status_history = relationship("PlotStatusHistory", back_populates="plot", cascade="all, delete-orphan")

class PlotGeometryVersion(Base):
    __tablename__ = "plot_geometry_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    geometry_geojson = Column(Text, nullable=False)
    source = Column(String(100), default="User Edit")
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    plot = relationship("Plot", back_populates="geometry_versions")

class Variety(Base):
    __tablename__ = "varieties"
    
    id = Column(Integer, primary_key=True, index=True)
    variety_code = Column(String(50), unique=True, index=True, nullable=False)
    variety_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=True, default=120)
    source = Column(String(100), nullable=True, default="CGIAR / National Rice Station")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Trial(Base):
    __tablename__ = "trials"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    crop = Column(String(50), default="Paddy / Rice")
    season = Column(String(50), default="Kharif 2026")
    year = Column(Integer, default=2026)
    design_type = Column(String(50), default="RBD") # RBD, Simple Lattice, Replication, Custom
    num_entries = Column(Integer, default=5)
    num_replications = Column(Integer, default=3)
    start_date = Column(String(30), nullable=True)
    expected_harvest_date = Column(String(30), nullable=True)
    status = Column(String(50), default="Planned")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    plot = relationship("Plot", back_populates="trials")
    entries = relationship("TrialEntry", back_populates="trial", cascade="all, delete-orphan")
    layouts = relationship("Layout", back_populates="trial", cascade="all, delete-orphan")

class TrialEntry(Base):
    __tablename__ = "trial_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    variety_id = Column(Integer, ForeignKey("varieties.id"), nullable=False)
    entry_number = Column(Integer, nullable=False)
    treatment_code = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    trial = relationship("Trial", back_populates="entries")
    variety = relationship("Variety")

class Layout(Base):
    __tablename__ = "layouts"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    design_type = Column(String(50), default="RBD")
    num_rows = Column(Integer, nullable=False, default=20)
    row_spacing_cm = Column(Float, nullable=False, default=20.0)
    plant_spacing_cm = Column(Float, nullable=False, default=15.0)
    border_buffer_m = Column(Float, nullable=False, default=0.5)
    pathway_width_m = Column(Float, nullable=False, default=0.5)
    randomization_seed = Column(Integer, nullable=True, default=42)
    parameters_json = Column(Text, nullable=True)
    generated_grid_json = Column(Text, nullable=True) # Complete layout grid payload
    status = Column(String(50), default="Active") # Active, Archived
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    plot = relationship("Plot", back_populates="layouts")
    trial = relationship("Trial", back_populates="layouts")
    units = relationship("ExperimentalUnit", back_populates="layout", cascade="all, delete-orphan")

class ExperimentalUnit(Base):
    __tablename__ = "experimental_units"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    layout_id = Column(Integer, ForeignKey("layouts.id"), nullable=False)
    unit_code = Column(String(50), nullable=False) # e.g. R1-E1
    replication = Column(Integer, nullable=False)
    entry_id = Column(Integer, ForeignKey("trial_entries.id"), nullable=True)
    row_number = Column(Integer, nullable=False)
    start_position = Column(Integer, default=1)
    end_position = Column(Integer, default=10)
    geometry_geojson = Column(Text, nullable=True)
    
    layout = relationship("Layout", back_populates="units")

class PlantingRecord(Base):
    __tablename__ = "planting_records"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    layout_id = Column(Integer, ForeignKey("layouts.id"), nullable=True)
    planting_date = Column(String(30), nullable=False)
    status = Column(String(50), default="Planted") # Planned, Planted, Partially Planted, Failed, Replanted
    updated_by = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ObservationTrait(Base):
    __tablename__ = "observation_traits"
    
    id = Column(Integer, primary_key=True, index=True)
    trait_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="Morphological") # Morphological, Physiological, Disease, Yield
    unit = Column(String(30), nullable=True)
    min_val = Column(Float, nullable=True)
    max_val = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

class Observation(Base):
    __tablename__ = "observations"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    entry_id = Column(Integer, ForeignKey("varieties.id"), nullable=True)
    experimental_unit_id = Column(Integer, ForeignKey("experimental_units.id"), nullable=True)
    trait_id = Column(Integer, ForeignKey("observation_traits.id"), nullable=False)
    replication = Column(Integer, nullable=True)
    row_number = Column(Integer, nullable=True)
    plant_position = Column(Integer, nullable=True)
    value = Column(Float, nullable=False)
    unit = Column(String(30), nullable=True)
    observation_date = Column(String(30), nullable=False)
    recorded_by = Column(String(100), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    trait = relationship("ObservationTrait")

class HarvestRecord(Base):
    __tablename__ = "harvest_records"
    
    id = Column(Integer, primary_key=True, index=True)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    entry_id = Column(Integer, ForeignKey("varieties.id"), nullable=False)
    replication = Column(Integer, nullable=False)
    harvest_date = Column(String(30), nullable=False)
    yield_value = Column(Float, nullable=False)
    yield_unit = Column(String(20), default="kg/plot")
    grain_weight = Column(Float, nullable=True) # 1000 grain weight in grams
    moisture_percentage = Column(Float, nullable=True)
    recorded_by = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    variety = relationship("Variety")

class PlotStatusHistory(Base):
    __tablename__ = "plot_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    trial_id = Column(Integer, ForeignKey("trials.id"), nullable=True)
    status = Column(String(50), nullable=False)
    changed_by = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    plot = relationship("Plot", back_populates="status_history")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(50), nullable=True)
    old_value_json = Column(Text, nullable=True)
    new_value_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
