

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine
import app.models
from app.routers import schools, user, auth
from app.routers.geojson import router as geojson_router
from app.routers import stickers
from app.routers import votes

app = FastAPI(title="ATLAS Infancias API")

app.include_router(geojson_router)

app.include_router(schools.router)
app.include_router(user.router)
app.include_router(auth.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.100.137:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
app.include_router(stickers.router)
app.include_router(votes.router)
@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health/db")
def check_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "conectada"}
    except Exception as e:
        return {"database": "error", "detalle": str(e)}