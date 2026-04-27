from typing import Any, Dict, List, Tuple, Optional
from app.schemas.geojson import ValidationIssue

def _get_features(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    if data.get("type") == "FeatureCollection":
        return data.get("features", [])
    if data.get("type") == "Feature":
        return [data]
    return []

def _extract_point_from_geometry(geom: dict) -> Optional[tuple[float,float]]:
    gtype = geom.get("type")
    coords = geom.get("coordinates")

    if gtype == "Point":
        return coords[0], coords[1]
    
    if gtype == "Polygon" and isinstance(coords, list) and coords and coords[0]:
        ring = coords[0]
        avg_lng = sum(p[0] for p in ring) / len(ring)
        avg_lat = sum(p[1] for p in ring) / len(ring)
        return avg_lng, avg_lat

def parse_geojson_features(data:Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[ValidationIssue]]:
    records: List[Dict[str, Any]] = []
    skipped: List[ValidationIssue] = []

    features = _get_features(data)

    for i, feat in enumerate(features):
        geom = feat.get("geometry") or {}
        geom_type = geom.get("type")

        coords = geom.get("coordinates")

        if geom_type == "LineString":
            skipped.append(ValidationIssue(feature_index=i,path=f"features[{i}].geometry.type",message="Se omite: LineString no se importa"))
            continue
        point = _extract_point_from_geometry(geom)

        if not point:
           skipped.append(ValidationIssue(feature_index=i,path=f"features[{i}].geometry",message="No se pudo derivar un Point desde la geometría"))
           continue

        if geom_type == "Polygon" and isinstance(coords, list) and coords:
            ring = coords[0]
            if len(ring) > 3:  #para que no se importen los que son de area
                skipped.append(ValidationIssue(feature_index=i,path=f"features[{i}].geometry",message="Se omite: Polygon demasiado grande (capa de referencia)"))
                continue

        lng, lat = point

        props = feat.get("properties") or {}
        category = props.get("category") or props.get("categoria")
        
        if not category:
            category = "recreacion"

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



    