# schemas/medicion.py - Schema corregido para tu modelo MedicionEstacion real
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal

# Schema base para campos comunes de mediciones (basado en tu modelo real)
class MedicionEstacionBase(BaseModel):
    estacion_km: Decimal = Field(..., description="Kilómetro de la estación")
    bn_altura: Decimal = Field(..., description="Altura del BN (Banco de Nivel)")
    bn_lectura: Decimal = Field(..., description="Lectura del BN")
    fecha_medicion: date = Field(..., description="Fecha de la medición")
    operador: Optional[str] = Field(None, description="Operador que realizó la medición")
    condiciones_clima: Optional[str] = Field(None, description="Condiciones climáticas")
    observaciones: Optional[str] = None

# Schema para crear medición
class MedicionEstacionCreate(MedicionEstacionBase):
    proyecto_id: int

# Schema para actualizar medición
class MedicionEstacionUpdate(BaseModel):
    estacion_km: Optional[Decimal] = None
    bn_altura: Optional[Decimal] = None
    bn_lectura: Optional[Decimal] = None
    fecha_medicion: Optional[date] = None
    operador: Optional[str] = None
    condiciones_clima: Optional[str] = None
    observaciones: Optional[str] = None

# Schema para respuesta completa
class MedicionEstacionResponse(MedicionEstacionBase):
    id: int
    proyecto_id: int
    altura_aparato: Optional[Decimal] = Field(None, description="Altura del aparato (calculada)")
    
    class Config:
        from_attributes = True

# Schema simplificado para listas (el que está causando error)
class MedicionEstacionSimple(BaseModel):
    id: int
    proyecto_id: int
    estacion_km: Decimal
    bn_altura: Decimal
    bn_lectura: Decimal
    altura_aparato: Optional[Decimal] = None
    fecha_medicion: date
    operador: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema adicional para el frontend si necesitas conversión a float
class MedicionEstacionFrontend(BaseModel):
    id: int
    proyecto_id: int
    estacion_km: float
    bn_altura: float
    bn_lectura: float
    altura_aparato: Optional[float] = None
    fecha_medicion: date
    operador: Optional[str] = None
    condiciones_clima: Optional[str] = None
    observaciones: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema de resumen para reportes
class MedicionEstacionResumen(BaseModel):
    id: int
    estacion_km: Decimal
    altura_aparato: Optional[Decimal] = None
    fecha_medicion: date
    operador: Optional[str] = None
    
    class Config:
        from_attributes = True