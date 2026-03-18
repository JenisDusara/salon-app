from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from app.database import get_db
from app.models import Membership, MembershipPlan, MembershipPlanService, MembershipUsage, Customer, Service

router = APIRouter(prefix="/api/memberships", tags=["Memberships"])


# Schemas
class PlanServiceItem(BaseModel):
    service_id: int
    allowed_count: int


class PlanCreate(BaseModel):
    name: str
    price: float
    validity_days: int = 365
    services: list[PlanServiceItem]


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    validity_days: Optional[int] = None
    is_active: Optional[bool] = None
    services: Optional[list[PlanServiceItem]] = None


class MembershipCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[date] = None


# ─── Plans ───────────────────────────────────────────────

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(MembershipPlan).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "validity_days": p.validity_days,
            "is_active": p.is_active,
            "services": [
                {
                    "service_id": ps.service_id,
                    "service_name": ps.service.name,
                    "allowed_count": ps.allowed_count,
                }
                for ps in p.plan_services
            ],
        }
        for p in plans
    ]


@router.post("/plans", status_code=201)
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    plan = MembershipPlan(
        name=data.name.strip(),
        price=data.price,
        validity_days=data.validity_days,
    )
    db.add(plan)
    db.flush()
    for item in data.services:
        service = db.query(Service).filter(Service.id == item.service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail=f"Service {item.service_id} not found")
        plan_service = MembershipPlanService(
            plan_id=plan.id,
            service_id=item.service_id,
            allowed_count=item.allowed_count,
        )
        db.add(plan_service)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "name": plan.name, "price": float(plan.price)}


@router.put("/plans/{plan_id}")
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db)):
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if data.name:
        plan.name = data.name.strip()
    if data.price is not None:
        plan.price = data.price
    if data.validity_days is not None:
        plan.validity_days = data.validity_days
    if data.is_active is not None:
        plan.is_active = data.is_active
    if data.services is not None:
        db.query(MembershipPlanService).filter(
            MembershipPlanService.plan_id == plan_id
        ).delete()
        for item in data.services:
            service = db.query(Service).filter(Service.id == item.service_id).first()
            if not service:
                raise HTTPException(status_code=404, detail=f"Service {item.service_id} not found")
            plan_service = MembershipPlanService(
                plan_id=plan.id,
                service_id=item.service_id,
                allowed_count=item.allowed_count,
            )
            db.add(plan_service)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "name": plan.name, "price": float(plan.price), "is_active": plan.is_active}


# ─── Customer Memberships ─────────────────────────────────

@router.get("/")
def get_memberships(db: Session = Depends(get_db)):
    memberships = db.query(Membership).all()
    return [_membership_dict(m, db) for m in memberships]


@router.post("/", status_code=201)
def create_membership(data: MembershipCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    existing = db.query(Membership).filter(
        Membership.customer_id == data.customer_id,
        Membership.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Customer already has an active membership")
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == data.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    start = data.start_date or date.today()
    expiry = start + timedelta(days=plan.validity_days)
    membership = Membership(
        customer_id=data.customer_id,
        plan_id=data.plan_id,
        start_date=start,
        expiry_date=expiry,
        is_active=True,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return _membership_dict(membership, db)


@router.get("/{membership_id}")
def get_membership(membership_id: int, db: Session = Depends(get_db)):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    return _membership_dict(membership, db)


@router.get("/customer/{customer_id}")
def get_customer_membership(customer_id: int, db: Session = Depends(get_db)):
    membership = db.query(Membership).filter(
        Membership.customer_id == customer_id,
        Membership.is_active == True,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No active membership found")
    return _membership_dict(membership, db)


# ─── Helper ──────────────────────────────────────────────

def _membership_dict(m: Membership, db: Session) -> dict:
    plan_services = db.query(MembershipPlanService).filter(
        MembershipPlanService.plan_id == m.plan_id
    ).all()
    remaining = []
    for ps in plan_services:
        used = db.query(MembershipUsage).filter(
            MembershipUsage.membership_id == m.id,
            MembershipUsage.service_id == ps.service_id,
        ).count()
        remaining.append({
            "service_id": ps.service_id,
            "service_name": ps.service.name,
            "allowed": ps.allowed_count,
            "used": used,
            "remaining": max(0, ps.allowed_count - used),
        })
    return {
        "id": m.id,
        "customer_id": m.customer_id,
        "customer_name": m.customer.name if m.customer else None,
        "plan_id": m.plan_id,
        "plan_name": m.plan.name if m.plan else None,
        "start_date": str(m.start_date),
        "expiry_date": str(m.expiry_date),
        "is_active": m.is_active,
        "is_expired": date.today() > m.expiry_date,
        "services": remaining,
    }