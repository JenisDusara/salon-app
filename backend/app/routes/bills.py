from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import Bill, BillItem, Customer, Employee, Service, Membership, MembershipUsage, MembershipPlanService
import os

router = APIRouter(prefix="/api/bills", tags=["Bills"])

SHOP_NAME = os.getenv("SHOP_NAME", "My Salon")
SHOP_ADDRESS = os.getenv("SHOP_ADDRESS", "")


# ─── Schemas ─────────────────────────────────────────────

class BillItemInput(BaseModel):
    service_id: int
    employee_id: int
    price: Optional[float] = None


class BillCreate(BaseModel):
    customer_id: int
    items: list[BillItemInput]
    date: Optional[str] = None


# ─── Routes ──────────────────────────────────────────────

@router.get("/")
def get_bills(db: Session = Depends(get_db)):
    bills = db.query(Bill).order_by(Bill.date.desc()).all()
    return [_bill_dict(b) for b in bills]


@router.get("/{bill_id}")
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return _bill_dict(bill)


@router.post("/", status_code=201)
def create_bill(data: BillCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    membership = db.query(Membership).filter(
        Membership.customer_id == data.customer_id,
        Membership.is_active == True,
    ).first()

    bill_date = date.fromisoformat(data.date) if data.date else date.today()

    bill = Bill(
        customer_id=data.customer_id,
        date=bill_date,
        total_amount=0,
    )
    db.add(bill)
    db.flush()

    total = 0.0
    membership_services_used: list[dict] = []

    for item_data in data.items:
        service = db.query(Service).filter(Service.id == item_data.service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail=f"Service {item_data.service_id} not found")
        employee = db.query(Employee).filter(Employee.id == item_data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee {item_data.employee_id} not found")

        is_membership_service = False
        price = float(item_data.price if item_data.price is not None else service.base_price)

        if membership and not membership.is_expired():
            plan_service = db.query(MembershipPlanService).filter(
                MembershipPlanService.plan_id == membership.plan_id,
                MembershipPlanService.service_id == item_data.service_id,
            ).first()
            if plan_service:
                used = db.query(MembershipUsage).filter(
                    MembershipUsage.membership_id == membership.id,
                    MembershipUsage.service_id == item_data.service_id,
                ).count()
                if used < plan_service.allowed_count:
                    is_membership_service = True
                    price = 0.0

        bill_item = BillItem(
            bill_id=bill.id,
            service_id=item_data.service_id,
            employee_id=item_data.employee_id,
            price=price,
            is_membership_service=is_membership_service,
        )
        db.add(bill_item)
        db.flush()

        if is_membership_service and membership:
            usage = MembershipUsage(
                membership_id=membership.id,
                service_id=item_data.service_id,
                bill_item_id=bill_item.id,
            )
            db.add(usage)
            membership_services_used.append({
                "service_name": service.name,
                "service_id": service.id,
            })

        total += price

    bill.total_amount = total
    db.commit()
    db.refresh(bill)

    _send_bill_sms(customer, bill, db)
    if membership_services_used:
        _send_membership_sms(customer, membership, db)

    return _bill_dict(bill)


# ─── SMS Helpers ──────────────────────────────────────────

def _send_bill_sms(customer: Customer, bill: Bill, db: Session) -> None:
    items_text = "\n".join(
        f"- {item.service.name} — {'FREE (Membership)' if item.is_membership_service else f'Rs.{float(item.price):.0f}'}"
        for item in bill.items
    )
    message = (
        f"Hi {customer.name}! Thank you for visiting {SHOP_NAME}.\n\n"
        f"Services:\n{items_text}\n\n"
        f"Total: Rs.{float(bill.total_amount):.0f}\n"
        f"Date: {bill.date}\n\n"
        f"{SHOP_ADDRESS}\n"
        f"We look forward to seeing you again!"
    )
    print(f"[SMS to {customer.phone}]:\n{message}\n")
    bill.sms_sent = True
    db.commit()


def _send_membership_sms(customer: Customer, membership: Membership, db: Session) -> None:
    plan_services = db.query(MembershipPlanService).filter(
        MembershipPlanService.plan_id == membership.plan_id
    ).all()
    lines = []
    for ps in plan_services:
        used = db.query(MembershipUsage).filter(
            MembershipUsage.membership_id == membership.id,
            MembershipUsage.service_id == ps.service_id,
        ).count()
        remaining = max(0, ps.allowed_count - used)
        lines.append(f"- {ps.service.name}: {remaining} remaining")
    services_text = "\n".join(lines)
    message = (
        f"Membership Update - {SHOP_NAME}\n"
        f"Plan: {membership.plan.name}\n\n"
        f"Remaining Credits:\n{services_text}\n\n"
        f"Expiry: {membership.expiry_date}\n"
        f"Thank you for being a member!"
    )
    print(f"[Membership SMS to {customer.phone}]:\n{message}\n")


# ─── Helper ──────────────────────────────────────────────

def _bill_dict(bill: Bill) -> dict:
    return {
        "id": bill.id,
        "customer_id": bill.customer_id,
        "customer_name": bill.customer.name if bill.customer else None,
        "date": str(bill.date),
        "total_amount": float(bill.total_amount),
        "sms_sent": bill.sms_sent,
        "items": [
            {
                "id": item.id,
                "service_id": item.service_id,
                "service_name": item.service.name if item.service else None,
                "employee_id": item.employee_id,
                "employee_name": item.employee.name if item.employee else None,
                "price": float(item.price),
                "is_membership_service": item.is_membership_service,
            }
            for item in bill.items
        ],
    }