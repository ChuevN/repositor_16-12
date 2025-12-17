from sqlalchemy import Column, Integer, String, Date,ForeignKey 
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class ProductModel(Base):
   __tablename__ = 'products'
   id: Mapped[int] = mapped_column(Integer, primary_key=True)
   price: Mapped[str]  = mapped_column(String(10000))
   quantity: Mapped[str]  = mapped_column(String(10000))
   category: Mapped[str]  = mapped_column(String(65535))
   expire_date: Mapped[str]   = mapped_column(String(1000),Date)
   restaurant_id: Mapped[int] = mapped_column(Integer)
   
   restaraunt_id: Mapped[int] = mapped_column(ForeignKey("restaraunt.id"), nullable=False)
   reviews_id: Mapped[int] = mapped_column(ForeignKey("reviews.id"), nullable=False)
