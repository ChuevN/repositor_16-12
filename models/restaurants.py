from sqlalchemy import Column, Integer, String,ForeignKey 
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class RestaurantModel(Base):
   __tablename__ = 'restaurant'
   id: Mapped[int] = mapped_column(Integer, primary_key=True)
   name: Mapped[str]  = mapped_column(String(255))
   address: Mapped[str] = mapped_column(String(65535))
   contact: Mapped[str]  = mapped_column(String(65535))
   product_id: Mapped[int] = mapped_column(Integer)
   restaurant_id: Mapped[int] = mapped_column(Integer)
   address_id: Mapped[int] = mapped_column(Integer)
   
   addreses_id: Mapped[int] = mapped_column(ForeignKey("address.id"), nullable=False)
   product_id: Mapped[int] = mapped_column(ForeignKey("address.id"), nullable=False)
