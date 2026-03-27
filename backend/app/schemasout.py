from pydantic import BaseModel
from typing import Optional


class SchoolOut(BaseModel):
    id: int
    name: str
    city: Optional[str] = None

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    username: str
    gender: Optional[str] = None

    class Config:
        from_attributes = True