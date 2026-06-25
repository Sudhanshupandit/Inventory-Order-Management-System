from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    sku: str = Field(..., min_length=1)
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    sku: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_items=1)

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True

# --- DASHBOARD SCHEMAS ---
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: List[ProductResponse]
