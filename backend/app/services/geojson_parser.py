#recorre features, extrae geometry/coords + properties
#produce una lista de “registros listos para guardar”


from typing import Any, Dict, List, Tuple, Optional
from app.schemas.geojson import ValidationIssue

def _get_features(data: Dict[str, Any]) -> List[Dict[str,Any]]:
    if data.get("type") == "FeatureCollection":
        return data.get("features", [])    
    if data.get("type") == "FeatureCollection":
        return[data]
    return []

def parse_geojson_features(data:Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[ValidationIssue]]:
    records: List[Dict[str, Any]] = []
    skipped: List[ValidationIssue] = []

    features = _get_features(data)

    for i, feat in enumerate(features):
        geom = feat.get("geometry") or {}

        coords = geom.get("coordinates") or [None, None]
        lng, lat = coords[0], coords[1]

        props = feat.get("properties") or {}
        category = props.get("category") or props.get("categoria")
        user_id = props.get("user_id")
        school_id = props.get("school_id")

        if not category or not isinstance(category, str):
            skipped.append(ValidationIssue(feature_index=i, path=f"features[{i}].properties.category",message="Se omite: falta 'category' (string) en properties"))
            continue


        if user_id is not None and not isinstance(user_id, int):
            skipped.append(ValidationIssue(feature_index=i, path=f"features[{i}].properties.user_id",message="Se omite: user_id debe ser int o null"))
            continue


        if school_id is not None and not isinstance(school_id, int):
            skipped.append(ValidationIssue(feature_index=i, path=f"features[{i}].properties.school_id",
                                          message="Se omite: school_id debe ser int o null"))
            continue


        record = {
            "category": category,
            "user_id": user_id,
            "school_id": school_id,
            "lng": lng,
            "lat": lat,
            "geojson": feat,  # Feature completo
        }
        records.append(record)



    return records, skipped



    