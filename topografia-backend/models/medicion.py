from sqlalchemy import Column, Integer, DECIMAL, Date, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class MedicionEstacion(Base):
    """
    Modelo SQLAlchemy para la tabla mediciones_estacion.
    Representa las mediciones de campo realizadas en las estaciones.
    """
    __tablename__ = "mediciones_estacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    estacion_km = Column(DECIMAL(10, 3), nullable=False)
    bn_altura = Column(DECIMAL(10, 6), nullable=False)
    bn_lectura = Column(DECIMAL(8, 6), nullable=False)
    altura_aparato = Column(DECIMAL(10, 6), nullable=True)
    fecha_medicion = Column(Date, nullable=False, server_default=func.current_date())
    operador = Column(String(100), nullable=True)
    condiciones_clima = Column(String(100), nullable=True)
    observaciones = Column(Text, nullable=True)
    
    # Relaciones
    proyecto = relationship("Proyecto", back_populates="mediciones")
    lecturas = relationship("LecturaDivision", back_populates="medicion", cascade="all, delete-orphan")
    
    # Restricción única para proyecto_id y estacion_km
    __table_args__ = (UniqueConstraint('proyecto_id', 'estacion_km', name='_proyecto_estacion_uc'),)