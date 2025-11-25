from pydantic import BaseModel, EmailStr, Field
import uuid, datetime
from typing import List


class UserCreate(BaseModel):
    full_name: str
    phone_number: str | None = None
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserResponse(BaseModel):
    uid: uuid
    full_name: str
    email: EmailStr
    is_verified: bool

    class Config:
        from_attributes = True


class EmailModel(BaseModel):
    addresses: List[str]


class UserModel(BaseModel):
    uid: uuid
    full_name: str
    email: EmailStr
    is_verified: bool
    password_hash: str = Field(exclude=True)
    created_at: datetime
    updated_at: datetime


class UserLoginModel(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class EmailverificationModel(BaseModel):
    verification_code: int


class PasswordResetRequestModel(BaseModel):
    email: EmailStr


class PasswordResetConfirmModel(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str
