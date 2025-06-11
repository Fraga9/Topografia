from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

# Schema base para campos comunes
class PerfilUsuarioBase(BaseModel):
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    empresa: Optional[str] = None

# Schema para crear usuario
class PerfilUsuarioCreate(PerfilUsuarioBase):
    pass

# Schema para actualizar usuario
class PerfilUsuarioUpdate(PerfilUsuarioBase):
    activo: Optional[bool] = None

# Schema para respuesta con todos los campos
class PerfilUsuarioResponse(PerfilUsuarioBase):
    id: uuid.UUID
    fecha_registro: datetime
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