"""
Poll system — supports single and multi-select, anonymous or public voting.

Poll lifecycle:
  open  → closed (by host/co-host manually, or automatically at closes_at)

PollOption — the choices on a poll
PollVote   — one row per user per option (multi-select = multiple rows per user)
             For anonymous polls, voter_id is stored but never returned to clients.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class Poll(Base):
    __tablename__ = "polls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by: Mapped[str] = mapped_column(String, nullable=False)  # cognito_sub
    question: Mapped[str] = mapped_column(Text, nullable=False)
    allow_multi_select: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    closes_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )  # null = manual close only
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    event: Mapped["Event"] = relationship("Event", back_populates="polls")
    options: Mapped[list["PollOption"]] = relationship(
        "PollOption", back_populates="poll", cascade="all, delete-orphan"
    )
    votes: Mapped[list["PollVote"]] = relationship(
        "PollVote", back_populates="poll", cascade="all, delete-orphan"
    )


class PollOption(Base):
    __tablename__ = "poll_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    poll_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(String, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    poll: Mapped["Poll"] = relationship("Poll", back_populates="options")
    votes: Mapped[list["PollVote"]] = relationship(
        "PollVote", back_populates="option", cascade="all, delete-orphan"
    )


class PollVote(Base):
    __tablename__ = "poll_votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    poll_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False, index=True
    )
    option_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("poll_options.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    voter_id: Mapped[str] = mapped_column(
        String, nullable=False
    )  # cognito_sub — hidden from results if anonymous
    voted_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    poll: Mapped["Poll"] = relationship("Poll", back_populates="votes")
    option: Mapped["PollOption"] = relationship("PollOption", back_populates="votes")
