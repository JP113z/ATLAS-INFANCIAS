#guarda en DB
#maneja transacciones/rollback
#omitir inválidos con mensaje

from typing import Any, Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sticker
from app.models import User
from app.models import School


from app.schemas.geojson import ImportSummary, ValidationIssue


def import_geojson_records (db: Session, records: List[Dict[str, Any]], skipped: List[ValidationIssue]) -> ImportSummary:
    inserted = 0
    try:
        with db.begin():
            for r in records:
                lng = r["lng"]
                lat = r["lat"]

                sticker = Sticker(                   
                    category=r["category"],
                    user_id=r["user_id"],
                    school_id=r["school_id"],
                    geojson=r["geojson"],
                    # Construcción de Point(lng,lat) con SRID 4326
                    location=func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
                )
                db.add(sticker)
                inserted +=1
        
        return ImportSummary(inserted=inserted,skipped=len(skipped),skipped_details=skipped,
            message="Importación completada. Se insertaron registros válidos y se omitieron los inválidos.")
    except Exception as e:
        #la transacción ya se revierte automáticamente por db.begin()
        # pero igual devolvemos un mensaje claro
    
       return ImportSummary(
            inserted=0,
            skipped=len(records) + len(skipped),skipped_details=skipped + [
                ValidationIssue(path="$", message=f"Error en almacenamiento, operación revertida: {str(e)}")],
            message="Importación fallida. No se realizaron cambios en la base de datos (rollback)."
        )
