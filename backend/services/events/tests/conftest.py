"""
Shared test fixtures for the events service.

- `db` — a fresh SQLAlchemy session per test, rolled back after each test
- `client` — a FastAPI TestClient with the DB session overridden
- `auth_user` — injects a fake cognito_sub so routes don't need a real JWT
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.models import Base
from app.deps.db import get_db
from app.deps.auth import get_current_user_sub

import os

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
    def override_get_db():
        yield db

    def override_get_user_sub():
        return TEST_USER_SUB

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_sub] = override_get_user_sub
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def other_client(db):
    """A second client authenticated as a different user — for permission tests."""
    def override_get_db():
        yield db

    def override_get_user_sub():
        return OTHER_USER_SUB

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_sub] = override_get_user_sub
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
