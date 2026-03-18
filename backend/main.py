from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models  # noqa: F401 — ensures all models are registered
from app.routes.customers import router as customers_router
from app.routes.employees import router as employees_router
from app.routes.services import router as services_router
from app.routes.bills import router as bills_router
from app.routes.expenses import router as expenses_router
from app.routes.memberships import router as memberships_router
from app.routes.dashboard import router as dashboard_router
from app.routes.marketing import router as marketing_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Salon Management System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(customers_router)
app.include_router(employees_router)
app.include_router(services_router)
app.include_router(bills_router)
app.include_router(expenses_router)
app.include_router(memberships_router)
app.include_router(dashboard_router)
app.include_router(marketing_router)


@app.get("/")
def root():
    return {"message": "Salon Management API is running!"}