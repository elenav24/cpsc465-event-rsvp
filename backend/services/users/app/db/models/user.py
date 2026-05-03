from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.models import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cognito_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
