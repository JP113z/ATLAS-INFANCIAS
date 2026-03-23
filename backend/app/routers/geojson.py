import json
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO

from app.database import get_db
from app.services.geojson_validator import validate_geojson
from app.services.geojson_parser import parse_geojson_features
from app.services.geojson_importer import import_geojson_records
from app.services.geojson_exporter import export_stickers_as_feature_collection

router = APIRouter(prefix="/geojson", tags=["geojson"])

def _read_upload_as_json(file: UploadFile) -> Dict[str, Any]:
    content = file.file.read()
    return json.loads(content.decode("utf-8"))

@router.post("/validate")
def validate_geojson_file(file: UploadFile = File(...)):

    try:
        data = _read_upload_as_json(file)
    except Exception as e:
        return JSONResponse(status_code=400, content={
            "is_valid": False,
            "issues": [{"path": "$", "message": f"Archivo corrupto o no es JSON válido: {str(e)}"}]
        })

    result = validate_geojson(data, require_properties=False)
    return result

@router.post("/import")
def import_geojson_file(file: UploadFile = File(...), db: Session = Depends(get_db)):

    try:
        data = _read_upload_as_json(file)
    except Exception as e:
        return JSONResponse(status_code=400, content={
            "inserted": 0,
            "skipped": 0,
            "skipped_details": [{"path": "$", "message": f"Archivo corrupto o no es JSON válido: {str(e)}"}],
            "message": "Importación detenida: archivo inválido."
        })

    validation = validate_geojson(data, require_properties=False)
    if not validation.is_valid:
        # RF_08: con errores, no altera DB
        return JSONResponse(status_code=422, content=validation.model_dump())

    records, skipped = parse_geojson_features(data)
    summary = import_geojson_records(db, records, skipped)
    return summary

@router.get("/export")
def export_geojson(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(default=None),
    school_id: Optional[int] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    download: bool = Query(default=True)
):

    fc = export_stickers_as_feature_collection(db, category=category, school_id=school_id, user_id=user_id)

    if not download:
        return fc

    # Devuelve como archivo .geojson
    content = json.dumps(fc, ensure_ascii=False).encode("utf-8")
    buf = BytesIO(content)

    headers = {"Content-Disposition": 'attachment; filename="atlas_infancias_export.geojson"'}
    return StreamingResponse(buf, media_type="application/geo+json", headers=headers)