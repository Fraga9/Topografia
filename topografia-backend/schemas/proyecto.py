# schemas/proyecto.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

# Schema para encargados del proyecto
class Encargado(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del encargado")
    puesto: str = Field(..., min_length=1, max_length=50, description="Puesto del encargado")

    @validator('nombre')
    def validate_nombre(cls, v):
        if not v.strip():
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()

    @validator('puesto')
    def validate_puesto(cls, v):
        if not v.strip():
            raise ValueError('El puesto no puede estar vacío')
        return v.strip()

# Schema base para campos comunes
class ProyectoBase(BaseModel):
    nombre: str = Field(..., max_length=255, description="Nombre del proyecto")
    tramo: Optional[str] = Field(None, max_length=100, description="Tramo del proyecto")
    cuerpo: Optional[str] = Field("A", max_length=50, description="Cuerpo de la carretera")
    km_inicial: Decimal = Field(..., description="Kilómetro inicial del proyecto")
    km_final: Decimal = Field(..., description="Kilómetro final del proyecto")
    intervalo: Decimal = Field(5.0, description="Intervalo entre estaciones en metros")
    espesor: Decimal = Field(0.25, description="Espesor del concreto en metros")
    tolerancia_sct: Decimal = Field(0.005, description="Tolerancia SCT para elevaciones")
    divisiones_izquierdas: Optional[List[float]] = Field(
        default=[-12.21, -10.7, -9, -6, -3, -1.3, 0],
        description="Divisiones transversales lado izquierdo"
    )
    divisiones_derechas: Optional[List[float]] = Field(
        default=[1.3, 3, 6, 9, 10.7, 12.21],
        description="Divisiones transversales lado derecho"
    )
    encargados: Optional[List[Encargado]] = Field(
        default=[
            {"nombre": "", "puesto": "Topógrafo Principal"},
            {"nombre": "", "puesto": "Topógrafo de Campo"},
            {"nombre": "", "puesto": "Ayudante de Topógrafo"},
            {"nombre": "", "puesto": "Supervisor de Calidad"}
        ],
        description="Lista de encargados del proyecto con sus puestos"
    )

    @validator('km_final')
    def validate_km_range(cls, v, values):
        if 'km_inicial' in values and v <= values['km_inicial']:
            raise ValueError('km_final debe ser mayor que km_inicial')
        return v

    @validator('intervalo')
    def validate_intervalo(cls, v):
        if v <= 0:
            raise ValueError('El intervalo debe ser mayor que 0')
        return v

    @validator('encargados')
    def validate_encargados(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError('No se pueden asignar más de 10 encargados por proyecto')
            # Validar que no haya duplicados de nombre
            nombres = [enc.nombre.strip().lower() for enc in v if enc.nombre.strip()]
            if len(nombres) != len(set(nombres)):
                raise ValueError('No se pueden tener encargados con el mismo nombre')
        return v

# Schema para crear proyecto
class ProyectoCreate(ProyectoBase):
    pass  # usuario_id se asigna automáticamente en el endpoint

# Schema para actualizar proyecto
class ProyectoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    tramo: Optional[str] = Field(None, max_length=100)
    cuerpo: Optional[str] = Field(None, max_length=50)
    km_inicial: Optional[Decimal] = None
    km_final: Optional[Decimal] = None
    intervalo: Optional[Decimal] = None
    espesor: Optional[Decimal] = None
    tolerancia_sct: Optional[Decimal] = None
    divisiones_izquierdas: Optional[List[float]] = None
    divisiones_derechas: Optional[List[float]] = None
    encargados: Optional[List[Encargado]] = None
    estado: Optional[str] = Field(None, max_length=20)

# ✅ NUEVO: Schema completo con TODOS los campos para frontend
class ProyectoCompleto(BaseModel):
    """Schema completo con todos los campos necesarios para el frontend"""
    id: int
    usuario_id: str  # Convertido a string para el frontend
    nombre: str
    tramo: Optional[str] = None
    cuerpo: Optional[str] = None
    # ✅ CAMPOS NUMÉRICOS como float para JavaScript
    km_inicial: float
    km_final: float
    intervalo: float
    espesor: float
    tolerancia_sct: float
    # ✅ CAMPOS CALCULADOS
    total_estaciones: Optional[int] = None
    longitud_proyecto: float
    # ✅ ARRAYS JSONB
    divisiones_izquierdas: List[float] = [-12.21, -10.7, -9, -6, -3, -1.3, 0]
    divisiones_derechas: List[float] = [1.3, 3, 6, 9, 10.7, 12.21]
    encargados: List[Dict[str, str]] = [
        {"nombre": "", "puesto": "Topógrafo Principal"},
        {"nombre": "", "puesto": "Topógrafo de Campo"},
        {"nombre": "", "puesto": "Ayudante de Topógrafo"},
        {"nombre": "", "puesto": "Supervisor de Calidad"}
    ]
    # ✅ METADATA
    fecha_creacion: datetime
    fecha_modificacion: datetime
    estado: str

    class Config:
        from_attributes = True

# Schema para respuesta con todos los campos (DEPRECATED - usar ProyectoCompleto)
class ProyectoResponse(ProyectoBase):
    id: int
    usuario_id: uuid.UUID
    total_estaciones: Optional[int] = None
    longitud_proyecto: Optional[Decimal] = None
    fecha_creacion: datetime
    fecha_modificacion: datetime
    estado: str
    
    class Config:
        from_attributes = True

# Schema para crear proyecto completo con estaciones automáticas
class ProyectoCompletoCreate(ProyectoBase):
    generar_estaciones: bool = Field(True, description="Generar estaciones automáticamente")

# Schema simplificado para listas (DEPRECATED - usar ProyectoCompleto)
class ProyectoSimple(BaseModel):
    id: int
    nombre: str
    tramo: Optional[str] = None
    km_inicial: Decimal
    km_final: Decimal
    estado: str
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

# ✅ NUEVO: Schema para debugging
class ProyectoDebug(BaseModel):
    """Schema para endpoint de debugging con información detallada"""
    proyecto: dict
    estadisticas: dict
    tipos_de_datos: dict