from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

# Schema base para campos comunes
class PerfilUsuarioBase(BaseModel):
    email: EmailStr
    nombre_completo: str
    empresa: Optional[str] = None
    organizacion: Optional[str] = None

# Schema para crear usuario (cuando se registra desde Supabase)
class PerfilUsuarioCreate(BaseModel):
    id: uuid.UUID  # ID de auth.users de Supabase
    email: EmailStr
    nombre_completo: str
    empresa: Optional[str] = None
    organizacion: Optional[str] = None

# Schema para actualizar usuario
class PerfilUsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    empresa: Optional[str] = None
    organizacion: Optional[str] = None
    activo: Optional[bool] = None

# Schema para respuesta con todos los campos
class PerfilUsuarioResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    nombre_completo: str
    empresa: Optional[str] = None
    organizacion: Optional[str] = None
    fecha_registro: datetime
    fecha_actualizacion: datetime
    activo: bool
    
    class Config:
        from_attributes = True

# Schema simplificado para referencias en otras entidades
class PerfilUsuarioSimple(BaseModel):
    id: uuid.UUID
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    
    class Config:
        from_attributes = True