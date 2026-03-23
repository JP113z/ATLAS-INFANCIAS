
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from geoalchemy2 import Geometry

from app.database import Base
##Creacion sticker tabla sticker
class Sticker(Base):
    __tablename__ = "stickers"
    #Aqui creo que tambien hay que poner genero 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer,ForeignKey("users.id",ondelete = "SET NULL"), nullable = True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete = "SET NULL"), nullable=True)
    category = Column(String(50), nullable = False)
    

    #GeoJSON completo para el respalpdo
    geojson = Column(JSONB, nullable=False)

    location = Column(Geometry(geometry_type = "POINT", srid=4326), nullable=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    