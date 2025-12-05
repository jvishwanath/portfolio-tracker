import os
from sqlmodel import SQLModel, create_engine

# Check for DATABASE_URL environment variable (used for Cloud SQL)
database_url = os.getenv("DATABASE_URL")

if database_url:
    # PostgreSQL (Cloud SQL)
    # Ensure the URL starts with postgresql:// (SQLAlchemy 1.4+ requires this)
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(database_url)
else:
    # Local SQLite fallback
    sqlite_file_name = "portfolio.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

from sqlmodel import Session

def get_session():
    with Session(engine) as session:
        yield session
