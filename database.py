from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

Base = declarative_base()

# Session Factory (Handles DB Operations)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from sqlalchemy import Column, Integer, String

class Item(Base):
    __tablename__ = "items"  # Table name in the database

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Integer)
    description = Column(String, nullable=True)

# Create tables in the database
Base.metadata.create_all(bind=engine)