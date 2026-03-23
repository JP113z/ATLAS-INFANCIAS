from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sticker import Sticker

router = APIRouter(prefix="/stickers", tags=["stickers"])

@router.get("")
def get_stickers(db: Session = Depends(get_db)):
    stickers = db.query(Sticker).all()

    features = []
    for s in stickers:

        if s.geojson.get("type") == "Feature":
            feature = s.geojson
        else:
            feature = {
                "type": "Feature",
                "geometry": s.geojson.get("geometry", s.geojson),
                "properties": {
                    "id": s.id,
                    "category": s.category,
                    "school_id": s.school_id,
                    "user_id": s.user_id,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                },
            }

        # Aseguramos que properties incluya metadata útil
        feature.setdefault("properties", {})
        feature["properties"].update({
            "id": s.id,
            "category": s.category,
            "school_id": s.school_id,
        })

        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }