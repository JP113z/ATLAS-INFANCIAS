"""
test_geojson_parser.py — Pruebas unitarias para app/services/geojson_parser.py

Cubre:
  - Parsear una FeatureCollection con features válidos
  - Omitir features sin campo 'category'
  - Omitir features con user_id no entero
  - Omitir features con school_id no entero
  - Extraer correctamente user_id y school_id
  - Aceptar el alias 'categoria' para la categoría
"""

import pytest
from app.services.geojson_parser import parse_geojson_features


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_feature(category="transito", user_id=None, school_id=None,
                  lng=-84.0, lat=9.9) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lng, lat]},
        "properties": {
            "category": category,
            **({"user_id": user_id} if user_id is not None else {}),
            **({"school_id": school_id} if school_id is not None else {}),
        },
    }


def _make_collection(*features) -> dict:
    return {"type": "FeatureCollection", "features": list(features)}


# ─── Casos exitosos ───────────────────────────────────────────────────────────

def test_parsear_feature_collection_valida():
    """Una FeatureCollection con dos features válidos debe producir 2 registros."""
    data = _make_collection(_make_feature("transito"), _make_feature("riesgo"))
    records, skipped = parse_geojson_features(data)
    assert len(records) == 2
    assert skipped == []


def test_registro_contiene_campos_esperados():
    """Cada registro debe tener category, lng, lat y geojson."""
    data = _make_collection(_make_feature("afecto", lng=-85.0, lat=10.0))
    records, _ = parse_geojson_features(data)
    r = records[0]
    assert r["category"] == "afecto"
    assert r["lng"] == -85.0
    assert r["lat"] == 10.0
    assert "geojson" in r


def test_extraer_user_id_y_school_id():
    """user_id y school_id deben extraerse correctamente si son enteros."""
    data = _make_collection(_make_feature("recreacion", user_id=3, school_id=7))
    records, skipped = parse_geojson_features(data)
    assert len(records) == 1
    assert records[0]["user_id"] == 3
    assert records[0]["school_id"] == 7
    assert skipped == []


def test_alias_categoria():
    """El campo 'categoria' debe ser aceptado como alias de 'category'."""
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 9.9]},
        "properties": {"categoria": "transito"},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert len(records) == 1
    assert records[0]["category"] == "transito"


# ─── Casos de omisión ─────────────────────────────────────────────────────────

def test_recreacion_feature_sin_category():
    """Un feature sin 'category' debe tomarse como de recreacion."""
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 9.9]},
        "properties": {},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert records[0]["category"] == "recreacion"


def test_omite_feature_con_user_id_no_entero():
    """Un feature con user_id de tipo string debe omitirse."""
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 9.9]},
        "properties": {"category": "riesgo", "user_id": "abc"},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert records == []
    assert len(skipped) == 1


def test_omite_feature_con_school_id_no_entero():
    """Un feature con school_id de tipo float debe omitirse."""
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 9.9]},
        "properties": {"category": "afecto", "school_id": 2.5},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert records == []
    assert len(skipped) == 1

def test_mezcla_validos_e_invalidos_real():
    valid = _make_feature("transito")
    invalid = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-84.0, 9.9]},
        "properties": {
            "category": "riesgo",
            "user_id": "abc",  # inválido
        },
    }
    data = _make_collection(valid, invalid)
    records, skipped = parse_geojson_features(data)

    assert len(records) == 1
    assert len(skipped) == 1


def test_polygon_pequeno_se_importa():
    """Un Polygon pequeño debe derivar un Point y ser importado."""
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-84.0, 9.9],
                    [-84.1, 9.9],
                    [-84.05, 10.0],
                ]
            ],
        },
        "properties": {"category": "riesgo"},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert len(records) == 1
    assert skipped == []

def test_omite_linestring():
    """LineString debe omitirse explícitamente."""
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [-84.0, 9.9],
                [-84.1, 10.0],
            ],
        },
        "properties": {"category": "transito"},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert records == []
    assert len(skipped) == 1
    assert "LineString" in skipped[0].message

def test_polygon_grande_se_omite():
    """Polygon con muchos puntos se omite por ser de referencia."""
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-84.0, 9.9],
                    [-84.1, 9.9],
                    [-84.2, 9.8],
                    [-84.3, 9.7],
                ]
            ],
        },
        "properties": {"category": "riesgo"},
    }
    data = _make_collection(feature)
    records, skipped = parse_geojson_features(data)
    assert records == []
    assert len(skipped) == 1