from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class VoteAnswer(Base):
    __tablename__ = "vote_answers"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("vote_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    answer = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "user_id", name="uq_vote_per_user"),
    )
