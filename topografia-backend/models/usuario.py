from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class PerfilUsuario(Base):
    """
    Modelo SQLAlchemy para la tabla perfiles_usuario.
    Representa los usuarios del sistema de topografía.
    """
    __tablename__ = "perfiles_usuario"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=True)
    nombre_completo = Column(Text, nullable=True)
    empresa = Column(Text, nullable=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    activo = Column(Boolean, default=True)
    
    # Relaciones
    proyectos = relationship("Proyecto", back_populates="usuario")