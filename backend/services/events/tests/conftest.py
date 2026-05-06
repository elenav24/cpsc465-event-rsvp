"""
Shared test fixtures for the events service.

The key insight: app.dependency_overrides is a global dict, so only one
user can be "active" at a time. Tests that need multiple users must call
`set_user(sub)` before each request to switch the active user.

Fixtures:
  db          — rolled-back session per test
  set_user    — callable that switches the active user sub
  client      — TestClient (use set_user to switch users mid-test)
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.db.models import Base
from app.deps.db import get_db
from app.deps.auth import get_current_user_sub

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://test:test@localhost:5432/test_events")

engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(engine, expire_on_commit=False)

TEST_USER_SUB = "test-user-cognito-sub"
OTHER_USER_SUB = "other-user-cognito-sub"


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def patch_broadcast():
    """
    Suppress all real-time broadcast calls in every test.
    broadcast_event_update tries to reach DynamoDB/API Gateway which are
    not available in the test environment.
    """
    with patch("app.utils.broadcast.broadcast_event_update", return_value=None):
        yield


@pytest.fixture()
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """
    A single TestClient. Use `set_user` to control which user is active.
    Starts as TEST_USER_SUB by default.
    """
    _current_sub = [TEST_USER_SUB]  # mutable container so inner func can update it

    def get_db_override():
        yield db

    def get_sub_override():
        return _current_sub[0]

    app.dependency_overrides[get_db] = get_db_override
    app.dependency_overrides[get_current_user_sub] = get_sub_override

    c = TestClient(app, raise_server_exceptions=True)
    c._current_sub = _current_sub  # attach so set_user can reach it

    yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def set_user(client):
    """
    Returns a callable that switches the active user on `client`.

    Usage:
        def test_something(client, set_user):
            event = client.post("/events/events", data={"title": "E"}).json()
            set_user(OTHER_USER_SUB)
            res = client.post(f"/events/events/join/{event['invite_token']}")
            set_user(TEST_USER_SUB)  # switch back
    """
    def _set(sub: str):
        client._current_sub[0] = sub

    return _set


# Keep other_client as a convenience — it just switches the user
@pytest.fixture()
def other_client(client, set_user):
    """
    Not a separate client — just switches the active user to OTHER_USER_SUB.
    Returns the same client object. Tests using both client and other_client
    must be careful about ordering: the last set_user call wins.

    For tests that interleave requests from two users, use set_user directly.
    """
    set_user(OTHER_USER_SUB)
    yield client
    set_user(TEST_USER_SUB)
