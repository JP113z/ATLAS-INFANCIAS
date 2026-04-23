
from typing import Optional, Literal, List
from datetime import datetime, timedelta, date
import copy

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import Sticker, User, School

from app.models.comments import StickerComment

from app.security import get_current_user 

from app.schemas.comments import CommentCreate, CommentOut


router = APIRouter(prefix="/stickers", tags=["stickers"])

Category = Literal["transito", "recreacion", "riesgo", "afecto"]
Gender = Literal["masculino", "femenino", "prefiero_no_decir"]
DatePreset = Literal["hoy", "ultimos_7", "ultimos_30"]

MAX_COMMENT_LEN = 400

def _parse_date_yyyy_mm_dd(value: str) -> date:
    # YYYY-MM-DD
    return datetime.strptime(value, "%Y-%m-%d").date()



@router.get("/schools")
def list_schools(db: Session = Depends(get_db)):
    schools = db.query(School).order_by(School.name).all()
    return [{"id": s.id, "name": s.name, "city": s.city} for s in schools]

@router.get("/user")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.username).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "gender": u.gender,
            "role": u.role,
            "verified": u.verified,
            "blocked": u.blocked,  
        }
        for u in users
    ]

@router.get("")
def get_stickers(db: Session = Depends(get_db), category:Optional[Category] = Query(default = None), 
                 school_id: Optional[int] = Query(default = None, ge=1), user_id: Optional[int] = Query(default = None, ge=1),
                 gender: Optional[str] = Query(default = None),
                 
                 date_preset: Optional[DatePreset] = Query(default = None),date_from: Optional[str] = Query(default = None, description = "YYYY-MM-DD"),
                 date_to: Optional[str] = Query(default = None, description = "YYYY-MM-DD"),
                 ):
    
    
    query = (db.query (Sticker, User.gender).outerjoin(User,User.id == Sticker.user_id))

    if gender is not None:

        query = query.filter(User.gender == gender)
    if category is not None:
        query = query.filter(Sticker.category == category)
    if school_id is not None:
        query = query.filter(Sticker.school_id == school_id)

    if user_id is not None:
        query = query.filter(Sticker.user_id == user_id)

    if date_preset:
        today = date.today()

        if date_preset == "hoy":
            dfrom = today
            dto = today
        elif date_preset == "ultimos_7":
            dfrom = today - timedelta(days=6)
            dto = today
        else:  # ultimos_30
            dfrom = today - timedelta(days=29)
            dto = today

        start_dt = datetime(dfrom.year, dfrom.month, dfrom.day, 0, 0, 0)
        end_dt = datetime(dto.year, dto.month, dto.day, 23, 59, 59)

        query = query.filter(and_(Sticker.created_at >= start_dt, Sticker.created_at <= end_dt))

    rows = query.all()

    # Construir FeatureCollection
    features = []
    for sticker, user_gender in rows:
        feature = copy.deepcopy(sticker.geojson)

        feature.setdefault("properties", {})
        feature["properties"].update({
            "id": sticker.id,
            "category": sticker.category,
            "school_id": sticker.school_id,
            "user_id": sticker.user_id,
            "gender": user_gender,  
            "created_at": sticker.created_at.isoformat() if sticker.created_at else None,
        })

        features.append(feature)

    return {"type": "FeatureCollection", "features": features}

@router.get("/{sticker_id}/comments", response_model=List[CommentOut])
def list_comments(sticker_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(StickerComment, User.username)
        .join(User, User.id == StickerComment.user_id)
        .filter(StickerComment.sticker_id == sticker_id)
        .order_by(StickerComment.created_at.asc())
        .all()
    )

    return [
        CommentOut(
            id=c.id,
            sticker_id=c.sticker_id,
            user_id=c.user_id,
            username=username,
            content=c.content,
            created_at=c.created_at,
        )
        for c, username in rows
    ]


@router.post("/{sticker_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    sticker_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Contenido vacío")
    if len(content) > MAX_COMMENT_LEN:
        raise HTTPException(status_code=400, detail=f"Máximo {MAX_COMMENT_LEN} caracteres")
    comment = StickerComment(
        sticker_id=sticker_id,
        user_id=user.id,
        content=content,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        sticker_id=comment.sticker_id,
        user_id=comment.user_id,
        username=user.username,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.delete("/{sticker_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    sticker_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    comment = (
        db.query(StickerComment)
        .filter(StickerComment.id == comment_id, StickerComment.sticker_id == sticker_id)
        .first()
    )

    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    # Regla: solo admin
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede eliminar comentarios")

    db.delete(comment)
    db.commit()
    return
