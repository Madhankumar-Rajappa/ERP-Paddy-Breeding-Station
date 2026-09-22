from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Trial, TrialEntry, Plot, Variety, AuditLog
from app.schemas.schemas import TrialCreate, TrialOut

router = APIRouter(prefix="/trials", tags=["Trial Management"])

@router.get("", response_model=List[TrialOut])
def list_trials(db: Session = Depends(get_db)):
    return db.query(Trial).all()

@router.get("/{trial_id}")
def get_trial_detail(trial_id: int, db: Session = Depends(get_db)):
    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
        
    entries = db.query(TrialEntry).filter(TrialEntry.trial_id == trial_id).all()
    entries_list = []
    for e in entries:
        v = db.query(Variety).filter(Variety.id == e.variety_id).first()
        entries_list.append({
            "id": e.id,
            "entry_number": e.entry_number,
            "variety_id": e.variety_id,
            "variety_code": v.variety_code if v else "",
            "variety_name": v.variety_name if v else "",
            "duration_days": v.duration_days if v else 120,
            "treatment_code": e.treatment_code
        })
        
    return {
        "trial": TrialOut.model_validate(trial),
        "entries": entries_list
    }

@router.post("", response_model=TrialOut)
def create_trial(trial_in: TrialCreate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == trial_in.plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail=f"Plot ID {trial_in.plot_id} not found")
        
    existing = db.query(Trial).filter(Trial.trial_code == trial_in.trial_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Trial code {trial_in.trial_code} already exists")
        
    trial = Trial(
        trial_code=trial_in.trial_code,
        name=trial_in.name,
        plot_id=trial_in.plot_id,
        crop=trial_in.crop,
        season=trial_in.season,
        year=trial_in.year,
        design_type=trial_in.design_type,
        num_entries=trial_in.num_entries,
        num_replications=trial_in.num_replications,
        start_date=trial_in.start_date,
        expected_harvest_date=trial_in.expected_harvest_date,
        notes=trial_in.notes,
        status="Created"
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)
    
    # Assign varieties as trial entries
    if trial_in.variety_ids:
        for idx, var_id in enumerate(trial_in.variety_ids):
            entry = TrialEntry(
                trial_id=trial.id,
                variety_id=var_id,
                entry_number=idx + 1,
                treatment_code=f"T{idx+1}"
            )
            db.add(entry)
        db.commit()
        
    audit = AuditLog(
        user_name="Researcher",
        action="CREATE_TRIAL",
        entity="Trial",
        entity_id=str(trial.id)
    )
    db.add(audit)
    db.commit()
    
    return trial
