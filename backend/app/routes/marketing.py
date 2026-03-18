from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Customer, SmsCampaign
import os

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])

SHOP_NAME = os.getenv("SHOP_NAME", "My Salon")


class CampaignCreate(BaseModel):
    message: str


@router.get("/customers")
def get_all_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    return [{"id": c.id, "name": c.name, "phone": c.phone} for c in customers]


@router.post("/send-sms")
def send_bulk_sms(data: CampaignCreate, db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    if not customers:
        return {"success": False, "message": "No customers found"}

    sent = 0
    failed = 0
    for customer in customers:
        try:
            # TODO: Replace with real SMS API (Fast2SMS / MSG91)
            print(f"[BULK SMS to {customer.phone} - {customer.name}]:\n{data.message}\n")
            sent += 1
        except Exception:
            failed += 1

    # Save campaign record
    campaign = SmsCampaign(
        message=data.message,
        recipient_count=sent,
    )
    db.add(campaign)
    db.commit()

    return {
        "success": True,
        "sent": sent,
        "failed": failed,
        "total": len(customers),
    }


@router.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(SmsCampaign).order_by(SmsCampaign.sent_at.desc()).all()
    return [
        {
            "id": c.id,
            "message": c.message,
            "sent_at": str(c.sent_at),
            "recipient_count": c.recipient_count,
        }
        for c in campaigns
    ]