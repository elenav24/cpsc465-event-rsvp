import uuid as _uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True,
        default=lambda: str(_uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    flyer_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Host is identified by cognito_sub (string)
    host_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

    # Date/time — multi-day supported via separate start/end datetimes
    start_dt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_dt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Recurrence — null means one-off event
    # parent_event_id links occurrences back to the original recurring event
    recurrence_rule: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # e.g. "WEEKLY", "DAILY", "MONTHLY"
    recurrence_end_dt: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    parent_event_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("events.id"), nullable=True
    )

    # Invite link — all events are invite-only
    invite_token: Mapped[Optional[str]] = mapped_column(
        String, unique=True, nullable=True, index=True
    )
    invite_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # viewable_by_link: True = anyone with link can view (like Google Docs), False = must be member
    viewable_by_link: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationships
    members: Mapped[list["EventMember"]] = relationship(
        "EventMember", back_populates="event", cascade="all, delete-orphan"
    )
    rsvps: Mapped[list["RSVP"]] = relationship(
        "RSVP", back_populates="event", cascade="all, delete-orphan"
    )
    polls: Mapped[list["Poll"]] = relationship(
        "Poll", back_populates="event", cascade="all, delete-orphan"
    )
    potluck_items: Mapped[list["PotluckItem"]] = relationship(
        "PotluckItem", back_populates="event", cascade="all, delete-orphan"
    )
    announcements: Mapped[list["Announcement"]] = relationship(
        "Announcement", back_populates="event", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="event", cascade="all, delete-orphan"
    )
    pending_invites: Mapped[list["PendingInvite"]] = relationship(
        "PendingInvite", back_populates="event", cascade="all, delete-orphan"
    )
