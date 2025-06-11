from sqlalchemy import Column, Integer, DECIMAL, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class LecturaDivision(Base):
    """
    Modelo SQLAlchemy para la tabla lecturas_divisiones.
    Representa las lecturas tomadas en cada división transversal de una medición.
    """
    __tablename__ = "lecturas_divisiones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    medicion_id = Column(Integer, ForeignKey("mediciones_estacion.id", ondelete="CASCADE"), nullable=False)
    division_transversal = Column(DECIMAL(8, 3), nullable=False)
    lectura_mira = Column(DECIMAL(8, 6), nullable=False)
    elv_base_real = Column(DECIMAL(10, 6), nullable=True)
    elv_base_proyecto = Column(DECIMAL(10, 6), nullable=True)
    elv_concreto_proyecto = Column(DECIMAL(10, 6), nullable=True)
    esp_concreto_proyecto = Column(DECIMAL(8, 6), nullable=True)
    clasificacion = Column(String(10), nullable=True)
    volumen_por_metro = Column(DECIMAL(10, 6), nullable=True)
    cumple_tolerancia = Column(Boolean, nullable=True)
    calidad = Column(String(10), default="BUENA")
    fecha_calculo = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    medicion = relationship("MedicionEstacion", back_populates="lecturas")