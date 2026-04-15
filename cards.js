from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from app.database import get_db
from app.models.models import CurrencyRate
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

class RateSchema(BaseModel):
    id: int
    source: str
    currency_from: str
    currency_to: str
    buy_rate: Optional[float]
    sell_rate: Optional[float]
    official_rate: Optional[float]
    recorded_at: datetime

    class Config:
        from_attributes = True

@router.get("/latest")
def get_latest_rates(db: Session = Depends(get_db)):
    """Последние курсы от НБТ"""
    subq = db.query(
        CurrencyRate.currency_from,
        func.max(CurrencyRate.recorded_at).label("max_date")
    ).filter(CurrencyRate.source == "nbt").group_by(CurrencyRate.currency_from).subquery()

    rates = db.query(CurrencyRate).join(
        subq,
        (CurrencyRate.currency_from == subq.c.currency_from) &
        (CurrencyRate.recorded_at == subq.c.max_date)
    ).all()

    return [RateSchema.from_orm(r) for r in rates]

@router.get("/history/{currency}")
def get_rate_history(
    currency: str,
    days: int = Query(30, le=365),
    db: Session = Depends(get_db)
):
    """История курса за N дней"""
    since = datetime.utcnow() - timedelta(days=days)
    rates = db.query(CurrencyRate).filter(
        CurrencyRate.currency_from == currency.upper(),
        CurrencyRate.source == "nbt",
        CurrencyRate.recorded_at >= since
    ).order_by(CurrencyRate.recorded_at).all()
    return [RateSchema.from_orm(r) for r in rates]
