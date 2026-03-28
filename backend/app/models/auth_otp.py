import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class AuthOtpChallenge(Base):
    __tablename__ = "auth_otp_challenges"

    id = Column(Integer, primary_key=True)
    challenge_id = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    code_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    attempts = Column(Integer, default=0)
    consumed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())