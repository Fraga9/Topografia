from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

# Schema base para campos comunes
class EstacionTeoricaBase(BaseModel):
    km: Decimal = Field(..., description="Kilómetro de la estación")
    pendiente_derecha: Decimal = Field(..., description="Pendiente lado derecho")
    base_cl: Decimal = Field(..., description="Elevación base en centro de línea")
    pendiente_izquierda: Optional[Decimal] = Field(None, description="Pendiente lado izquierdo")
    observaciones: Optional[str] = None

# Schema para crear estación
class EstacionTeoricaCreate(EstacionTeoricaBase):
    proyecto_id: int

# Schema para actualizar estación
class EstacionTeoricaUpdate(BaseModel):
    km: Optional[Decimal] = None
    pendiente_derecha: Optional[Decimal] = None
    base_cl: Optional[Decimal] = None
    pendiente_izquierda: Optional[Decimal] = None
    observaciones: Optional[str] = None

# Schema para respuesta con todos los campos
class EstacionTeoricaResponse(EstacionTeoricaBase):
    id: int
    proyecto_id: int
    fecha_captura: datetime
    
    class Config:
        from_attributes = True

# Schema simplificado para listas
class EstacionTeoricaSimple(BaseModel):
    id: int
    km: Decimal
    base_cl: Decimal
    fecha_captura: datetime
    
    class Config:
        from_attributes = True