from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import models, database
from sqlalchemy.exc import NoResultFound
from . import schemas, utils
#from sqlmodel.ext.asyncio.session import AsyncSession

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.UserCreate, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = (
        db.query(models.User).filter(models.User.email == user.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400, detail="user already uses this email in diff account"
        )

    hashed_pw = utils.hash_password(user.password)

    role = db.query(models.Role).filter(models.Role.role == "user").first()
    if not role:
        role = models.Role(role="user")
        db.add(role)
        db.commit()
        db.refresh(role)

    new_user = models.User(
        full_name=user.full_name,
        phone_number=user.phone_number,
        email=user.email,
        password_hash=hashed_pw,
        role=role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.UserLoginModel)
async def log(login_data: schemas.UserLoginModel, session: As = Depends(database.get_db)):
    existing_user = (
        session.query(models.User).filter(models.User.email == login_data.email).first()
    )
    if existing_user is not None:
        raise HTTPException(status_code=400, detail="user is not in db")
    hashed_pw = utils.hash_password(login_data.password)


@router.post("/forgot password", response_model=schemas.UserResponse)
def recovery(user: schemas.UserResponse, db: Session = Depends(database.get_db)):
    pass


@router.post("/email verification", response_model=schemas.UserResponse)
def email_verification(user: schemas.UserResponse, db: Session = Depends(database.get_db)):
    pass
