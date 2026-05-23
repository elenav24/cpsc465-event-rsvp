from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL, DEBUG

engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,
    connect_args={"options": "-csearch_path=public"},
)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
