"""
Announcement — posted by host/co-host, visible to all event members.
SMS is sent to opted-in members via the notifications Lambda.
"""
from datetime import datetime
from sqlalchemy import DateTime, String, Integer, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[str] = mapped_column(String, nullable=False)  # cognito_sub
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sms_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    event: Mapped["Event"] = relationship("Event", back_populates="announcements")
