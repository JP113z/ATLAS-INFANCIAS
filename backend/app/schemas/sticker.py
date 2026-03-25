from typing import Literal
from pydantic import BaseModel

Category = Literal["transito", "recreacion", "riesgo", "afecto"]

class StickerCreate(BaseModel):
    category: Category
    user_id: int | None = None
    school_id: int | None = None
    geojson: dict
