from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.db.models.event import Event  # noqa: E402, F401
