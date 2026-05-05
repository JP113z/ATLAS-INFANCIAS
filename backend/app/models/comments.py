from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
from app.database import Base 

class StickerComment(Base):
    __tablename__ = "sticker_comments"

    id = Column(Integer, primary_key=True, index=True)
    sticker_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted = Column(Boolean, nullable=False, default=False)

    user = relationship("User") 
