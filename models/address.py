from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import mapped_column,Mapped, relationship
from app.database.database import Base

class AdresModel(Base):
   __tablename__ = 'adres'
   id: Mapped[int] = mapped_column(Integer, primary_key=True)
   flat: Mapped[str]  = mapped_column(String(200))
   street: Mapped[str]  = mapped_column(String(200))
   entrance: Mapped[str]  = mapped_column(String(200))
   floor: Mapped[str]  = mapped_column(String(200))
   user_id: Mapped[int] = mapped_column(Integer)
   
   restauraunts_id: Mapped[int] = mapped_column(ForeignKey("restauraunt.id"), nullable=False)
   users_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)