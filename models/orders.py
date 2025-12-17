from sqlalchemy import Column, Integer,Text, String, Time,ForeignKey 
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class OrderModel(Base):
    __tablename__ = 'orders'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    restaurant_id: Mapped[int]  = mapped_column(Integer)
    delivery_time: Mapped[str] =mapped_column(Time)
    order_components: Mapped[str]  = mapped_column(Text(655535))
    
    restaraunt_id: Mapped[int] = mapped_column(ForeignKey("restaraunt.id"), nullable=False)