from datetime import timedelta, datetime


from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound

from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.redis import add_jti_to_blocklist

from .dependencies import (
    AccessTokenBearer,
    RefreshTokenBearer,
    RoleChecker,
    get_current_user,
)
from .service import UserService
from .schemas import (
    UserCreate,
    UserLoginModel,
    EmailModel,
    PasswordResetRequestModel,
    PasswordResetConfirmModel,
)
from .utils import (
    verify_password,
    create_access_token,
    decode_token,
    create_url_safe_token,
    decode_url_safe_token,
    generate_hash_password,
)

from src.config import Config
from src.celery_tasks import send_email
from src.errors import UserAlreadyExists, UserNotFound, InvalidCredentials, InvalidToken

from src.db.main import get_session
from ..db import models, database
from . import schemas, utils


router = APIRouter(prefix="/api/auth", tags=["Authentication"])
user_service = UserService
# RoleChecker = RoleChecker()

REFRESH_TOKEN_EXPIRY = 2


@router.post("/send_email", response_model=schemas.EmailModelm)
async def send_email(emails: schemas.EmailModel):
    emails = emails.addresses

    html = "<h1>Welcome to the app<h1>"
    subject = "Welcome to the app"

    send_email(emails, html, subject)

    return {"message": "email sent sucessfully"}


@router.post(
    "/signup", response_model=schemas.UserCreate, status_code=status.HTTP_201_CREATED
)
async def create_user_account(
    user: schemas.UserCreate, db: Session = Depends(database.get_db)
):
    email = user.email

    existing_user = (
        db.query(models.User).filter(models.User.email == user.email).first()
    )
    if existing_user:
        raise UserAlreadyExists()

    new_user = await user_service.create_user(user, Session)

    token = create_url_safe_token({"email: email"})

    link = f"http://{Config.DOMAIN}/api/v1/auth/verify/{token}"

    html = f"""<h1>Verify Your email<h1>
    <p> Please click this <a = href"{link}>link</a> to verify your email</p>
    """
    emails = [email]
    subject = "Verify your email"

    send_email.delay(emails, subject, html)

    return {
        "message": "Account created check your email to verify it",
        "user": new_user,
    }


# checking role of the user

# role = db.query(models.Role).filter(models.Role.role == "user").first()
# if not role:
#     role = models.Role(role="user")
#     db.add(role)
#     db.commit()
#     db.refresh(role)


@router.post("/verify/{token}")
async def verify_user_account(
    token: str, Session: AsyncSession = Depends(database.get_db)
):
    token_data = decode_url_safe_token(token)

    user_email = token_data.get("email")
    if user_email:
        user = await user_service.get_user_by_email(user_email, Session)

        if not user:
            raise UserNotFound()
        await user_service.update_user(user, {"is_verified": True}, Session)

        return JSONResponse(
            content={"message": "Account verified sucessfully"},
            status_code=status.HTTP_200_OK,
        )

    return JSONResponse(
        content={"message": "Error occured during verification"},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@router.post("/login", response_model=schemas.UserLoginModel)
async def log(
    login_data: schemas.UserLoginModel, session: AsyncSession = Depends(database.get_db)
):
    email = login_data.email
    password = login_data.password

    user = await user_service.get_user_by_email(email, Session)
    if user is not None:
        password_valid = verify_password(password, user.password_hash)

        if password_valid:
            access_token = create_access_token(
                user_data={
                    "user": user.email,
                    "user_uid": str(user.uid),
                    # "role": user.role
                }
            )
            refresh_token = create_access_token(
                user_data={"email": user.email, "user_uid": str(user.uid)},
                refresh=True,
                expiry=timedelta(days=REFRESH_TOKEN_EXPIRY),
            )
            return JSONResponse(
                content={
                    "message": "Login was sucessful",
                    "acess_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {"email": user.email, "uid": str(user.uid)},
                }
            )

    raise InvalidCredentials()


@router.get("/refresh_token")
async def get_new_access_token(token_details: dict = Depends(RefreshTokenBearer())):
    expiry_timestamp = token_details["exp"]

    if datetime.fromtimestamp(expiry_timestamp) > datetime.now():
        new_access_token = create_access_token(user_data=token_details["user"])

        return JSONResponse(content={"access_token": new_access_token})

    return InvalidToken


@router.get("/logout")
async def revoke_token(token_details: dict = Depends(AccessTokenBearer())):
    jti = token_details["jti"]

    await add_jti_to_blocklist(jti)

    return JSONResponse(
        content={"message": "Loged out sucessfully"}, status_code=status.HTTP_200_OK
    )


@router.post("/password-reset-request", response_model=schemas.UserResponse)
def password_reset_request(
    email_data: PasswordResetConfirmModel, db: Session = Depends(database.get_db)
):
    email = email_data.email

    token = create_url_safe_token({"email": email})

    link = f"http://{Config.DOMAIN}/api/v1/auth/password-reset-confirm/{token}"

    html_message = """
    <h1>Reset your Password<h1>
    <p>Please click thi <a href = "{link}">link</a> to reset your password<p>
    """

    subject = "reset your password"

    send_email.delay([email], subject, html_message)
    return JSONResponse(
        content={
            "message": "please check your email for further instructions to reset your password"
        },
        status_code=status.HTTP_200_OK,
    )


@router.post("/password-reset-confirm/{token}")
async def reset_account_password(
    token: str,
    passwords: PasswordResetConfirmModel,
    Session: AsyncSession = Depends(database.get_db),
):
    new_password = passwords.new_password
    confirm_password = passwords.new_password

    if new_password != confirm_password:
        raise HTTPException(
            detail="Passwords do not match", status_code=status.HTTP_400_BAD_REQUEST
        )
    token_data = decode_url_safe_token(token)

    user_email = token_data.get("email")

    if user_email:
        user = await user_service.get_user_by_email(user_email, Session)

        if not user:
            raise UserNotFound()

        password_hash = generate_hash_password(new_password)

        await user_service.update_user(user, {"password_hash": password_hash}, Session)

        return JSONResponse(
            content={"message": "Password reset sucessfully"},
            status_code=status.HTTP_200_OK,
        )

    return JSONResponse(
        content={"message": "Error ocured during password reset"},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
