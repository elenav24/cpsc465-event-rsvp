"""
Potluck system.

PotluckItem  — defined by host/co-host (e.g. "Dessert", "Drinks x2")
PotluckClaim — attendee signs up to bring a specific item
               quantity_needed on the item tracks how many are needed total;
               claims are limited to that quantity.

When an attendee's RSVP changes to 'no', their claims are deleted automatically
by the RSVP router.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class PotluckItem(Base):
    __tablename__ = "potluck_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False)  # cognito_sub of host/co-host
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity_needed: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    event: Mapped["Event"] = relationship("Event", back_populates="potluck_items")
    claims: Mapped[list["PotluckClaim"]] = relationship("PotluckClaim", back_populates="item", cascade="all, delete-orphan")


class PotluckClaim(Base):
    __tablename__ = "potluck_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey("potluck_items.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # cognito_sub
    claimed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    item: Mapped["PotluckItem"] = relationship("PotluckItem", back_populates="claims")
