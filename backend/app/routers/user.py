from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import user

router = APIRouter(prefix="/user", tags=["user"])


@router.get("", response_model=list[user.UserOut])
@router.get("/", response_model=list[user.UserOut])
def list_users(db: Session = Depends(get_db)):

    return db.query(models.User).order_by(models.User.id.asc()).all()