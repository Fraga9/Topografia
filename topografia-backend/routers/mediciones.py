from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_supabase_user, CurrentUser
from schemas import medicion as schemas
from models.medicion import MedicionEstacion
from models.proyecto import Proyecto
from decimal import Decimal

router = APIRouter()

def verify_medicion_access(
    medicion_id: int,
    current_user: CurrentUser,
    db: Session
) -> MedicionEstacion:
    """Verificar que el usuario tenga acceso a la medición"""
    medicion = db.query(MedicionEstacion).join(Proyecto).filter(
        MedicionEstacion.id == medicion_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not medicion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medición no encontrada o no tienes permisos para accederla"
        )
    
    return medicion

@router.get("/", response_model=List[schemas.MedicionEstacionSimple])
def get_mediciones(
    proyecto_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Listar mediciones, opcionalmente filtradas por proyecto"""
    query = db.query(MedicionEstacion).join(Proyecto).filter(
        Proyecto.usuario_id == current_user.id
    )
    
    if proyecto_id:
        query = query.filter(MedicionEstacion.proyecto_id == proyecto_id)
    
    mediciones = query.order_by(MedicionEstacion.estacion_km).offset(skip).limit(limit).all()
    return mediciones

@router.get("/{medicion_id}", response_model=schemas.MedicionEstacionResponse)
def get_medicion(
    medicion_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Obtener medición específica"""
    medicion = verify_medicion_access(medicion_id, current_user, db)
    return medicion

@router.post("/", response_model=schemas.MedicionEstacionResponse)
def create_medicion(
    medicion: schemas.MedicionEstacionCreate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Crear nueva medición"""
    # Verificar que el proyecto pertenezca al usuario
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == medicion.proyecto_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not proyecto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado o no tienes permisos"
        )
    
    # Verificar que no exista ya una medición en esa estación
    existing = db.query(MedicionEstacion).filter(
        MedicionEstacion.proyecto_id == medicion.proyecto_id,
        MedicionEstacion.estacion_km == medicion.estacion_km
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una medición en la estación km {medicion.estacion_km}"
        )
    
    # Crear la medición SIN altura_aparato (se calcula automáticamente en DB)
    medicion_data = medicion.dict()
    medicion_data.pop('altura_aparato', None)  # Remover si existe
    
    db_medicion = MedicionEstacion(**medicion_data)
    db.add(db_medicion)
    db.commit()
    db.refresh(db_medicion)
    return db_medicion

@router.put("/{medicion_id}", response_model=schemas.MedicionEstacionResponse)
def update_medicion(
    medicion_id: int,
    medicion_update: schemas.MedicionEstacionUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar medición completa"""
    db_medicion = verify_medicion_access(medicion_id, current_user, db)
    
    update_data = medicion_update.dict(exclude_unset=True)
    
    # Si se actualiza el estacion_km, verificar que no cause conflicto
    if 'estacion_km' in update_data:
        existing = db.query(MedicionEstacion).filter(
            MedicionEstacion.proyecto_id == db_medicion.proyecto_id,
            MedicionEstacion.estacion_km == update_data['estacion_km'],
            MedicionEstacion.id != medicion_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otra medición en la estación km {update_data['estacion_km']}"
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(db_medicion, field, value)
    
    # NO recalcular altura_aparato - se calcula automáticamente en DB como GENERATED column
    
    db.commit()
    db.refresh(db_medicion)
    return db_medicion

@router.patch("/{medicion_id}", response_model=schemas.MedicionEstacionResponse)
def patch_medicion(
    medicion_id: int,
    medicion_update: schemas.MedicionEstacionUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar medición parcial"""
    return update_medicion(medicion_id, medicion_update, current_user, db)

@router.delete("/{medicion_id}")
def delete_medicion(
    medicion_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Eliminar medición"""
    db_medicion = verify_medicion_access(medicion_id, current_user, db)
    
    db.delete(db_medicion)
    db.commit()
    
    return {"message": "Medición eliminada correctamente"}

# ✅ CORREGIDO: Endpoint para obtener lecturas de una medición
@router.get("/{medicion_id}/lecturas/")
def get_lecturas_medicion(
    medicion_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las lecturas de una medición"""
    from models.lectura import LecturaDivision
    
    # Verificar acceso a la medición
    medicion = verify_medicion_access(medicion_id, current_user, db)
    
    lecturas = db.query(LecturaDivision).filter(
        LecturaDivision.medicion_id == medicion_id
    ).order_by(LecturaDivision.division_transversal).offset(skip).limit(limit).all()
    
    # ✅ CONVERSIÓN MANUAL SEGURA para evitar el mismo error
    result = []
    for lectura in lecturas:
        try:
            lectura_dict = {
                "id": getattr(lectura, 'id', None),
                "medicion_id": getattr(lectura, 'medicion_id', None),
                "division_transversal": float(getattr(lectura, 'division_transversal', 0)) if getattr(lectura, 'division_transversal', None) else None,
                
                # Agregar más campos según tu modelo LecturaDivision
                # Adapta estos campos a los nombres reales de tu modelo
                "cota_teorica": float(getattr(lectura, 'cota_teorica', 0)) if getattr(lectura, 'cota_teorica', None) else None,
                "lectura_estadal": float(getattr(lectura, 'lectura_estadal', 0)) if getattr(lectura, 'lectura_estadal', None) else None,
                "cota_real": float(getattr(lectura, 'cota_real', 0)) if getattr(lectura, 'cota_real', None) else None,
                "diferencia": float(getattr(lectura, 'diferencia', 0)) if getattr(lectura, 'diferencia', None) else None,
                
                # Campos adicionales comunes
                "observaciones": getattr(lectura, 'observaciones', None),
                "fecha_captura": getattr(lectura, 'fecha_captura', None) or getattr(lectura, 'created_at', None)
            }
            
            result.append(lectura_dict)
            
        except Exception as e:
            print(f"Error procesando lectura {lectura.id}: {e}")
            # Agregar lectura básica en caso de error
            result.append({
                "id": getattr(lectura, 'id', None),
                "medicion_id": getattr(lectura, 'medicion_id', None),
                "error": f"Error procesando lectura: {str(e)}"
            })
    
    return result

# ✅ ENDPOINT DE DEBUG (temporal para verificar estructura)
@router.get("/debug/estructura")
def debug_estructura_medicion(
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Endpoint temporal para debuguear estructura de mediciones"""
    
    medicion = db.query(MedicionEstacion).first()
    
    if not medicion:
        return {"message": "No hay mediciones en la base de datos"}
    
    # Obtener todos los atributos del objeto
    campos_disponibles = {}
    for attr in dir(medicion):
        if not attr.startswith('_') and not callable(getattr(medicion, attr)):
            try:
                valor = getattr(medicion, attr)
                campos_disponibles[attr] = {
                    "valor": str(valor),
                    "tipo": str(type(valor))
                }
            except:
                campos_disponibles[attr] = "Error al acceder"
    
    return {
        "modelo": "MedicionEstacion",
        "campos_disponibles": campos_disponibles,
        "id_medicion": medicion.id,
        "schema_actual": "MedicionEstacionSimple"
    }