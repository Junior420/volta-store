from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user, get_or_create_cart

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _cart_out(cart: models.Cart) -> schemas.CartOut:
    items = [
        schemas.CartItemOut(
            id=item.id,
            product=schemas.ProductOut.model_validate(item.product),
            quantity=item.quantity,
            subtotal=float(item.product.price_amount) * item.quantity,
        )
        for item in cart.items
    ]
    total = sum(item.subtotal for item in items)
    return schemas.CartOut(id=cart.id, items=items, total=total)


@router.get("/", response_model=schemas.CartOut)
def get_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    cart = get_or_create_cart(user, db)
    return _cart_out(cart)


@router.post("/items", response_model=schemas.CartOut, status_code=201)
def add_item(
    payload: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    product = db.get(models.Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = get_or_create_cart(user, db)
    existing = next((i for i in cart.items if i.product_id == payload.product_id), None)
    if existing is not None:
        existing.quantity += payload.quantity
    else:
        cart.items.append(models.CartItem(product_id=payload.product_id, quantity=payload.quantity))
    db.commit()
    db.refresh(cart)
    return _cart_out(cart)


@router.patch("/items/{product_id}", response_model=schemas.CartOut)
def update_item(
    product_id: int,
    payload: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    cart = get_or_create_cart(user, db)
    item = next((i for i in cart.items if i.product_id == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not in cart")
    item.quantity = payload.quantity
    db.commit()
    db.refresh(cart)
    return _cart_out(cart)


@router.delete("/items/{product_id}", response_model=schemas.CartOut)
def remove_item(
    product_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    cart = get_or_create_cart(user, db)
    item = next((i for i in cart.items if i.product_id == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not in cart")
    cart.items.remove(item)
    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _cart_out(cart)


@router.delete("/", response_model=schemas.CartOut)
def clear_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    cart = get_or_create_cart(user, db)
    for item in list(cart.items):
        cart.items.remove(item)
        db.delete(item)
    db.commit()
    db.refresh(cart)
    return _cart_out(cart)
