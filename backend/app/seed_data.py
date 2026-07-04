import json
import re
from pathlib import Path

from sqlalchemy.orm import Session

from app import models

DATA_DIR = Path(__file__).parent / "data"


def _price_amount(price_display: str) -> float:
    digits = re.sub(r"[^\d]", "", price_display)
    return float(digits) if digits else 0.0


def _load(filename: str) -> list[dict]:
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def seed_products(db: Session) -> None:
    if db.query(models.Product).first() is not None:
        return  # already seeded

    for raw in _load("products_raw.json"):
        db.add(
            models.Product(
                product_type=models.ProductType.phone,
                category=raw["cat"],
                condition=raw["cond"],
                name=raw["name"],
                short_description=raw["short"],
                price_display=raw["price"],
                price_amount=_price_amount(raw["price"]),
                spec_key=raw["specKey"],
            )
        )

    for raw in _load("appliances_raw.json"):
        db.add(
            models.Product(
                product_type=models.ProductType.appliance,
                category=raw["cat"],
                name=raw["name"],
                price_display=raw["price"],
                price_amount=_price_amount(raw["price"]),
                icon_emoji=raw["icon"],
                brand=raw["brand"],
                specs=raw["specs"],
                badge=raw["badge"],
            )
        )

    db.commit()
