from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemasout

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("", response_model=list[schemasout.SchoolOut])
@router.get("/", response_model=list[schemasout.SchoolOut])
def list_schools(db: Session = Depends(get_db)):

    return db.query(models.School).order_by(models.School.id.asc()).all()