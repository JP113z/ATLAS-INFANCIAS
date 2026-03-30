from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

Gender = Literal["masculino", "femenino", "prefiero_no_decir"]

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
    email: str
    gender: Optional[str] = None
    role: str
    verified: bool

    class Config:
        from_attributes = True
    
class RegisterResponse(BaseModel):
    message: str