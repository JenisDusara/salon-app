from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Service

router = APIRouter(prefix="/api/services", tags=["Services"])


# Schemas
class ServiceCreate(BaseModel):
    name: str
    base_price: float


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[float] = None


# Routes
@router.get("/")
def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "base_price": float(s.base_price),
        }
        for s in services
    ]


@router.post("/", status_code=201)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(
        name=data.name.strip(),
        base_price=data.base_price,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return {"id": service.id, "name": service.name, "base_price": float(service.base_price)}


@router.get("/{service_id}")
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"id": service.id, "name": service.name, "base_price": float(service.base_price)}


@router.put("/{service_id}")
def update_service(service_id: int, data: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if data.name:
        service.name = data.name.strip()
    if data.base_price is not None:
        service.base_price = data.base_price
    db.commit()
    db.refresh(service)
    return {"id": service.id, "name": service.name, "base_price": float(service.base_price)}


@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted"}