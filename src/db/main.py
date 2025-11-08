from fastapi import FastAPI
from .import models, database
from ..auth.auth import router as auth_router

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message":"API is working"}