from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str
    phone_number: str | None = None
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_verified: bool

    class Config:
        from_attributes = True
class UserLog(BaseModel):
    email : EmailStr
    password : str 
    