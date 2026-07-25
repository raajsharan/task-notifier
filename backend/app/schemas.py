from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from app.models import TaskStatus


# ---------- Tasks ----------

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: date
    status: TaskStatus = TaskStatus.pending


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
