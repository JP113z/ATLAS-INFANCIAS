#valida estructura, tipos, campos requeridos, coherencia
ALLOWED = {"transito", "recreacion", "riesgo", "afecto"}

from typing import Any, Dict, List, Tuple, Optional
from app.schemas.geojson import GeoJSONValidationResult, ValidationIssue

def _is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)

def _validate_point_coordinates(coords: Any, feature_index: int) -> List[ValidationIssue]:
        issues: List[ValidationIssue] = []
        path = f"features[{feature_index}].geometry.coordinates"
        if not isinstance(coords, (list,tuple)) or len(coords) != 2:
              issues.append(ValidationIssue(feature_index = feature_index, path = path, message = "coordiantes debe ser una lista [lng, lat] de longitud 2"))
              return issues
        lng, lat = coords[0], coords[1]
        if not _is_number(lng) or not _is_number(lat):
                issues.append(ValidationIssue(feature_index = feature_index, path = path, message = "las coordenadas deben ser numeros"))
                return issues
        if not (-180 <= lng <= 180):
               issues.append(ValidationIssue(feature_index = feature_index, path = path, message = "Longitud fuera del rango")
                             )
        if not (-90 <= lat <= 90):
               issues.append(ValidationIssue(feature_index = feature_index, path = path, message = "Latitud fuera del rango"))

        return issues

def validate_geojson(data: Dict[str, Any], require_properties: bool = False) -> GeoJSONValidationResult:
    ALLOWED_CATEGORIES = {"transito", "recreacion", "riesgo", "afecto"}
    ALLOWED_GENDERS = {"masculino", "femenino", "prefiero_no_decir"}  # si decides permitirlo en GeoJSON

       #Para cumplir el requerimiento 8 de validar estrucuta
    issues: List[ValidationIssue] = []

    if not isinstance(data, dict):
          return GeoJSONValidationResult(is_valid = False , issues = [ValidationIssue(path = "$", message = "El contenido debe ser un geojson.")])       
    gtype = data.get("type")
    if gtype not in ("FeatureCollection", "Feature"):
          issues.append(ValidationIssue(path = "type", message = "Type debe ser FeatureCollecion o Feature"))

    features: List[Dict[str, Any]] = []
    if gtype == "FeatureCollection":
        feats = data.get("features")
        if not isinstance(feats,list):
            issues.append(ValidationIssue( path = "features", message = "features debe ser una lista"))
        else:
              features = feats
    elif gtype == "Feature":
          features = [data]

    #valicacion por feature
    for i, feat in enumerate(features):
        if not isinstance(feat, dict):
            issues.append(ValidationIssue(feature_index = i, path= f"features[{i}]", message = "Cada feature debe ser un objeto JSON"))
            continue
        if feat.get("type") != "Feature":
            issues.append(ValidationIssue(feature_index=i, path=f"features[{i}].type",message="Cada elemento debe tener type='Feature'"))
            continue

        geom = feat.get("geometry")
        if not isinstance(geom, dict):
            issues.append(ValidationIssue(feature_index=i, path=f"features[{i}].geometry",message="geometry debe ser un objeto"))
            continue

        geom_type = geom.get("type")

        if geom_type == "Point":
             coords = geom.get("coordinates")
             issues.extend(_validate_point_coordinates(coords,i))

    #    coords = geom.get("coordinates")
    #   issues.extend(_validate_point_coordinates(coords, i))

        if require_properties:
            props = feat.get("properties")
            if not isinstance(props, dict):
                issues.append(ValidationIssue(feature_index=i, path=f"features[{i}].properties",
                                              message="properties debe existir y ser un objeto"))

    return GeoJSONValidationResult(is_valid=(len(issues) == 0), issues=issues)

