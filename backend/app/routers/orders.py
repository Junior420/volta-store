from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_admin, get_current_user, get_or_create_cart

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/", response_model=schemas.OrderOut, status_code=201)
def checkout(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    cart = get_or_create_cart(user, db)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = models.Order(
        user_id=user.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_address=payload.customer_address,
        notes=payload.notes,
        total_amount=0,
    )
    total = 0.0
    for item in cart.items:
        unit_price = float(item.product.price_amount)
        subtotal = unit_price * item.quantity
        total += subtotal
        order.items.append(
            models.OrderItem(
                product_id=item.product_id,
                product_name=item.product.name,
                unit_price=unit_price,
                quantity=item.quantity,
                subtotal=subtotal,
            )
        )
    order.total_amount = total
    db.add(order)

    for item in list(cart.items):
        cart.items.remove(item)
        db.delete(item)

    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[schemas.OrderOut])
def list_my_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get("/admin/all", response_model=list[schemas.OrderOut])
def list_all_orders(db: Session = Depends(get_db), _admin: models.User = Depends(get_current_admin)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


@router.patch("/admin/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(get_current_admin),
):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    order = db.get(models.Order, order_id)
    if order is None or (order.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=404, detail="Order not found")
    return order
