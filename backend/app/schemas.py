from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import OrderStatus, ProductType


# ── Products ──
class ProductBase(BaseModel):
    product_type: ProductType
    category: str
    name: str
    price_display: str
    price_amount: float = 0

    condition: str | None = None
    short_description: str | None = None
    spec_key: str | None = None

    icon_emoji: str | None = None
    brand: str | None = None
    specs: str | None = None
    badge: str | None = None

    stock_quantity: int = 10
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_type: ProductType | None = None
    category: str | None = None
    name: str | None = None
    price_display: str | None = None
    price_amount: float | None = None
    condition: str | None = None
    short_description: str | None = None
    spec_key: str | None = None
    icon_emoji: str | None = None
    brand: str | None = None
    specs: str | None = None
    badge: str | None = None
    stock_quantity: int | None = None
    is_active: bool | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Auth / Users ──
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    phone: str | None
    is_admin: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Cart ──
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product: ProductOut
    quantity: int
    subtotal: float


class CartOut(BaseModel):
    id: int
    items: list[CartItemOut]
    total: float


# ── Orders ──
class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    notes: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: str
    unit_price: float
    quantity: int
    subtotal: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    customer_name: str
    customer_phone: str
    customer_address: str
    notes: str | None
    total_amount: float
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
