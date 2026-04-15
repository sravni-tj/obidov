from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import banks, products, currency, analytics, compare
from app.database import engine, Base
from app.services.scheduler import start_scheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from app.scrapers.banks_scraper import seed_database
    seed_database()
    scheduler = start_scheduler()
    from app.scrapers.nbt_scraper import run as update_rates
    try:
        update_rates()
    except Exception as e:
        logger.warning(f"Не удалось получить курсы при старте: {e}")
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Qiyos.tj API",
    description="Сравнение финансовых продуктов Таджикистана",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(banks.router, prefix="/api/banks", tags=["Банки"])
app.include_router(products.router, prefix="/api/products", tags=["Продукты"])
app.include_router(currency.router, prefix="/api/currency", tags=["Валюта"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Аналитика"])
app.include_router(compare.router, prefix="/api/compare", tags=["Сравнение"])

@app.get("/")
def root():
    return {"message": "Qiyos.tj API работает", "docs": "/docs"}
