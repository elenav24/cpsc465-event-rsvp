from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    host_id: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    flyer_url: Mapped[Optional[str]] = mapped_column(String, nullable=True) 
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())