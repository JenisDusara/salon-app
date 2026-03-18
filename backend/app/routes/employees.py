from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Employee, BillItem

router = APIRouter(prefix="/api/employees", tags=["Employees"])


# Schemas
class EmployeeCreate(BaseModel):
    name: str
    phone: str


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


# Routes
@router.get("/")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "phone": e.phone,
            "joined_date": str(e.joined_date),
            "is_active": e.is_active,
        }
        for e in employees
    ]


@router.post("/", status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=409, detail="Employee with this phone already exists")
    employee = Employee(
        name=data.name.strip(),
        phone=data.phone.strip(),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return {"id": employee.id, "name": employee.name, "phone": employee.phone}


@router.get("/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "id": employee.id,
        "name": employee.name,
        "phone": employee.phone,
        "joined_date": str(employee.joined_date),
        "is_active": employee.is_active,
    }


@router.put("/{employee_id}")
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if data.name:
        employee.name = data.name.strip()
    if data.phone:
        employee.phone = data.phone.strip()
    if data.is_active is not None:
        employee.is_active = data.is_active
    db.commit()
    db.refresh(employee)
    return {"id": employee.id, "name": employee.name, "phone": employee.phone, "is_active": employee.is_active}

@router.get("/{employee_id}/report")
def employee_report(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    total_services = db.query(BillItem).filter(BillItem.employee_id == employee_id).count()
    total_income = db.query(func.sum(BillItem.price)).filter(
        BillItem.employee_id == employee_id
    ).scalar() or 0

    bill_items = db.query(BillItem).filter(BillItem.employee_id == employee_id).order_by(BillItem.id.desc()).all()

    return {
        "employee": {
            "id": employee.id,
            "name": employee.name,
            "phone": employee.phone,
        },
        "total_services": total_services,
        "total_income": float(total_income),
        "service_history": [
            {
                "customer_name": item.bill.customer.name if item.bill and item.bill.customer else "—",
                "service_name": item.service.name if item.service else "—",
                "price": float(item.price),
                "is_membership_service": item.is_membership_service,
                "date": str(item.bill.date) if item.bill else "—",
            }
            for item in bill_items
        ],
    }