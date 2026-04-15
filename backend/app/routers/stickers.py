
from typing import Optional, Literal, List
from datetime import datetime, timedelta, date
import copy

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import Sticker, User, School


router = APIRouter(prefix="/stickers", tags=["stickers"])

Category = Literal["transito", "recreacion", "riesgo", "afecto"]
Gender = Literal["masculino", "femenino", "prefiero_no_decir"]
DatePreset = Literal["hoy", "ultimos_7", "ultimos_30"]


def _parse_date_yyyy_mm_dd(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


# ── RF_03 (filtrar por escuela) — lista de escuelas disponibles ───────────────
@router.get("/schools")
def list_schools(db: Session = Depends(get_db)):
    schools = db.query(School).order_by(School.name).all()
    return [{"id": s.id, "name": s.name, "city": s.city} for s in schools]


# ── RF_02 (filtrar por usuario) — lista de usuarios disponibles ───────────────
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


# ── RF_01-RF_06 — obtener stickers con filtros combinados ─────────────────────
@router.get("")
def get_stickers(
    db: Session = Depends(get_db),
    category: Optional[Category] = Query(default=None),
    school_id: Optional[int] = Query(default=None, ge=1),
    user_id: Optional[int] = Query(default=None, ge=1),
    gender: Optional[str] = Query(default=None),
    date_preset: Optional[DatePreset] = Query(default=None),
    date_from: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
):
    query = db.query(Sticker, User.gender).outerjoin(User, User.id == Sticker.user_id)

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
            dfrom, dto = today, today
        elif date_preset == "ultimos_7":
            dfrom, dto = today - timedelta(days=6), today
        else:  # ultimos_30
            dfrom, dto = today - timedelta(days=29), today

        start_dt = datetime(dfrom.year, dfrom.month, dfrom.day, 0, 0, 0)
        end_dt = datetime(dto.year, dto.month, dto.day, 23, 59, 59)
        query = query.filter(and_(Sticker.created_at >= start_dt, Sticker.created_at <= end_dt))

    elif date_from or date_to:
        if date_from:
            d = _parse_date_yyyy_mm_dd(date_from)
            query = query.filter(Sticker.created_at >= datetime(d.year, d.month, d.day))
        if date_to:
            d = _parse_date_yyyy_mm_dd(date_to)
            query = query.filter(Sticker.created_at <= datetime(d.year, d.month, d.day, 23, 59, 59))

    rows = query.all()

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
