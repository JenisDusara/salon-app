from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import Expense

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

VALID_CATEGORIES = ["Rent", "Electricity", "Products", "Coffee/Snacks", "Maintenance", "Other"]


# Schemas
class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None

# Routes
@router.get("/")
def get_expenses(db: Session = Depends(get_db)):
    expenses = db.query(Expense).order_by(Expense.date.desc()).all()
    return [
        {
            "id": e.id,
            "category": e.category,
            "amount": float(e.amount),
            "description": e.description,
            "date": str(e.date),
        }
        for e in expenses
    ]


@router.post("/", status_code=201)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Valid: {VALID_CATEGORIES}")
    expense = Expense(
        category=data.category,
        amount=data.amount,
        description=data.description,
        date=date.fromisoformat(data.date) if data.date else date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {
        "id": expense.id,
        "category": expense.category,
        "amount": float(expense.amount),
        "description": expense.description,
        "date": str(expense.date),
    }


@router.get("/summary")
def expense_summary(db: Session = Depends(get_db)):
    today = date.today()
    total = db.query(func.sum(Expense.amount)).scalar() or 0
    today_total = db.query(func.sum(Expense.amount)).filter(
        Expense.date == today
    ).scalar() or 0
    monthly_total = db.query(func.sum(Expense.amount)).filter(
        func.extract("month", Expense.date) == today.month,
        func.extract("year", Expense.date) == today.year,
    ).scalar() or 0
    by_category = (
        db.query(Expense.category, func.sum(Expense.amount))
        .group_by(Expense.category)
        .all()
    )
    return {
        "total": float(total),
        "today": float(today_total),
        "monthly": float(monthly_total),
        "by_category": {cat: float(amt) for cat, amt in by_category},
    }


@router.put("/{expense_id}")
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if data.category:
        if data.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Valid: {VALID_CATEGORIES}")
        expense.category = data.category
    if data.amount is not None:
        expense.amount = data.amount
    if data.description is not None:
        expense.description = data.description
    if data.date is not None:
        expense.date = date.fromisoformat(data.date)
    db.commit()
    db.refresh(expense)
    return {
        "id": expense.id,
        "category": expense.category,
        "amount": float(expense.amount),
        "description": expense.description,
        "date": str(expense.date),
    }


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}