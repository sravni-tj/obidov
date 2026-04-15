from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models.models import Product, Bank, MarketReport, RateHistory
from datetime import datetime

router = APIRouter()

@router.get("/market-summary")
def market_summary(
    product_type: str = Query("deposit"),
    currency: str = Query("TJS"),
    db: Session = Depends(get_db)
):
    """Сводка по рынку: средние ставки, топ предложения"""
    products = db.query(Product).options(joinedload(Product.bank)).filter(
        Product.type == product_type,
        Product.currency == currency,
        Product.is_active == True,
        Product.rate_max != None
    ).all()

    if not products:
        return {"error": "Нет данных"}

    rates = [p.rate_max for p in products if p.rate_max]
    avg_rate = sum(rates) / len(rates) if rates else 0
    max_rate = max(rates) if rates else 0
    min_rate = min(rates) if rates else 0

    top = sorted(products, key=lambda p: p.rate_max or 0, reverse=True)[:5]

    return {
        "product_type": product_type,
        "currency": currency,
        "banks_count": len(set(p.bank_id for p in products)),
        "products_count": len(products),
        "avg_rate": round(avg_rate, 2),
        "max_rate": round(max_rate, 2),
        "min_rate": round(min_rate, 2),
        "top_offers": [
            {
                "bank": p.bank.name,
                "product": p.name,
                "rate_max": p.rate_max,
                "term_max_months": p.term_max_months
            } for p in top
        ],
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/monthly-report")
def monthly_report(
    year: int = Query(None),
    month: int = Query(None),
    db: Session = Depends(get_db)
):
    """Ежемесячный отчёт по всем типам продуктов"""
    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month

    report = {}
    for ptype in ["deposit", "credit", "card"]:
        products = db.query(Product).filter(
            Product.type == ptype,
            Product.is_active == True
        ).all()
        if not products:
            continue
        rates = [p.rate_max for p in products if p.rate_max]
        report[ptype] = {
            "banks_count": len(set(p.bank_id for p in products)),
            "products_count": len(products),
            "avg_rate": round(sum(rates)/len(rates), 2) if rates else None,
            "max_rate": round(max(rates), 2) if rates else None,
            "min_rate": round(min(rates), 2) if rates else None,
        }

    return {
        "period": f"{year}-{month:02d}",
        "report": report,
        "generated_at": datetime.utcnow().isoformat()
    }
