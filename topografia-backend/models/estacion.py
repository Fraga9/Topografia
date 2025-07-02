from sqlalchemy import Column, Integer, DECIMAL, DateTime, Text, ForeignKey, UniqueConstraint, Computed
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class EstacionTeorica(Base):
    """
    Modelo SQLAlchemy para la tabla estaciones_teoricas.
    Representa las estaciones teóricas de diseño en un proyecto.
    """
    __tablename__ = "estaciones_teoricas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    km = Column(DECIMAL(10, 3), nullable=False)
    pendiente_derecha = Column(DECIMAL(8, 6), nullable=False)
    base_cl = Column(DECIMAL(10, 6), nullable=False)
    # ✅ Campo generado por PostgreSQL - no se incluye en INSERT
    pendiente_izquierda = Column(DECIMAL(8, 6), Computed("(- pendiente_derecha)"), nullable=True)
    fecha_captura = Column(DateTime(timezone=True), server_default=func.now())
    observaciones = Column(Text, nullable=True)
    
    # Relaciones
    proyecto = relationship("Proyecto", back_populates="estaciones")
    
    # Restricción única para proyecto_id y km
    __table_args__ = (UniqueConstraint('proyecto_id', 'km', name='_proyecto_km_uc'),)