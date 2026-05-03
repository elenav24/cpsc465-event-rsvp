from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models so Alembic and SQLAlchemy see them
from app.db.models.event import Event  # noqa: E402, F401
from app.db.models.event_member import EventMember  # noqa: E402, F401
from app.db.models.pending_invite import PendingInvite  # noqa: E402, F401
from app.db.models.rsvp import RSVP  # noqa: E402, F401
from app.db.models.poll import Poll, PollOption, PollVote  # noqa: E402, F401
from app.db.models.potluck import PotluckItem, PotluckClaim  # noqa: E402, F401
from app.db.models.announcement import Announcement  # noqa: E402, F401
from app.db.models.task import Task  # noqa: E402, F401
from app.db.models.reminder import ReminderPreference  # noqa: E402, F401
