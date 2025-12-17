from sqlalchemy import Column, Integer, String, Numeric, ForeignKey 
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class ReviewModel(Base):
   __tablename__ = 'reviews'
   id: Mapped[int] = mapped_column(Integer, primary_key=True)
   user_id: Mapped[int] = mapped_column(Integer)
   product_id: Mapped[int] = mapped_column(Integer)
   rating: Mapped[str] = mapped_column(Numeric)
   comment: Mapped[str]  = mapped_column(String(65535))
   created_at: Mapped[str]  = mapped_column(Numeric)
   
   users_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
   product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)