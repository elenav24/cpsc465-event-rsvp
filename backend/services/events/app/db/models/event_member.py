"""
EventMember — tracks who is in an event and their role.

Roles:
  host      — original creator, full control, can promote others
  co_host   — can edit event, manage RSVPs, create polls/potluck/tasks/announcements
  attendee  — standard member

phone_number is denormalized from the users service at join time so the
events service can send SMS reminders without a cross-service DB call.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class EventMember(Base):
    __tablename__ = "event_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # cognito_sub
    role: Mapped[str] = mapped_column(String, nullable=False, default="attendee")  # host | co_host | attendee
    # Denormalized from users service so the guest list can show real names
    display_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Denormalized from users service for SMS delivery
    phone_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sms_opted_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    event: Mapped["Event"] = relationship("Event", back_populates="members")
