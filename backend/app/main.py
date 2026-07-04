from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, cart, orders, products
from app.security import hash_password
from app.seed_data import seed_products

settings = get_settings()

app = FastAPI(title="Volta Store API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(orders.router)


def _seed_admin(db) -> None:
    existing = db.query(models.User).filter(models.User.email == settings.admin_email).first()
    if existing is not None:
        return
    db.add(
        models.User(
            name="Admin",
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
            is_admin=True,
        )
    )
    db.commit()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_products(db)
        _seed_admin(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
