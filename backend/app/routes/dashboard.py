from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.database import get_db
from app.models import Bill, BillItem, Customer, Employee, Expense, Membership, MembershipUsage, Service


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()

    # Today's income
    today_income = db.query(func.sum(Bill.total_amount)).filter(
        Bill.date == today
    ).scalar() or 0

    # Monthly income
    monthly_income = db.query(func.sum(Bill.total_amount)).filter(
        func.extract("month", Bill.date) == today.month,
        func.extract("year", Bill.date) == today.year,
    ).scalar() or 0

    # Total income
    total_income = db.query(func.sum(Bill.total_amount)).scalar() or 0

    # Total customers
    total_customers = db.query(func.count(Customer.id)).scalar() or 0

    # Today's expenses
    today_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.date == today
    ).scalar() or 0

    # Monthly expenses
    monthly_expenses = db.query(func.sum(Expense.amount)).filter(
        func.extract("month", Expense.date) == today.month,
        func.extract("year", Expense.date) == today.year,
    ).scalar() or 0

    # Total expenses
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0

    # Labour wise income
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    labour_income = []
    for emp in employees:
        income = db.query(func.sum(BillItem.price)).filter(
            BillItem.employee_id == emp.id
        ).scalar() or 0
        services = db.query(func.count(BillItem.id)).filter(
            BillItem.employee_id == emp.id
        ).scalar() or 0
        labour_income.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "total_services": int(services),
            "total_income": float(income),
        })

        # Today's membership activity
    today_membership_activity = []
    today_bills = db.query(Bill).filter(Bill.date == today).all()
    for bill in today_bills:
        membership_items = [item for item in bill.items if item.is_membership_service]
        if membership_items:
            today_membership_activity.append({
                "customer_name": bill.customer.name,
                "plan_name": bill.customer.membership.plan.name if bill.customer.membership else "",
                "services_used": [item.service.name for item in membership_items],
            })

    return {
        "today": {
            "income": float(today_income),
            "expenses": float(today_expenses),
            "profit": float(today_income) - float(today_expenses),
        },
        "today_membership_activity": today_membership_activity,
        "monthly": {
            "income": float(monthly_income),
            "expenses": float(monthly_expenses),
            "profit": float(monthly_income) - float(monthly_expenses),
        },
        "overall": {
            "income": float(total_income),
            "expenses": float(total_expenses),
            "profit": float(total_income) - float(total_expenses),
        },
        "total_customers": int(total_customers),
        "labour_income": labour_income,
    }


@router.get("/profit")
def get_profit(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
):
    income = db.query(func.sum(Bill.total_amount)).filter(
        Bill.date >= start_date,
        Bill.date <= end_date,
    ).scalar() or 0

    expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.date >= start_date,
        Expense.date <= end_date,
    ).scalar() or 0

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_income": float(income),
        "total_expenses": float(expenses),
        "net_profit": float(income) - float(expenses),
    }