
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

Gender = Literal["masculino", "femenino", "perfiero_no_decir"]

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    gender: Optional[Gender] = "prefiero_no_decir"
    

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    username: str
    gender: Optional[str] = None

class Config:
    from_attributes = True