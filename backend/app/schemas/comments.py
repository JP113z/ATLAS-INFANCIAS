from pydantic import BaseModel, Field, constr
from datetime import datetime

class CommentCreate(BaseModel):
    content: constr(strip_whitespace=True, min_length=1, max_length=400)

    
class CommentOut(BaseModel):
    id: int
    sticker_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime