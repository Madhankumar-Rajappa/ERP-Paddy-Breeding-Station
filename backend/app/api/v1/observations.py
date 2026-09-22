from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.models import ObservationTrait, Observation, Variety, AuditLog
from app.schemas.schemas import TraitCreate, TraitOut, ObservationCreate, ObservationOut

router = APIRouter(prefix="/observations", tags=["Observation Management"])

@router.get("/traits", response_model=List[TraitOut])
def list_traits(db: Session = Depends(get_db)):
    return db.query(ObservationTrait).all()

@router.post("/traits", response_model=TraitOut)
def create_trait(trait_in: TraitCreate, db: Session = Depends(get_db)):
    existing = db.query(ObservationTrait).filter(ObservationTrait.trait_code == trait_in.trait_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Trait code already exists")
    trait = ObservationTrait(**trait_in.model_dump())
    db.add(trait)
    db.commit()
    db.refresh(trait)
    return trait

@router.get("/trial/{trial_id}")
def get_trial_observations(trial_id: int, db: Session = Depends(get_db)):
    obs_list = db.query(Observation).filter(Observation.trial_id == trial_id).order_by(Observation.created_at.desc()).all()
    res = []
    for o in obs_list:
        trait = db.query(ObservationTrait).filter(ObservationTrait.id == o.trait_id).first()
        var = db.query(Variety).filter(Variety.id == o.entry_id).first() if o.entry_id else None
        res.append({
            "id": o.id,
            "trial_id": o.trial_id,
            "plot_id": o.plot_id,
            "entry_id": o.entry_id,
            "variety_name": var.variety_name if var else "N/A",
            "trait_id": o.trait_id,
            "trait_code": trait.trait_code if trait else "",
            "trait_name": trait.name if trait else "Trait",
            "replication": o.replication,
            "row_number": o.row_number,
            "plant_position": o.plant_position,
            "value": o.value,
            "unit": o.unit or (trait.unit if trait else ""),
            "observation_date": o.observation_date,
            "recorded_by": o.recorded_by,
            "remarks": o.remarks,
            "created_at": o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else ""
        })
    return res

@router.post("", response_model=ObservationOut)
def record_observation(obs_in: ObservationCreate, db: Session = Depends(get_db)):
    trait = db.query(ObservationTrait).filter(ObservationTrait.id == obs_in.trait_id).first()
    if not trait:
        raise HTTPException(status_code=404, detail="Trait not found")
        
    obs = Observation(
        trial_id=obs_in.trial_id,
        plot_id=obs_in.plot_id,
        entry_id=obs_in.entry_id,
        experimental_unit_id=obs_in.experimental_unit_id,
        trait_id=obs_in.trait_id,
        replication=obs_in.replication,
        row_number=obs_in.row_number,
        plant_position=obs_in.plant_position,
        value=obs_in.value,
        unit=obs_in.unit or trait.unit,
        observation_date=obs_in.observation_date,
        recorded_by="Researcher",
        remarks=obs_in.remarks
    )
    db.add(obs)
    
    audit = AuditLog(
        user_name="Researcher",
        action="RECORD_OBSERVATION",
        entity="Observation",
        entity_id=str(obs_in.trial_id),
        new_value_json=f"{trait.name}: {obs_in.value} {obs_in.unit or trait.unit}"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(obs)
    return obs
