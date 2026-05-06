"""
Task / checklist system.

Tasks are created by host/co-host.
Any member can volunteer (self-assign); host/co-host can also assign directly.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by: Mapped[str] = mapped_column(String, nullable=False)  # cognito_sub
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # cognito_sub, null = unassigned
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    event: Mapped["Event"] = relationship("Event", back_populates="tasks")
