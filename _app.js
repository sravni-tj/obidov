from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.models import Product, Bank
from pydantic import BaseModel

router = APIRouter()

class ProductSchema(BaseModel):
    id: int
    bank_id: int
    bank_name: Optional[str] = None
    bank_logo: Optional[str] = None
    type: str
    name: str
    currency: str
    rate_min: Optional[float]
    rate_max: Optional[float]
    term_min_months: Optional[int]
    term_max_months: Optional[int]
    amount_min: Optional[float]
    amount_max: Optional[float]
    early_withdrawal: Optional[bool]
    capitalization: Optional[bool]
    insurance: Optional[bool]
    collateral_required: Optional[bool]
    annual_fee: Optional[float]
    cashback_percent: Optional[float]
    card_type: Optional[str]
    conditions: Optional[str]
    source_url: Optional[str]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductSchema])
def get_products(
    type: Optional[str] = Query(None),
    bank_id: Optional[int] = Query(None),
    currency: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(joinedload(Product.bank)).filter(Product.is_active == True)
    if type:
        query = query.filter(Product.type == type)
    if bank_id:
        query = query.filter(Product.bank_id == bank_id)
    if currency:
        query = query.filter(Product.currency == currency)
    products = query.all()
    result = []
    for p in products:
        ps = ProductSchema.from_orm(p)
        ps.bank_name = p.bank.name if p.bank else None
        ps.bank_logo = p.bank.logo_url if p.bank else None
        result.append(ps)
    return result
