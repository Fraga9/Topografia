from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class PerfilUsuario(Base):
    """
    Modelo SQLAlchemy para la tabla perfiles_usuario.
    Representa los perfiles de usuarios del sistema de topografía.
    
    Esta tabla complementa la tabla auth.users de Supabase:
    - auth.users: maneja autenticación (email, password, fechas)
    - perfiles_usuario: maneja información adicional del usuario
    
    El ID de esta tabla debe coincidir con auth.users.id para mantener la relación.
    """
    __tablename__ = "perfiles_usuario"

    # ID que debe coincidir con auth.users.id de Supabase
    id = Column(UUID(as_uuid=True), primary_key=True)
    
    # Email duplicado para facilitar consultas (opcional)
    email = Column(Text, unique=True, nullable=False)
    
    # Información adicional del usuario
    nombre_completo = Column(Text, nullable=False)
    empresa = Column(Text, nullable=True)
    organizacion = Column(Text, nullable=True)  # Alias para empresa
    
    # Campos de control
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    activo = Column(Boolean, default=True)
    
    # Relaciones
    proyectos = relationship("Proyecto", back_populates="usuario")