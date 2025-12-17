from fastapi import HTTPException, status

class ProductException(HTTPException):
    pass

class ProductNotFoundException(ProductException):
    def __init__(self, product_id: int = None, restaurant_id: int = None):
        detail = "Product not found"
        if product_id:
            detail = f"Product with ID {product_id} not found"
        elif restaurant_id:
            detail = f"No products found for restaurant {restaurant_id}"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class InvalidProductDataException(ProductException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

class InsufficientQuantityException(ProductException):
    def __init__(self, product_id: int, requested: str, available: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient quantity for product {product_id}. "
                   f"Requested: {requested}, Available: {available}"
        )

class ExpiredProductException(ProductException):
    def __init__(self, product_id: int, expire_date: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product {product_id} expired on {expire_date}"
        )

class RestaurantProductException(ProductException):
    def __init__(self, product_id: int, restaurant_id: int):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Product {product_id} does not belong to restaurant {restaurant_id}"
        )