"""
test_security.py — Pruebas unitarias para app/security.py

Cubre:
  - hash_password
  - verify_password
  - create_access_token
"""

import pytest
from jose import jwt
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)


# ─── hash_password ────────────────────────────────────────────────────────────

def test_hash_password_no_es_igual_al_original():
    """El hash de la contraseña no debe ser igual al texto plano."""
    hashed = hash_password("mi_contrasena_123")
    assert hashed != "mi_contrasena_123"


def test_hash_password_retorna_string():
    """hash_password debe retornar una cadena de texto."""
    hashed = hash_password("abc")
    assert isinstance(hashed, str)


def test_hash_password_mismo_input_diferente_hash():
    """bcrypt usa salt, por lo que dos hashes del mismo texto son distintos."""
    h1 = hash_password("contrasena")
    h2 = hash_password("contrasena")
    assert h1 != h2


# ─── verify_password ──────────────────────────────────────────────────────────

def test_verify_password_correcto():
    """verify_password debe retornar True cuando la contraseña coincide."""
    plain = "secreto456"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


def test_verify_password_incorrecto():
    """verify_password debe retornar False cuando la contraseña no coincide."""
    hashed = hash_password("contrasena_real")
    assert verify_password("contrasena_equivocada", hashed) is False


# ─── create_access_token ──────────────────────────────────────────────────────

def test_create_access_token_retorna_string():
    """create_access_token debe devolver una cadena (JWT)."""
    token = create_access_token({"sub": "1"})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_contiene_sub():
    """El payload decodificado debe contener el campo 'sub' que enviamos."""
    token = create_access_token({"sub": "42"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"


def test_create_access_token_contiene_exp():
    """El payload debe incluir el campo de expiración 'exp'."""
    token = create_access_token({"sub": "99"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload
