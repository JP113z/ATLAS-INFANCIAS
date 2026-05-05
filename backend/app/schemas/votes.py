
from pydantic import BaseModel

class CreateVoteSessionRequest(BaseModel):
    sticker_id: int
    question: str

class SubmitVoteRequest(BaseModel):
    answer: bool