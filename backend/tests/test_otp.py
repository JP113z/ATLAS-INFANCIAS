"""
test_otp.py — Pruebas unitarias para app/otp.py

Cubre:
  - generate_otp_code
  - hash_otp
  - verify_otp
"""

import pytest
from app.otp import generate_otp_code, hash_otp, verify_otp


# ─── generate_otp_code ────────────────────────────────────────────────────────

def test_generate_otp_tiene_6_caracteres():
    """El OTP generado debe tener exactamente 6 dígitos."""
    code = generate_otp_code()
    assert len(code) == 6


def test_generate_otp_es_string():
    """generate_otp_code debe retornar una cadena de texto."""
    code = generate_otp_code()
    assert isinstance(code, str)


def test_generate_otp_solo_digitos():
    """El OTP debe contener únicamente dígitos (0-9)."""
    code = generate_otp_code()
    assert code.isdigit()


def test_generate_otp_codigos_distintos():
    """Dos llamadas consecutivas deben generar códigos diferentes (en general)."""
    codes = {generate_otp_code() for _ in range(20)}
    # Con 1 millón de posibilidades y 20 muestras, la probabilidad de
    # colisión total es despreciable.
    assert len(codes) > 1


# ─── hash_otp ─────────────────────────────────────────────────────────────────

def test_hash_otp_retorna_string():
    """hash_otp debe retornar una cadena de texto."""
    result = hash_otp("123456")
    assert isinstance(result, str)


def test_hash_otp_mismo_codigo_mismo_hash():
    """El mismo código siempre produce el mismo hash (SHA-256 es determinístico)."""
    assert hash_otp("654321") == hash_otp("654321")


def test_hash_otp_distinto_codigo_distinto_hash():
    """Códigos diferentes deben producir hashes diferentes."""
    assert hash_otp("000000") != hash_otp("111111")


# ─── verify_otp ───────────────────────────────────────────────────────────────

def test_verify_otp_correcto():
    """verify_otp debe retornar True cuando el código coincide con su hash."""
    code = "987654"
    code_hash = hash_otp(code)
    assert verify_otp(code, code_hash) is True


def test_verify_otp_incorrecto():
    """verify_otp debe retornar False cuando el código no coincide."""
    code_hash = hash_otp("111111")
    assert verify_otp("999999", code_hash) is False
