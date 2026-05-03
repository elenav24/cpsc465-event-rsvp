"""
ReminderPreference — per-user per-event SMS reminder settings.

offset_minutes: how many minutes before the event start to send the reminder.
  Common values:
    525600 = 1 week
    1440   = 24 hours
    360    = 6 hours
    60     = 1 hour

EventBridge Scheduler rules are created/updated when these preferences change.
The scheduler_rule_name stores the AWS EventBridge rule name so it can be
deleted/updated when the preference changes.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class ReminderPreference(Base):
    __tablename__ = "reminder_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # cognito_sub
    offset_minutes: Mapped[int] = mapped_column(Integer, nullable=False)  # minutes before event start
    scheduler_rule_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # EventBridge rule name
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
