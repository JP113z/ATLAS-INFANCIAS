from pydantic import BaseModel
from typing import Optional, Literal

class SchoolOut(BaseModel):
    id: int
    name: str
    city: Optional[str] = None

    class Config:
        from_attributes = True


