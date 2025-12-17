from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Tuple
from models.products import Product
from schemes.product import ProductCreate, ProductUpdate, ProductFilter 
from exceptions.products import (
    ProductNotFoundException, 
    InvalidProductDataException,
    RestaurantProductException
)
import datetime
from decimal import Decimal

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def _parse_quantity(self, quantity_str: str) -> Decimal:
        """Преобразует строку количества в Decimal"""
        try:
            return Decimal(quantity_str)
        except:
            raise InvalidProductDataException(f"Invalid quantity format: {quantity_str}")

    def _parse_price(self, price_str: str) -> Decimal:
        """Преобразует строку цены в Decimal"""
        try:
            return Decimal(price_str)
        except:
            raise InvalidProductDataException(f"Invalid price format: {price_str}")

    def get_by_id(self, product_id: int, restaurant_id: Optional[int] = None) -> Product:
        query = self.db.query(Product).filter(Product.id == product_id)
        
        if restaurant_id:
            query = query.filter(Product.restaurant_id == restaurant_id)
        
        product = query.first()
        if not product:
            raise ProductNotFoundException(product_id=product_id)
        return product

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[ProductFilter] = None
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product)
        
        if filters:
            if filters.category:
                query = query.filter(Product.category == filters.category)
            if filters.restaurant_id:
                query = query.filter(Product.restaurant_id == filters.restaurant_id)
            if filters.expire_before:
                query = query.filter(Product.expire_date <= filters.expire_before)
            if filters.expire_after:
                query = query.filter(Product.expire_date >= filters.expire_after)
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total

    def get_by_restaurant(self, restaurant_id: int, skip: int = 0, limit: int = 100) -> List[Product]:
        products = self.db.query(Product)\
            .filter(Product.restaurant_id == restaurant_id)\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        if not products:
            raise ProductNotFoundException(restaurant_id=restaurant_id)
        
        return products

    def get_expiring_products(self, days: int = 7) -> List[Product]:
        """Получить продукты, срок годности которых истекает в течение указанных дней"""
        today = datetime.date.today()
        target_date = today + datetime.timedelta(days=days)
        
        return self.db.query(Product)\
            .filter(
                and_(
                    Product.expire_date.isnot(None),
                    Product.expire_date >= today.strftime('%Y-%m-%d'),
                    Product.expire_date <= target_date.strftime('%Y-%m-%d')
                )
            )\
            .all()

    def create(self, product_data: ProductCreate) -> Product:
        # Проверяем числовые поля
        self._parse_price(product_data.price)
        self._parse_quantity(product_data.quantity)
        
        product = Product(**product_data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product_id: int, product_data: ProductUpdate, restaurant_id: Optional[int] = None) -> Product:
        product = self.get_by_id(product_id, restaurant_id)
        
        update_data = product_data.model_dump(exclude_unset=True)
        
        # Проверяем числовые поля при обновлении
        if 'price' in update_data:
            self._parse_price(update_data['price'])
        if 'quantity' in update_data:
            self._parse_quantity(update_data['quantity'])
        
        for field, value in update_data.items():
            setattr(product, field, value)
        
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product_id: int, restaurant_id: Optional[int] = None) -> bool:
        product = self.get_by_id(product_id, restaurant_id)
        self.db.delete(product)
        self.db.commit()
        return True

    def update_quantity(self, product_id: int, quantity_change: str, restaurant_id: Optional[int] = None) -> Product:
        product = self.get_by_id(product_id, restaurant_id)
        
        current_qty = self._parse_quantity(product.quantity)
        change_qty = self._parse_quantity(quantity_change)
        
        new_qty = current_qty + change_qty
        
        if new_qty < Decimal('0'):
            from exceptions.products import InsufficientQuantityException
            raise InsufficientQuantityException(
                product_id=product_id,
                requested=quantity_change,
                available=product.quantity
            )
        
        product.quantity = str(new_qty)
        self.db.commit()
        self.db.refresh(product)
        return product

    def check_expired(self, product_id: int) -> bool:
        """Проверяет, истек ли срок годности продукта"""
        product = self.get_by_id(product_id)
        
        if not product.expire_date:
            return False
        
        try:
            expire_date = datetime.datetime.strptime(product.expire_date, '%Y-%m-%d').date()
            return expire_date < datetime.date.today()
        except ValueError:
            # Если формат даты другой, пытаемся разобрать
            try:
                expire_date = datetime.datetime.strptime(product.expire_date, '%d.%m.%Y').date()
                return expire_date < datetime.date.today()
            except ValueError:
                # Не удалось распознать дату
                return False

    def get_category_stats(self, restaurant_id: Optional[int] = None) -> List[dict]:
        """Статистика по категориям"""
        query = self.db.query(
            Product.category,
            func.count(Product.id).label('count'),
            func.sum(func.cast(Product.quantity, func.Float)).label('total_quantity')
        ).group_by(Product.category)
        
        if restaurant_id:
            query = query.filter(Product.restaurant_id == restaurant_id)
        
        return [
            {
                'category': row[0],
                'count': row[1],
                'total_quantity': str(row[2]) if row[2] else '0'
            }
            for row in query.all()
        ]