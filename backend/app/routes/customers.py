from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Customer

router = APIRouter(prefix="/api/customers", tags=["Customers"])


# Schemas
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


# Routes
@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "created_at": str(c.created_at),
            "total_visits": len(c.bills),
        }
        for c in customers
    ]


@router.get("/search")
def search_customer(phone: str, db: Session = Depends(get_db)):
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if customer:
        return {
            "found": True,
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "total_visits": len(customer.bills),
            },
        }
    return {"found": False}


@router.post("/", status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=409, detail="Customer with this phone already exists")
    customer = Customer(
        name=data.name.strip(),
        phone=data.phone.strip(),
        email=data.email.strip() if data.email else None,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return {"id": customer.id, "name": customer.name, "phone": customer.phone, "email": customer.email}


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "total_visits": len(customer.bills),
    }


@router.put("/{customer_id}")
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if data.name:
        customer.name = data.name.strip()
    if data.email is not None:
        customer.email = data.email.strip() or None
    db.commit()
    db.refresh(customer)
    return {"id": customer.id, "name": customer.name, "phone": customer.phone, "email": customer.email}


@router.get("/{customer_id}/history")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    bills = [
        {
            "id": b.id,
            "date": str(b.date),
            "total_amount": float(b.total_amount),
            "items": [
                {
                    "service": item.service.name,
                    "price": float(item.price),
                    "is_membership_service": item.is_membership_service,
                }
                for item in b.items
            ],
        }
        for b in customer.bills
    ]
    return {
        "customer": {"id": customer.id, "name": customer.name, "phone": customer.phone},
        "total_visits": len(customer.bills),
        "bills": bills,
    }