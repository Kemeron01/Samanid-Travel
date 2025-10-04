from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
#import os
#from dotenv import load_dotenv
DATABASE_URL = "postgresql://mymacbook:admin@localhost:5432/samanid"

engine = create_engine("postgresql://mymacbook:admin@localhost:5432/samanid")
SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()