"""
test_geojson_validator.py — Pruebas unitarias para app/services/geojson_validator.py

Cubre:
  - Validación de un Feature válido
  - Validación de una FeatureCollection válida
  - Tipo incorrecto
  - Tipo de geometría no soportado
  - Coordenadas fuera de rango
  - Coordenadas con valor no numérico
  - Geometría faltante
"""

import pytest
from app.services.geojson_validator import validate_geojson


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_feature(lng: float = -84.0, lat: float = 9.9, geom_type: str = "Point") -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": geom_type, "coordinates": [lng, lat]},
        "properties": {"category": "transito"},
    }


def _make_collection(*features) -> dict:
    return {"type": "FeatureCollection", "features": list(features)}


# ─── Casos válidos ────────────────────────────────────────────────────────────

def test_feature_valido_pasa():
    """Un Feature con Point y coordenadas válidas debe ser aceptado."""
    result = validate_geojson(_make_feature())
    assert result.is_valid is True
    assert result.issues == []


def test_feature_collection_valida_pasa():
    """Una FeatureCollection con Features válidos debe ser aceptada."""
    data = _make_collection(_make_feature(-84.1, 9.8), _make_feature(-85.0, 10.5))
    result = validate_geojson(data)
    assert result.is_valid is True


def test_feature_collection_vacia_pasa():
    """Una FeatureCollection sin features es válida (lista vacía)."""
    result = validate_geojson({"type": "FeatureCollection", "features": []})
    assert result.is_valid is True


# ─── Tipo raíz inválido ───────────────────────────────────────────────────────

def test_tipo_invalido_falla():
    """Un 'type' que no sea Feature ni FeatureCollection debe generar un error."""
    result = validate_geojson({"type": "LineString", "features": []})
    assert result.is_valid is False
    assert any("type" in issue.path for issue in result.issues)


def test_no_dict_falla():
    """Si el contenido no es un dict, debe retornar is_valid=False."""
    result = validate_geojson("esto no es un geojson")  # type: ignore
    assert result.is_valid is False


# ─── Geometría inválida ───────────────────────────────────────────────────────

def test_geometry_polygon_soportado():
    """Polygon está soportada y deben aceptarla."""
    result = validate_geojson(_make_feature(geom_type="Polygon"))
    assert result.is_valid is True


def test_geometry_faltante():
    """Un Feature sin campo 'geometry' debe generar un error."""
    feature = {"type": "Feature", "geometry": None, "properties": {}}
    result = validate_geojson(feature)
    assert result.is_valid is False


# ─── Coordenadas inválidas ────────────────────────────────────────────────────

def test_longitud_fuera_de_rango():
    """Longitud > 180 debe generar un error de coordenadas."""
    result = validate_geojson(_make_feature(lng=200.0, lat=9.9))
    assert result.is_valid is False


def test_latitud_fuera_de_rango():
    """Latitud > 90 debe generar un error de coordenadas."""
    result = validate_geojson(_make_feature(lng=-84.0, lat=95.0))
    assert result.is_valid is False


def test_coordenadas_no_numericas():
    """Coordenadas con strings deben generar un error."""
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": ["lng", "lat"]},
        "properties": {},
    }
    result = validate_geojson(feature)
    assert result.is_valid is False
