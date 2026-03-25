from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    gender = Column(String(20), nullable=True)
    role = Column(String(20), default="user")
    verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=False), server_default=func.now())
