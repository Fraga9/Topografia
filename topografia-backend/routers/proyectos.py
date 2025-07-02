from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_supabase_user, CurrentUser
from dependencies import get_current_user_profile, get_user_project
from schemas import proyecto as schemas
from schemas import estacion as estacion_schemas
from schemas import medicion as medicion_schemas
from models.proyecto import Proyecto
from models.estacion import EstacionTeorica
import uuid
from decimal import Decimal

router = APIRouter()

@router.get("/", response_model=List[schemas.ProyectoCompleto])  # ✅ CAMBIO: Usar schema completo
def get_proyectos(
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Listar proyectos del usuario actual con TODOS los campos"""
    proyectos = db.query(Proyecto).filter(
        Proyecto.usuario_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # ✅ CONVERSIÓN MANUAL para asegurar tipos correctos
    proyectos_completos = []
    for proyecto in proyectos:
        proyecto_dict = {
            "id": proyecto.id,
            "usuario_id": str(proyecto.usuario_id),  # Convertir UUID a string
            "nombre": proyecto.nombre,
            "tramo": proyecto.tramo,
            "cuerpo": proyecto.cuerpo,
            # ✅ CONVERSIÓN: DECIMAL a float para frontend
            "km_inicial": float(proyecto.km_inicial) if proyecto.km_inicial else 0.0,
            "km_final": float(proyecto.km_final) if proyecto.km_final else 0.0,
            "intervalo": float(proyecto.intervalo) if proyecto.intervalo else 5.0,
            "espesor": float(proyecto.espesor) if proyecto.espesor else 0.25,
            "tolerancia_sct": float(proyecto.tolerancia_sct) if proyecto.tolerancia_sct else 0.005,
            # ✅ CONVERSIÓN: JSONB a list
            "divisiones_izquierdas": proyecto.divisiones_izquierdas or [],
            "divisiones_derechas": proyecto.divisiones_derechas or [],
            # ✅ CAMPOS CALCULADOS
            "total_estaciones": proyecto.total_estaciones,
            "longitud_proyecto": float(proyecto.longitud_proyecto) if proyecto.longitud_proyecto else 0.0,
            "fecha_creacion": proyecto.fecha_creacion,
            "fecha_modificacion": proyecto.fecha_modificacion,
            "estado": proyecto.estado or "CONFIGURACION"
        }
        proyectos_completos.append(proyecto_dict)
    
    return proyectos_completos

@router.get("/{proyecto_id}", response_model=schemas.ProyectoCompleto)  # ✅ CAMBIO: Schema completo
def get_proyecto(
    proyecto: Proyecto = Depends(get_user_project)
):
    """Obtener proyecto específico con TODOS los campos"""
    return {
        "id": proyecto.id,
        "usuario_id": str(proyecto.usuario_id),
        "nombre": proyecto.nombre,
        "tramo": proyecto.tramo,
        "cuerpo": proyecto.cuerpo,
        "km_inicial": float(proyecto.km_inicial) if proyecto.km_inicial else 0.0,
        "km_final": float(proyecto.km_final) if proyecto.km_final else 0.0,
        "intervalo": float(proyecto.intervalo) if proyecto.intervalo else 5.0,
        "espesor": float(proyecto.espesor) if proyecto.espesor else 0.25,
        "tolerancia_sct": float(proyecto.tolerancia_sct) if proyecto.tolerancia_sct else 0.005,
        "divisiones_izquierdas": proyecto.divisiones_izquierdas or [],
        "divisiones_derechas": proyecto.divisiones_derechas or [],
        "total_estaciones": proyecto.total_estaciones,
        "longitud_proyecto": float(proyecto.longitud_proyecto) if proyecto.longitud_proyecto else 0.0,
        "fecha_creacion": proyecto.fecha_creacion,
        "fecha_modificacion": proyecto.fecha_modificacion,
        "estado": proyecto.estado or "CONFIGURACION"
    }

@router.post("/", response_model=schemas.ProyectoCompleto)  # ✅ CAMBIO: Schema completo
def create_proyecto(
    proyecto: schemas.ProyectoCreate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo proyecto"""
    # Asignar el usuario actual automáticamente - EXCLUIR campos generados
    proyecto_data = proyecto.dict(exclude={'total_estaciones', 'longitud_proyecto'})
    proyecto_data['usuario_id'] = uuid.UUID(current_user.id)
    
    # ✅ ASEGURAR valores por defecto
    if 'espesor' not in proyecto_data or proyecto_data['espesor'] is None:
        proyecto_data['espesor'] = Decimal('0.25')
    if 'tolerancia_sct' not in proyecto_data or proyecto_data['tolerancia_sct'] is None:
        proyecto_data['tolerancia_sct'] = Decimal('0.005')
    if 'cuerpo' not in proyecto_data or proyecto_data['cuerpo'] is None:
        proyecto_data['cuerpo'] = 'A'
    
    db_proyecto = Proyecto(**proyecto_data)
    db.add(db_proyecto)
    db.commit()
    db.refresh(db_proyecto)
    
    # ✅ DEVOLVER con conversión correcta
    return get_proyecto(db_proyecto)

@router.post("/completo/", response_model=schemas.ProyectoCompleto)
def create_proyecto_completo(
    proyecto: schemas.ProyectoCompletoCreate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Crear proyecto completo con estaciones automáticas"""
    # Crear el proyecto base - EXCLUIR campos generados
    proyecto_data = proyecto.dict(exclude={'generar_estaciones', 'total_estaciones', 'longitud_proyecto'})
    proyecto_data['usuario_id'] = uuid.UUID(current_user.id)
    
    # ✅ Obtener valores para la creación de estaciones
    km_inicial = float(proyecto_data['km_inicial'])
    km_final = float(proyecto_data['km_final'])
    intervalo = float(proyecto_data['intervalo'])
    
    # ✅ ASEGURAR valores por defecto
    if 'espesor' not in proyecto_data or proyecto_data['espesor'] is None:
        proyecto_data['espesor'] = Decimal('0.25')
    if 'tolerancia_sct' not in proyecto_data or proyecto_data['tolerancia_sct'] is None:
        proyecto_data['tolerancia_sct'] = Decimal('0.005')
    if 'cuerpo' not in proyecto_data or proyecto_data['cuerpo'] is None:
        proyecto_data['cuerpo'] = 'A'
    
    db_proyecto = Proyecto(**proyecto_data)
    db.add(db_proyecto)
    db.commit()
    db.refresh(db_proyecto)
    
    # Generar estaciones automáticamente si se solicita
    if proyecto.generar_estaciones:
        km_actual = km_inicial
        
        while km_actual <= km_final:
            estacion = EstacionTeorica(
                proyecto_id=db_proyecto.id,
                km=Decimal(str(km_actual)),
                pendiente_derecha=Decimal('0.02'),  # Valor por defecto
                base_cl=Decimal('1886.140'),  # Valor por defecto basado en tus datos
                # ✅ NO incluir pendiente_izquierda - es generada automáticamente como (- pendiente_derecha)
            )
            db.add(estacion)
            km_actual += intervalo
        
        db.commit()
    
    # ✅ DEVOLVER con conversión correcta
    return get_proyecto(db_proyecto)

@router.put("/{proyecto_id}", response_model=schemas.ProyectoCompleto)
def update_proyecto(
    proyecto_update: schemas.ProyectoUpdate,
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Actualizar proyecto completo"""
    update_data = proyecto_update.dict(exclude_unset=True)
    
    # Recalcular campos si cambian km_inicial, km_final o intervalo
    recalcular = any(field in update_data for field in ['km_inicial', 'km_final', 'intervalo'])
    
    for field, value in update_data.items():
        setattr(proyecto, field, value)
    
    # ✅ NO recalcular campos generados - PostgreSQL los actualiza automáticamente
    # Los campos total_estaciones y longitud_proyecto son GENERATED ALWAYS
    
    db.commit()
    db.refresh(proyecto)
    
    # ✅ DEVOLVER con conversión correcta
    return get_proyecto(proyecto)

@router.patch("/{proyecto_id}", response_model=schemas.ProyectoCompleto)
def patch_proyecto(
    proyecto_update: schemas.ProyectoUpdate,
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Actualizar proyecto parcial"""
    return update_proyecto(proyecto_update, proyecto, db)

@router.delete("/{proyecto_id}")
def delete_proyecto(
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Eliminar proyecto"""
    db.delete(proyecto)
    db.commit()
    return {"message": "Proyecto eliminado correctamente"}

# ✅ CORREGIDO: Endpoint para obtener estaciones de un proyecto
@router.get("/{proyecto_id}/estaciones/")
def get_estaciones_proyecto(
    skip: int = 0,
    limit: int = 100,
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Obtener todas las estaciones de un proyecto con conversión manual"""
    estaciones = db.query(EstacionTeorica).filter(
        EstacionTeorica.proyecto_id == proyecto.id
    ).order_by(EstacionTeorica.km).offset(skip).limit(limit).all()
    
    # ✅ CONVERSIÓN MANUAL para asegurar tipos correctos
    return [
        {
            "id": estacion.id,
            "proyecto_id": estacion.proyecto_id,
            "km": float(estacion.km) if estacion.km else 0.0,
            "base_cl": float(estacion.base_cl) if estacion.base_cl else 0.0,
            "pendiente_derecha": float(estacion.pendiente_derecha) if estacion.pendiente_derecha else 0.0,
            "pendiente_izquierda": float(estacion.pendiente_izquierda) if estacion.pendiente_izquierda else 0.0,
            "fecha_captura": estacion.fecha_captura,
            "observaciones": estacion.observaciones,
            # ✅ CAMPOS ADICIONALES para compatibilidad
            "coordenada_x": 0.0,  # Valores por defecto
            "coordenada_y": 0.0,
            "elevacion": float(estacion.base_cl) if estacion.base_cl else 0.0,
            "kilometraje": float(estacion.km) if estacion.km else 0.0,
        }
        for estacion in estaciones
    ]

# ✅ CORREGIDO: Endpoint para obtener mediciones de un proyecto
@router.get("/{proyecto_id}/mediciones/")
def get_mediciones_proyecto(
    skip: int = 0,
    limit: int = 100,
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Obtener todas las mediciones de un proyecto con conversión manual"""
    from models.medicion import MedicionEstacion
    
    mediciones = db.query(MedicionEstacion).filter(
        MedicionEstacion.proyecto_id == proyecto.id
    ).order_by(MedicionEstacion.estacion_km).offset(skip).limit(limit).all()
    
    # ✅ CONVERSIÓN MANUAL USANDO LOS CAMPOS REALES DEL MODELO
    return [
        {
            "id": medicion.id,
            "proyecto_id": medicion.proyecto_id,
            "estacion_km": float(medicion.estacion_km) if medicion.estacion_km else 0.0,
            "bn_altura": float(medicion.bn_altura) if medicion.bn_altura else 0.0,
            "bn_lectura": float(medicion.bn_lectura) if medicion.bn_lectura else 0.0,
            "altura_aparato": float(medicion.altura_aparato) if medicion.altura_aparato else 0.0,
            "fecha_medicion": medicion.fecha_medicion,
            "operador": medicion.operador,
            "condiciones_clima": medicion.condiciones_clima,
            "observaciones": medicion.observaciones,
            # ✅ CAMPOS ADICIONALES para compatibilidad con frontend
            "kilometraje": float(medicion.estacion_km) if medicion.estacion_km else 0.0,
            "coordenada_x": 0.0,  # Valores por defecto por ahora
            "coordenada_y": 0.0,
            "elevacion": float(medicion.altura_aparato) if medicion.altura_aparato else 0.0,
            "numero_medicion": f"M-{medicion.id:04d}",  # Generar número de medición
        }
        for medicion in mediciones
    ]

# ✅ NUEVO: Endpoint para diagnóstico de datos
@router.get("/{proyecto_id}/debug/")
def debug_proyecto(
    proyecto: Proyecto = Depends(get_user_project),
    db: Session = Depends(get_db)
):
    """Endpoint para debugging - ver toda la información del proyecto"""
    from models.medicion import MedicionEstacion
    
    # Contar estaciones
    total_estaciones = db.query(EstacionTeorica).filter(
        EstacionTeorica.proyecto_id == proyecto.id
    ).count()
    
    # Contar mediciones
    total_mediciones = db.query(MedicionEstacion).filter(
        MedicionEstacion.proyecto_id == proyecto.id
    ).count()
    
    return {
        "proyecto": {
            "id": proyecto.id,
            "nombre": proyecto.nombre,
            "tramo": proyecto.tramo,
            "cuerpo": proyecto.cuerpo,
            "km_inicial": float(proyecto.km_inicial) if proyecto.km_inicial else None,
            "km_final": float(proyecto.km_final) if proyecto.km_final else None,
            "intervalo": float(proyecto.intervalo) if proyecto.intervalo else None,
            "espesor": float(proyecto.espesor) if proyecto.espesor else None,
            "tolerancia_sct": float(proyecto.tolerancia_sct) if proyecto.tolerancia_sct else None,
            "total_estaciones_calculado": proyecto.total_estaciones,
            "longitud_proyecto": float(proyecto.longitud_proyecto) if proyecto.longitud_proyecto else None,
            "estado": proyecto.estado,
            "usuario_id": str(proyecto.usuario_id) if proyecto.usuario_id else None,
        },
        "estadisticas": {
            "estaciones_en_db": total_estaciones,
            "mediciones_en_db": total_mediciones,
            "longitud_real": float(proyecto.km_final - proyecto.km_inicial) if proyecto.km_inicial and proyecto.km_final else None,
            "estaciones_teoricas": int((float(proyecto.km_final - proyecto.km_inicial) / float(proyecto.intervalo)) + 1) if proyecto.km_inicial and proyecto.km_final and proyecto.intervalo else None,
        },
        "tipos_de_datos": {
            "km_inicial_tipo": type(proyecto.km_inicial).__name__,
            "km_final_tipo": type(proyecto.km_final).__name__,
            "intervalo_tipo": type(proyecto.intervalo).__name__,
            "espesor_tipo": type(proyecto.espesor).__name__,
        }
    }