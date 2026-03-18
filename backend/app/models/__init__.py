from datetime import date, datetime
from typing import Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    bills: Mapped[list["Bill"]] = relationship("Bill", back_populates="customer")
    membership: Mapped[Optional["Membership"]] = relationship("Membership", back_populates="customer", uselist=False)


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    joined_date: Mapped[date] = mapped_column(Date, default=date.today)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    bill_items: Mapped[list["BillItem"]] = relationship("BillItem", back_populates="employee")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    base_price: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)

    bill_items: Mapped[list["BillItem"]] = relationship("BillItem", back_populates="service")
    membership_usage: Mapped[list["MembershipUsage"]] = relationship("MembershipUsage", back_populates="service")


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    validity_days: Mapped[int] = mapped_column(Integer, default=365)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    plan_services: Mapped[list["MembershipPlanService"]] = relationship("MembershipPlanService", back_populates="plan")
    memberships: Mapped[list["Membership"]] = relationship("Membership", back_populates="plan")


class MembershipPlanService(Base):
    __tablename__ = "membership_plan_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("membership_plans.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id"), nullable=False)
    allowed_count: Mapped[int] = mapped_column(Integer, nullable=False)

    plan: Mapped["MembershipPlan"] = relationship("MembershipPlan", back_populates="plan_services")
    service: Mapped["Service"] = relationship("Service")

    __table_args__ = (UniqueConstraint("plan_id", "service_id"),)


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("membership_plans.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, default=date.today)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    def is_expired(self) -> bool:
        return date.today() > self.expiry_date

    customer: Mapped["Customer"] = relationship("Customer", back_populates="membership")
    plan: Mapped["MembershipPlan"] = relationship("MembershipPlan", back_populates="memberships")
    usage: Mapped[list["MembershipUsage"]] = relationship("MembershipUsage", back_populates="membership")


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    customer: Mapped["Customer"] = relationship("Customer", back_populates="bills")
    items: Mapped[list["BillItem"]] = relationship("BillItem", back_populates="bill")


class BillItem(Base):
    __tablename__ = "bill_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bill_id: Mapped[int] = mapped_column(Integer, ForeignKey("bills.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    is_membership_service: Mapped[bool] = mapped_column(Boolean, default=False)

    bill: Mapped["Bill"] = relationship("Bill", back_populates="items")
    service: Mapped["Service"] = relationship("Service", back_populates="bill_items")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="bill_items")
    membership_usage: Mapped[Optional["MembershipUsage"]] = relationship("MembershipUsage", back_populates="bill_item", uselist=False)


class MembershipUsage(Base):
    __tablename__ = "membership_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    membership_id: Mapped[int] = mapped_column(Integer, ForeignKey("memberships.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id"), nullable=False)
    bill_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("bill_items.id"), unique=True, nullable=False)
    used_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    membership: Mapped["Membership"] = relationship("Membership", back_populates="usage")
    service: Mapped["Service"] = relationship("Service", back_populates="membership_usage")
    bill_item: Mapped["BillItem"] = relationship("BillItem", back_populates="membership_usage")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(20), nullable=False, default="Other")
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[date] = mapped_column(Date, default=date.today)


class SmsCampaign(Base):
    __tablename__ = "sms_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    recipient_count: Mapped[int] = mapped_column(Integer, default=0)