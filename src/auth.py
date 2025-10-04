from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, utils, database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register (user:schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise  HTTPException(status_code=400, detail="email not found in db")

    hashed_pw = utils.hash_password(user.password)

    new_user = models.User (
    full_name=user.full_name,
    phone_number=user.phone_number,
    email=user.email,
    password_hash=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user