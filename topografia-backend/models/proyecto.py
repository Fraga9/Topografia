from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Proyecto(Base):
    """
    Modelo SQLAlchemy para la tabla proyectos.
    Representa proyectos de construcción vial con sus configuraciones.
    """
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("perfiles_usuario.id"), nullable=False)
    nombre = Column(String(255), nullable=False)
    tramo = Column(String(100), nullable=True)
    cuerpo = Column(String(50), nullable=True)
    km_inicial = Column(DECIMAL(10, 3), nullable=False)
    km_final = Column(DECIMAL(10, 3), nullable=False)
    intervalo = Column(DECIMAL(6, 3), nullable=False, default=5.0)
    espesor = Column(DECIMAL(6, 3), nullable=False, default=0.25)
    tolerancia_sct = Column(DECIMAL(8, 6), nullable=False, default=0.005)
    divisiones_izquierdas = Column(JSONB, nullable=True)
    divisiones_derechas = Column(JSONB, nullable=True)
    total_estaciones = Column(Integer, nullable=True)
    longitud_proyecto = Column(DECIMAL(10, 3), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    estado = Column(String(20), default="CONFIGURACION")
    
    # Relaciones
    usuario = relationship("PerfilUsuario", back_populates="proyectos")
    estaciones = relationship("EstacionTeorica", back_populates="proyecto", cascade="all, delete-orphan")
    mediciones = relationship("MedicionEstacion", back_populates="proyecto", cascade="all, delete-orphan")