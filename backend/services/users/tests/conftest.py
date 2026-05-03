import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.db.models import Base
from app.deps.db import get_db
from app.deps.auth import get_current_user

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://test:test@localhost:5432/test_users")

engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(engine, expire_on_commit=False)


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
    from app.db.models.user import User

    # Lazy-create a test user the same way the real auth dep does
    def override_get_current_user():
        user = db.query(User).filter(User.cognito_sub == "test-sub").first()
        if not user:
            user = User(cognito_sub="test-sub", email="test@example.com")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
