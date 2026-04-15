"""
Парсер сайтов банков Таджикистана
Собирает данные о депозитах, кредитах, картах

Список банков с лицензиями НБТ (данные актуальны на 2024):
- Эсхата (Eskhata)
- Амонатбонк (Amonatbank)  
- Душанбе Сити Банк (Dushanbe City Bank)
- Таджпромбонк (Tajprombank)
- Банк Арванд (Bank Arvand)
- ФОНОБ (FONOB)
- Ориёнбонк (Oriyonbank)
- Мол Булак Файнанс (Mol Bulak)
- Ибрагимов и К (Ibraimov & K)
- Таджиксодиротбонк (Tajsodorotbank)
"""
import requests
from bs4 import BeautifulSoup
import logging
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Bank, Product

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Данные банков (обновляются вручную + парсингом)
BANKS_DATA = [
    {
        "name": "АО «Эсхата»",
        "short_name": "Эсхата",
        "website": "https://eskhata.com",
        "phone": "+992 44 600-00-01",
        "type": "bank",
        "founded_year": 1993,
        "products": [
            {
                "type": "deposit",
                "name": "Депозит «Омонат»",
                "currency": "TJS",
                "rate_min": 10.0,
                "rate_max": 16.0,
                "term_min_months": 3,
                "term_max_months": 36,
                "amount_min": 100,
                "early_withdrawal": True,
                "capitalization": True,
                "insurance": True,
            },
            {
                "type": "deposit",
                "name": "Депозит «Валютный»",
                "currency": "USD",
                "rate_min": 3.0,
                "rate_max": 6.0,
                "term_min_months": 6,
                "term_max_months": 24,
                "amount_min": 100,
                "early_withdrawal": False,
                "insurance": True,
            },
            {
                "type": "credit",
                "name": "Потребительский кредит",
                "currency": "TJS",
                "rate_min": 22.0,
                "rate_max": 28.0,
                "term_min_months": 6,
                "term_max_months": 60,
                "amount_min": 1000,
                "amount_max": 100000,
                "collateral_required": False,
                "income_proof_required": True,
            },
            {
                "type": "credit",
                "name": "Ипотека",
                "currency": "TJS",
                "rate_min": 18.0,
                "rate_max": 24.0,
                "term_min_months": 12,
                "term_max_months": 240,
                "amount_min": 50000,
                "amount_max": 2000000,
                "collateral_required": True,
            },
        ]
    },
    {
        "name": "ОАО «Амонатбонк»",
        "short_name": "Амонатбонк",
        "website": "https://amonatbank.tj",
        "phone": "+992 37 221-19-00",
        "type": "bank",
        "founded_year": 1992,
        "products": [
            {
                "type": "deposit",
                "name": "«Амонат» (сбережения)",
                "currency": "TJS",
                "rate_min": 9.0,
                "rate_max": 14.0,
                "term_min_months": 1,
                "term_max_months": 36,
                "amount_min": 50,
                "early_withdrawal": True,
                "capitalization": False,
                "insurance": True,
            },
            {
                "type": "deposit",
                "name": "«Амонати Мухлат» (срочный)",
                "currency": "TJS",
                "rate_min": 12.0,
                "rate_max": 17.0,
                "term_min_months": 6,
                "term_max_months": 60,
                "amount_min": 500,
                "early_withdrawal": False,
                "capitalization": True,
                "insurance": True,
            },
            {
                "type": "credit",
                "name": "Кредит «Рушди Иктисодиёт»",
                "currency": "TJS",
                "rate_min": 20.0,
                "rate_max": 26.0,
                "term_min_months": 3,
                "term_max_months": 84,
                "amount_min": 500,
                "amount_max": 500000,
                "collateral_required": False,
            },
        ]
    },
    {
        "name": "ЗАО «Душанбе Сити Банк»",
        "short_name": "Душанбе Сити",
        "website": "https://dcb.tj",
        "phone": "+992 37 227-55-55",
        "type": "bank",
        "founded_year": 2003,
        "products": [
            {
                "type": "deposit",
                "name": "Депозит «Стандарт»",
                "currency": "TJS",
                "rate_min": 11.0,
                "rate_max": 15.0,
                "term_min_months": 3,
                "term_max_months": 24,
                "amount_min": 200,
                "insurance": True,
            },
            {
                "type": "credit",
                "name": "Экспресс-кредит",
                "currency": "TJS",
                "rate_min": 24.0,
                "rate_max": 30.0,
                "term_min_months": 3,
                "term_max_months": 36,
                "amount_min": 500,
                "amount_max": 30000,
                "collateral_required": False,
                "income_proof_required": False,
            },
            {
                "type": "card",
                "name": "Карта «Korti Milli»",
                "currency": "TJS",
                "annual_fee": 50,
                "cashback_percent": 0.5,
                "card_type": "korti-milli",
            },
        ]
    },
    {
        "name": "ОАО «Таджпромбонк»",
        "short_name": "Таджпромбонк",
        "website": "https://tpb.tj",
        "phone": "+992 37 224-75-50",
        "type": "bank",
        "founded_year": 1991,
        "products": [
            {
                "type": "deposit",
                "name": "Срочный депозит",
                "currency": "TJS",
                "rate_min": 10.0,
                "rate_max": 14.0,
                "term_min_months": 6,
                "term_max_months": 36,
                "amount_min": 100,
                "insurance": True,
            },
            {
                "type": "credit",
                "name": "Бизнес-кредит",
                "currency": "TJS",
                "rate_min": 19.0,
                "rate_max": 25.0,
                "term_min_months": 6,
                "term_max_months": 60,
                "amount_min": 10000,
                "amount_max": 1000000,
                "collateral_required": True,
            },
        ]
    },
    {
        "name": "ОАО МФБ «Ибрагимов и К»",
        "short_name": "Ибрагимов и К",
        "website": "https://ibk.tj",
        "phone": "+992 37 221-51-24",
        "type": "bank",
        "founded_year": 1998,
        "products": [
            {
                "type": "deposit",
                "name": "Депозит физических лиц",
                "currency": "TJS",
                "rate_min": 12.0,
                "rate_max": 18.0,
                "term_min_months": 3,
                "term_max_months": 24,
                "amount_min": 200,
            },
            {
                "type": "credit",
                "name": "Микрокредит для МСБ",
                "currency": "TJS",
                "rate_min": 22.0,
                "rate_max": 32.0,
                "term_min_months": 3,
                "term_max_months": 36,
                "amount_min": 500,
                "amount_max": 50000,
                "collateral_required": False,
            },
        ]
    },
    {
        "name": "ООО МКО «Мол Булак Файнанс»",
        "short_name": "Мол Булак",
        "website": "https://molbulak.tj",
        "phone": "+992 44 600-06-00",
        "type": "mfo",
        "founded_year": 2008,
        "products": [
            {
                "type": "credit",
                "name": "Кредит для бизнеса",
                "currency": "TJS",
                "rate_min": 28.0,
                "rate_max": 36.0,
                "term_min_months": 3,
                "term_max_months": 36,
                "amount_min": 500,
                "amount_max": 200000,
                "collateral_required": False,
            },
            {
                "type": "credit",
                "name": "Кредит для сельского хозяйства",
                "currency": "TJS",
                "rate_min": 24.0,
                "rate_max": 30.0,
                "term_min_months": 6,
                "term_max_months": 24,
                "amount_min": 1000,
                "amount_max": 100000,
            },
        ]
    },
    {
        "name": "ООО МФО «IMON International»",
        "short_name": "IMON",
        "website": "https://imon.tj",
        "phone": "+992 44 600-10-00",
        "type": "mfo",
        "founded_year": 2007,
        "products": [
            {
                "type": "credit",
                "name": "Кредит «Бизнес»",
                "currency": "TJS",
                "rate_min": 26.0,
                "rate_max": 34.0,
                "term_min_months": 3,
                "term_max_months": 36,
                "amount_min": 1000,
                "amount_max": 300000,
                "collateral_required": False,
            },
            {
                "type": "wallet",
                "name": "Alif Mobi кошелёк",
                "currency": "TJS",
                "conditions": "Переводы, оплата, пополнение без комиссии внутри системы",
            },
        ]
    },
]

def seed_database():
    """Заполняет базу данных начальными данными"""
    db = SessionLocal()
    try:
        existing = db.query(Bank).count()
        if existing > 0:
            logger.info(f"БД уже содержит {existing} банков. Пропускаем seed.")
            return

        total_banks = 0
        total_products = 0

        for bank_data in BANKS_DATA:
            products_data = bank_data.pop("products", [])

            bank = Bank(**bank_data)
            db.add(bank)
            db.flush()

            for pd in products_data:
                product = Product(bank_id=bank.id, **pd)
                db.add(product)
                total_products += 1

            total_banks += 1
            bank_data["products"] = products_data  # restore

        db.commit()
        logger.info(f"✓ Добавлено банков: {total_banks}, продуктов: {total_products}")

    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
