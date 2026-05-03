"""
RSVP — one row per user per event.

status: yes | no | maybe
guest_count: number of additional guests the user is bringing (0 = just themselves)

When status changes to 'no', the application layer releases any potluck claims.
"""
from datetime import datetime
from sqlalchemy import DateTime, String, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class RSVP(Base):
    __tablename__ = "rsvps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # cognito_sub
    status: Mapped[str] = mapped_column(String, nullable=False)  # yes | no | maybe
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    event: Mapped["Event"] = relationship("Event", back_populates="rsvps")
