from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class VoteSession(Base):
    __tablename__ = "vote_sessions"

    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, nullable=False)
    sticker_id = Column(Integer, ForeignKey("stickers.id", ondelete="CASCADE"), nullable=True)
    question = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
