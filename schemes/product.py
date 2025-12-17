from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional
import datetime
from decimal import Decimal

# Базовые схемы
class ProductBase(BaseModel):
    price: str = Field(..., max_length=10000)
    quantity: str = Field(..., max_length=10000)
    category: str = Field(..., max_length=65535)
    expire_date: Optional[str] = Field(None, max_length=1000)
    restaurant_id: int

    model_config = ConfigDict(from_attributes=True)

    @validator('price', 'quantity')
    def validate_numeric_string(cls, v):
        """Проверяем, что строка содержит числовое значение"""
        try:
            float(v)
        except ValueError:
            raise ValueError(f"Value must be a valid number: {v}")
        return v

    @validator('expire_date')
    def validate_date_format(cls, v):
        """Проверяем формат даты, если она указана"""
        if v is not None:
            try:
                # Пробуем разные форматы дат
                datetime.datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                try:
                    datetime.datetime.strptime(v, '%d.%m.%Y')
                except ValueError:
                    raise ValueError("Date must be in format YYYY-MM-DD or DD.MM.YYYY")
        return v

# Для создания
class ProductCreate(ProductBase):
    pass

# Для обновления
class ProductUpdate(BaseModel):
    price: Optional[str] = Field(None, max_length=10000)
    quantity: Optional[str] = Field(None, max_length=10000)
    category: Optional[str] = Field(None, max_length=65535)
    expire_date: Optional[str] = Field(None, max_length=1000)
    restaurant_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Для ответа
class ProductResponse(ProductBase):
    id: int

# Для списка
class ProductList(BaseModel):
    id: int
    price: str
    quantity: str
    category: str
    expire_date: Optional[str]
    restaurant_id: int

    model_config = ConfigDict(from_attributes=True)

# Специальные схемы
class ProductFilter(BaseModel):
    category: Optional[str] = None
    restaurant_id: Optional[int] = None
    expire_before: Optional[str] = None  # Дата в формате YYYY-MM-DD
    expire_after: Optional[str] = None   # Дата в формате YYYY-MM-DD

class ProductStockUpdate(BaseModel):
    quantity_change: str  # Может быть положительным или отрицательным числом