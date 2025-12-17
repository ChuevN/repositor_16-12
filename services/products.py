from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from repositories.products import ProductRepository
from schemes.product import (
    ProductCreate, 
    ProductUpdate, 
    ProductResponse, 
    ProductList,
    ProductFilter,
    ProductStockUpdate
)
from exceptions.products import (
    ExpiredProductException,
    RestaurantProductException
)
import datetime

class ProductService:
    def __init__(self, db: Session):
        self.repository = ProductRepository(db)

    def get_product(self, product_id: int, restaurant_id: Optional[int] = None) -> ProductResponse:
        product = self.repository.get_by_id(product_id, restaurant_id)
        
        # Проверяем срок годности
        if self.repository.check_expired(product_id):
            raise ExpiredProductException(product_id, product.expire_date)
        
        return ProductResponse.model_validate(product)

    def get_products(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[ProductFilter] = None
    ) -> Tuple[List[ProductList], int]:
        products, total = self.repository.get_all(skip, limit, filters)
        return [ProductList.model_validate(p) for p in products], total

    def get_restaurant_products(self, restaurant_id: int, skip: int = 0, limit: int = 100) -> List[ProductList]:
        products = self.repository.get_by_restaurant(restaurant_id, skip, limit)
        return [ProductList.model_validate(p) for p in products]

    def get_expiring_products(self, days: int = 7) -> List[ProductList]:
        products = self.repository.get_expiring_products(days)
        return [ProductList.model_validate(p) for p in products]

    def create_product(self, product_data: ProductCreate) -> ProductResponse:
        product = self.repository.create(product_data)
        return ProductResponse.model_validate(product)

    def update_product(
        self, 
        product_id: int, 
        product_data: ProductUpdate,
        restaurant_id: Optional[int] = None
    ) -> ProductResponse:
        product = self.repository.update(product_id, product_data, restaurant_id)
        return ProductResponse.model_validate(product)

    def delete_product(self, product_id: int, restaurant_id: Optional[int] = None) -> bool:
        return self.repository.delete(product_id, restaurant_id)

    def update_stock(
        self, 
        product_id: int, 
        stock_data: ProductStockUpdate,
        restaurant_id: Optional[int] = None
    ) -> ProductResponse:
        product = self.repository.update_quantity(
            product_id, 
            stock_data.quantity_change, 
            restaurant_id
        )
        return ProductResponse.model_validate(product)

    def check_availability(self, product_id: int, required_quantity: str) -> Dict[str, Any]:
        product = self.repository.get_by_id(product_id)
        
        from decimal import Decimal
        try:
            available_qty = Decimal(product.quantity)
            required_qty = Decimal(required_quantity)
            
            is_available = available_qty >= required_qty
            is_expired = self.repository.check_expired(product_id)
            
            return {
                "available": is_available and not is_expired,
                "current_quantity": product.quantity,
                "required_quantity": required_quantity,
                "is_expired": is_expired,
                "expire_date": product.expire_date
            }
        except:
            return {
                "available": False,
                "current_quantity": product.quantity,
                "required_quantity": required_quantity,
                "is_expired": self.repository.check_expired(product_id),
                "expire_date": product.expire_date
            }

    def get_category_statistics(self, restaurant_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return self.repository.get_category_stats(restaurant_id)

    def bulk_update_quantities(self, updates: List[Dict[str, Any]]) -> List[ProductResponse]:
        """Массовое обновление количеств продуктов"""
        results = []
        for update in updates:
            product_id = update.get('product_id')
            quantity_change = update.get('quantity_change')
            restaurant_id = update.get('restaurant_id')
            
            try:
                product = self.repository.update_quantity(
                    product_id, 
                    quantity_change, 
                    restaurant_id
                )
                results.append(ProductResponse.model_validate(product))
            except Exception as e:
                results.append({
                    'product_id': product_id,
                    'error': str(e)
                })
        
        return results