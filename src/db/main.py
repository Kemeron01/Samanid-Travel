from fastapi import FastAPI
from .import models, database
from ..auth.routes import router as auth_router
from src.config import Config 
from sqlmodel import SQLModel

from typing import AsyncGenerator
from sqlalchemy.exc.asyncio import AsyncSession, create_async_engine, async_sessionmaker 



models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message":"API is working"}