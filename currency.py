from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ProductType(str, enum.Enum):
    DEPOSIT = "deposit"
    CREDIT = "credit"
    CARD = "card"
    CURRENCY = "currency"
    WALLET = "wallet"
    RKO = "rko"
    ACQUIRING = "acquiring"
    SALARY = "salary"

class CurrencyCode(str, enum.Enum):
    TJS = "TJS"
    USD = "USD"
    EUR = "EUR"
    RUB = "RUB"

class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_tj = Column(String(200))
    short_name = Column(String(50))
    license_number = Column(String(50))
    license_date = Column(String(20))
    website = Column(String(200))
    logo_url = Column(String(500))
    phone = Column(String(100))
    address = Column(Text)
    description = Column(Text)
    type = Column(String(50), default="bank")  # bank / mfo / nko
    is_active = Column(Boolean, default=True)
    capital = Column(Float, nullable=True)
    assets = Column(Float, nullable=True)
    founded_year = Column(Integer, nullable=True)
    rating_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    products = relationship("Product", back_populates="bank")
    currency_rates = relationship("CurrencyRate", back_populates="bank")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    type = Column(String(50), nullable=False)
    name = Column(String(300), nullable=False)
    name_tj = Column(String(300))
    currency = Column(String(10), default="TJS")
    is_active = Column(Boolean, default=True)

    # Депозиты и кредиты
    rate_min = Column(Float, nullable=True)
    rate_max = Column(Float, nullable=True)
    term_min_months = Column(Integer, nullable=True)
    term_max_months = Column(Integer, nullable=True)
    amount_min = Column(Float, nullable=True)
    amount_max = Column(Float, nullable=True)

    # Детали
    early_withdrawal = Column(Boolean, nullable=True)
    capitalization = Column(Boolean, nullable=True)
    insurance = Column(Boolean, nullable=True)
    collateral_required = Column(Boolean, nullable=True)
    income_proof_required = Column(Boolean, nullable=True)

    # Карты
    annual_fee = Column(Float, nullable=True)
    cashback_percent = Column(Float, nullable=True)
    card_type = Column(String(50), nullable=True)  # visa/mastercard/humo/korti-milli

    # Описание
    conditions = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bank = relationship("Bank", back_populates="products")
    rate_history = relationship("RateHistory", back_populates="product")


class RateHistory(Base):
    __tablename__ = "rate_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    rate_min = Column(Float)
    rate_max = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="rate_history")


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=True)
    source = Column(String(100), default="nbt")  # nbt / bank_name
    currency_from = Column(String(10))
    currency_to = Column(String(10), default="TJS")
    buy_rate = Column(Float, nullable=True)
    sell_rate = Column(Float, nullable=True)
    official_rate = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    bank = relationship("Bank", back_populates="currency_rates")


class MarketReport(Base):
    __tablename__ = "market_reports"

    id = Column(Integer, primary_key=True, index=True)
    period_year = Column(Integer)
    period_month = Column(Integer)
    product_type = Column(String(50))
    avg_rate_min = Column(Float)
    avg_rate_max = Column(Float)
    max_rate = Column(Float)
    min_rate = Column(Float)
    banks_count = Column(Integer)
    products_count = Column(Integer)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
