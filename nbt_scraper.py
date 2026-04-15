"""
Планировщик автоматического обновления данных
- Каждый день в 9:00 — обновляет курсы НБТ
- Каждую неделю — обновляет ставки банков
- Каждый месяц — генерирует отчёт по рынку
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def update_nbt_rates():
    """Обновляет курсы с сайта НБТ"""
    logger.info(f"[{datetime.now()}] Запуск обновления курсов НБТ...")
    try:
        from app.scrapers.nbt_scraper import run
        run()
        logger.info("Курсы НБТ обновлены успешно")
    except Exception as e:
        logger.error(f"Ошибка обновления курсов: {e}")

def generate_monthly_report():
    """Генерирует ежемесячный отчёт по рынку"""
    logger.info(f"[{datetime.now()}] Генерация ежемесячного отчёта...")
    try:
        from app.database import SessionLocal
        from app.models.models import Product, MarketReport
        from sqlalchemy import func
        now = datetime.utcnow()
        db = SessionLocal()
        for ptype in ["deposit", "credit", "card"]:
            products = db.query(Product).filter(
                Product.type == ptype,
                Product.is_active == True,
                Product.rate_max != None
            ).all()
            if not products:
                continue
            rates = [p.rate_max for p in products if p.rate_max]
            report = MarketReport(
                period_year=now.year,
                period_month=now.month,
                product_type=ptype,
                avg_rate_min=min(rates) if rates else 0,
                avg_rate_max=sum(rates)/len(rates) if rates else 0,
                max_rate=max(rates) if rates else 0,
                min_rate=min(rates) if rates else 0,
                banks_count=len(set(p.bank_id for p in products)),
                products_count=len(products),
            )
            db.add(report)
        db.commit()
        db.close()
        logger.info("Ежемесячный отчёт сохранён")
    except Exception as e:
        logger.error(f"Ошибка генерации отчёта: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Dushanbe")

    # Каждый день в 9:00 по Душанбе
    scheduler.add_job(
        update_nbt_rates,
        CronTrigger(hour=9, minute=0),
        id="nbt_daily",
        name="Обновление курсов НБТ",
        replace_existing=True
    )

    # Каждый первый день месяца в 10:00
    scheduler.add_job(
        generate_monthly_report,
        CronTrigger(day=1, hour=10, minute=0),
        id="monthly_report",
        name="Ежемесячный отчёт",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Планировщик запущен: курсы НБТ обновляются ежедневно в 9:00")
    return scheduler
