from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from .database import Base
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import relationship
import enum


class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    role = relationship("Role", back_populates="users")
    comments = relationship("Comment", back_populates="user")
    payments = relationship("Payment", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(ENUM("admin", "user", name="role_enum"), unique=True, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    users = relationship("User", back_populates="role")


class CodeReset(Base):
    __tablename__ = "code_resets"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="comments")


class Tour(Base):
    __tablename__ = "tours"

    id = Column(Integer, primary_key=True, index=True)
    from_destination = Column(String, nullable=False)
    to_destination = Column(String, nullable=False)
    price = Column(Numeric(10, 2))
    is_active = Column(Boolean, default=False)
    number_of_destinations = Column(Integer, nullable=False)
    tour_highlights = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2))
    payment_date = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="payments")
