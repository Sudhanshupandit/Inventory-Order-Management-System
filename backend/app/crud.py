from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from fastapi import HTTPException, status
from decimal import Decimal

# --- PRODUCT CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
        
    has_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product. It is referenced in existing orders. Consider setting its stock to 0 instead."
        )
        
    db.delete(db_product)
    db.commit()
    return db_product

# --- CUSTOMER CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )
        
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer. They have active order history."
        )
        
    db.delete(db_customer)
    db.commit()
    return db_customer

# --- ORDER CRUD ---
def get_order(db: Session, order_id: int):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if order:
        if order.customer:
            order.customer_name = order.customer.name
            order.customer_email = order.customer.email
        for item in order.items:
            if item.product:
                item.product_name = item.product.name
                item.product_sku = item.product.sku
    return order

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()
    for order in orders:
        if order.customer:
            order.customer_name = order.customer.name
            order.customer_email = order.customer.email
        for item in order.items:
            if item.product:
                item.product_name = item.product.name
                item.product_sku = item.product.sku
    return orders

def create_order(db: Session, order_in: schemas.OrderCreate):
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )
        
    total_amount = Decimal("0.00")
    order_items = []
    
    try:
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=Decimal("0.00")
        )
        db.add(db_order)
        db.flush()
        
        for item in order_in.items:
            product = get_product(db, item.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found."
                )
                
            if product.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}."
                )
                
            product.quantity -= item.quantity
            
            line_total = product.price * item.quantity
            total_amount += line_total
            
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price
            )
            db.add(db_item)
            order_items.append(db_item)
            
        db_order.total_amount = total_amount
        db.commit()
        
        db.refresh(db_order)
        
        db_order.customer_name = customer.name
        db_order.customer_email = customer.email
        for item in db_order.items:
            item.product_name = item.product.name
            item.product_sku = item.product.sku
            
        return db_order
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )
        
    try:
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product:
                product.quantity += item.quantity
                
        db.delete(db_order)
        db.commit()
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(e)}"
        )

# --- DASHBOARD STATS ---
def get_dashboard_stats(db: Session):
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    total_customers = db.query(func.count(models.Customer.id)).scalar() or 0
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    
    total_revenue_val = db.query(func.sum(models.Order.total_amount)).scalar()
    total_revenue = Decimal(str(total_revenue_val)) if total_revenue_val is not None else Decimal("0.00")
    
    low_stock = db.query(models.Product).filter(models.Product.quantity < 10).order_by(models.Product.quantity.asc()).all()
    
    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        low_stock_products=low_stock
    )
