"""
conftest.py — Configuración global de pytest para ATLAS Infancias.

Se ejecuta antes de importar cualquier módulo de la app, por lo que
establece DATABASE_URL con SQLite para que create_engine() no falle
durante las pruebas unitarias puras (que no tocan la base de datos).
"""

import os
import sys

# ── 1. Apuntar DATABASE_URL a SQLite en memoria ──────────────────────────────
# load_dotenv() NO sobreescribe variables ya definidas en el entorno,
# así que esto prevalece sobre el .env real.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_atlas.db")

# ── 2. Asegurar que el directorio raíz del backend esté en sys.path ──────────
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
