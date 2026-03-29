from pydantic import BaseModel, Field
from datetime import datetime

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

class CommentOut(BaseModel):
    id: int
    sticker_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime