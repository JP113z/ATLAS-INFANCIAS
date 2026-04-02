from pydantic import BaseModel, EmailStr, Field 
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
    blocked: bool

    class Config:
        from_attributes = True
    
class RegisterResponse(BaseModel):
    message: str

    
class UpdateUsernameRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)

class UpdatePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str = Field(min_lenght = 6, max_length = 128)

class EmailChangeConfirm(BaseModel):
    challenge_id : str
    code: str = Field(min_lenght = 4, max_length = 10)

