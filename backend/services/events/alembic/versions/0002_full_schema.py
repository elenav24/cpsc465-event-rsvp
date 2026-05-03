"""Full schema — events, members, RSVPs, polls, potluck, announcements, tasks, reminders

Revision ID: 0002_events
Revises: 0001_events
Create Date: 2026-05-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_events"
down_revision: Union[str, Sequence[str], None] = "0001_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Alter events table ────────────────────────────────────────────────────
    op.add_column("events", sa.Column("location", sa.String(), nullable=True))
    op.add_column("events", sa.Column("start_dt", sa.DateTime(), nullable=True))
    op.add_column("events", sa.Column("end_dt", sa.DateTime(), nullable=True))
    op.add_column("events", sa.Column("recurrence_rule", sa.String(), nullable=True))
    op.add_column("events", sa.Column("recurrence_end_dt", sa.DateTime(), nullable=True))
    op.add_column("events", sa.Column("parent_event_id", sa.Integer(), sa.ForeignKey("events.id"), nullable=True))
    op.add_column("events", sa.Column("invite_token", sa.String(), nullable=True))
    op.add_column("events", sa.Column("invite_active", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("events", sa.Column("viewable_by_link", sa.Boolean(), nullable=False, server_default="false"))
    # host_id changes from Integer to String (cognito_sub)
    op.alter_column("events", "host_id", type_=sa.String(), nullable=False)
    op.create_index("ix_events_invite_token", "events", ["invite_token"], unique=True)

    # ── event_members ─────────────────────────────────────────────────────────
    op.create_table(
        "event_members",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="attendee"),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("sms_opted_in", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("joined_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_members_event_id", "event_members", ["event_id"])
    op.create_index("ix_event_members_user_id", "event_members", ["user_id"])

    # ── pending_invites ───────────────────────────────────────────────────────
    op.create_table(
        "pending_invites",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invite_token", sa.String(), nullable=False),
        sa.Column("session_token", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_token"),
    )
    op.create_index("ix_pending_invites_event_id", "pending_invites", ["event_id"])
    op.create_index("ix_pending_invites_session_token", "pending_invites", ["session_token"])
    op.create_index("ix_pending_invites_invite_token", "pending_invites", ["invite_token"])

    # ── rsvps ─────────────────────────────────────────────────────────────────
    op.create_table(
        "rsvps",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("guest_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rsvps_event_id", "rsvps", ["event_id"])
    op.create_index("ix_rsvps_user_id", "rsvps", ["user_id"])

    # ── polls ─────────────────────────────────────────────────────────────────
    op.create_table(
        "polls",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("allow_multi_select", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_closed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("closes_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_polls_event_id", "polls", ["event_id"])

    op.create_table(
        "poll_options",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("poll_id", sa.Integer(), sa.ForeignKey("polls.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_poll_options_poll_id", "poll_options", ["poll_id"])

    op.create_table(
        "poll_votes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("poll_id", sa.Integer(), sa.ForeignKey("polls.id", ondelete="CASCADE"), nullable=False),
        sa.Column("option_id", sa.Integer(), sa.ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False),
        sa.Column("voter_id", sa.String(), nullable=False),
        sa.Column("voted_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_poll_votes_poll_id", "poll_votes", ["poll_id"])
    op.create_index("ix_poll_votes_option_id", "poll_votes", ["option_id"])

    # ── potluck ───────────────────────────────────────────────────────────────
    op.create_table(
        "potluck_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("quantity_needed", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_potluck_items_event_id", "potluck_items", ["event_id"])

    op.create_table(
        "potluck_claims",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("potluck_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("claimed_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_potluck_claims_item_id", "potluck_claims", ["item_id"])
    op.create_index("ix_potluck_claims_user_id", "potluck_claims", ["user_id"])

    # ── announcements ─────────────────────────────────────────────────────────
    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("sms_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_announcements_event_id", "announcements", ["event_id"])

    # ── tasks ─────────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.String(), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_event_id", "tasks", ["event_id"])

    # ── reminder_preferences ──────────────────────────────────────────────────
    op.create_table(
        "reminder_preferences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("offset_minutes", sa.Integer(), nullable=False),
        sa.Column("scheduler_rule_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reminder_preferences_event_id", "reminder_preferences", ["event_id"])
    op.create_index("ix_reminder_preferences_user_id", "reminder_preferences", ["user_id"])


def downgrade() -> None:
    op.drop_table("reminder_preferences")
    op.drop_table("tasks")
    op.drop_table("announcements")
    op.drop_table("potluck_claims")
    op.drop_table("potluck_items")
    op.drop_table("poll_votes")
    op.drop_table("poll_options")
    op.drop_table("polls")
    op.drop_table("rsvps")
    op.drop_table("pending_invites")
    op.drop_table("event_members")
    op.drop_index("ix_events_invite_token", table_name="events")
    op.drop_column("events", "viewable_by_link")
    op.drop_column("events", "invite_active")
    op.drop_column("events", "invite_token")
    op.drop_column("events", "parent_event_id")
    op.drop_column("events", "recurrence_end_dt")
    op.drop_column("events", "recurrence_rule")
    op.drop_column("events", "end_dt")
    op.drop_column("events", "start_dt")
    op.drop_column("events", "location")
