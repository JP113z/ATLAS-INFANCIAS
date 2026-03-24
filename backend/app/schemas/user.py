
from pydantic import BaseModel
from typing import Optional, Literal

Gender = Literal["masculino", "femenino", "perfiero_no_decir"]

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    gender: Optional[Gender] = "prefiero_no_decir"
    