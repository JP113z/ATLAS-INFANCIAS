#consulta DB con filtros
#arma FeatureCollection con “data completa” para backup

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.sticker import Sticker

def export_stickers_as_feature_collection(
    db: Session,category: Optional[str] = None,school_id: Optional[int] = None,user_id: Optional[int] = None) -> Dict[str, Any]:

    query = db.query(Sticker)

    if category:
        query = query.filter(Sticker.category == category)
    if school_id is not None:
        query = query.filter(Sticker.school_id == school_id)
    if user_id is not None:
        query = query.filter(Sticker.user_id == user_id)

    stickers: List[Sticker] = query.all()

    features: List[Dict[str, Any]] = []
    for s in stickers:
        feat = s.geojson

        # asegurar que tenga properties “mínimas” consistentes sin destruir el respaldo original:
        if isinstance(feat, dict):
            props = feat.get("properties") if isinstance(feat.get("properties"), dict) else {}
            props.setdefault("category", s.category)
            props.setdefault("user_id", s.user_id)
            props.setdefault("school_id", s.school_id)
            props.setdefault("sticker_id", s.id)
            feat["properties"] = props

        features.append(feat)

    return {"type": "FeatureCollection", "features": features}