from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("")
def list_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return [
        {
            "id": l.id,
            "user_name": l.user_name or "System",
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "old_value": l.old_value_json,
            "new_value": l.new_value_json,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else ""
        } for l in logs
    ]
