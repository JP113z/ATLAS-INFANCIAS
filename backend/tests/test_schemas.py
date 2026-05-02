"""
test_schemas.py — Pruebas unitarias para los esquemas Pydantic del proyecto.

Cubre:
  - app/schemas/user.py  → UpdateUsernameRequest, UpdatePasswordRequest
  - app/schemas/comments.py → CommentCreate
"""

import pytest
from pydantic import ValidationError

from app.schemas.user import UpdateUsernameRequest, UpdatePasswordRequest
from app.schemas.comments import CommentCreate


# ─── UpdateUsernameRequest ────────────────────────────────────────────────────

def test_username_valido():
    """Un username de 3-30 caracteres debe ser aceptado."""
    schema = UpdateUsernameRequest(username="jose")
    assert schema.username == "jose"


def test_username_demasiado_corto():
    """Un username con menos de 3 caracteres debe generar ValidationError."""
    with pytest.raises(ValidationError):
        UpdateUsernameRequest(username="jp")


def test_username_demasiado_largo():
    """Un username con más de 30 caracteres debe generar ValidationError."""
    with pytest.raises(ValidationError):
        UpdateUsernameRequest(username="a" * 31)


# ─── UpdatePasswordRequest ────────────────────────────────────────────────────

def test_password_update_valida():
    """Contraseña actual de 1+ y nueva de 6+ caracteres deben ser aceptadas."""
    schema = UpdatePasswordRequest(current_password="1", new_password="nueva123")
    assert schema.current_password == "1"
    assert schema.new_password == "nueva123"


def test_password_actual_vacia_falla():
    """current_password vacío (min_length=1) debe fallar."""
    with pytest.raises(ValidationError):
        UpdatePasswordRequest(current_password="", new_password="nueva123")


def test_password_nueva_muy_corta():
    """new_password con menos de 6 caracteres (min_length=6) debe fallar."""
    with pytest.raises(ValidationError):
        UpdatePasswordRequest(current_password="actual", new_password="12345")


def test_password_nueva_exactamente_6():
    """new_password con exactamente 6 caracteres debe ser aceptada."""
    schema = UpdatePasswordRequest(current_password="actual", new_password="123456")
    assert schema.new_password == "123456"


# ─── CommentCreate ────────────────────────────────────────────────────────────

def test_comentario_valido():
    """Un comentario con 1-400 caracteres debe ser aceptado."""
    schema = CommentCreate(content="Hola, este es un comentario.")
    assert schema.content == "Hola, este es un comentario."


def test_comentario_vacio_falla():
    """Un comentario vacío (min_length=1) debe generar ValidationError."""
    with pytest.raises(ValidationError):
        CommentCreate(content="")


def test_comentario_demasiado_largo():
    """Un comentario de más de 400 caracteres debe fallar."""
    with pytest.raises(ValidationError):
        CommentCreate(content="x" * 401)


def test_comentario_exactamente_400():
    """Un comentario de exactamente 400 caracteres debe ser aceptado."""
    schema = CommentCreate(content="a" * 400)
    assert len(schema.content) == 400
