from pydantic import BaseModel, EmailStr, constr

class UserCreate(BaseModel):
    full_name: str
    phone_number: str | None=None
    email: EmailStr
    password: constr(min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_verified: bool

    class Config:
        orm_mode = True