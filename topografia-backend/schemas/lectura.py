from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

# Schema base para campos comunes
class LecturaDivisionBase(BaseModel):
    division_transversal: Decimal = Field(..., description="Posición transversal de la división")
    lectura_mira: Decimal = Field(..., description="Lectura de la mira topográfica")
    calidad: Optional[str] = Field("BUENA", max_length=10, description="Calidad de la lectura")

    @validator('lectura_mira')
    def validate_lectura_mira(cls, v):
        if v < 0:
            raise ValueError('La lectura de la mira no puede ser negativa')
        return v

    @validator('calidad')
    def validate_calidad(cls, v):
        if v and v not in ['BUENA', 'REGULAR', 'MALA', 'REVISAR', 'EXCELENTE']:
            raise ValueError('La calidad debe ser BUENA, REGULAR, MALA, REVISAR o EXCELENTE')
        return v

# Schema para crear lectura
class LecturaDivisionCreate(LecturaDivisionBase):
    medicion_id: int

# Schema para actualizar lectura
class LecturaDivisionUpdate(BaseModel):
    division_transversal: Optional[Decimal] = None
    lectura_mira: Optional[Decimal] = None
    elv_base_real: Optional[Decimal] = None
    elv_base_proyecto: Optional[Decimal] = None
    elv_concreto_proyecto: Optional[Decimal] = None
    esp_concreto_proyecto: Optional[Decimal] = None
    clasificacion: Optional[str] = Field(None, max_length=10)
    volumen_por_metro: Optional[Decimal] = None
    cumple_tolerancia: Optional[bool] = None
    calidad: Optional[str] = Field(None, max_length=10)

# Schema para respuesta con todos los campos
class LecturaDivisionResponse(LecturaDivisionBase):
    id: int
    medicion_id: int
    elv_base_real: Optional[Decimal] = None
    elv_base_proyecto: Optional[Decimal] = None
    elv_concreto_proyecto: Optional[Decimal] = None
    esp_concreto_proyecto: Optional[Decimal] = None
    clasificacion: Optional[str] = None
    volumen_por_metro: Optional[Decimal] = None
    cumple_tolerancia: Optional[bool] = None
    fecha_calculo: datetime
    
    class Config:
        from_attributes = True

# Schema simplificado para listas
class LecturaDivisionSimple(BaseModel):
    id: int
    division_transversal: Decimal
    lectura_mira: Decimal
    clasificacion: Optional[str] = None
    cumple_tolerancia: Optional[bool] = None
    
    class Config:
        from_attributes = True