from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_supabase_user, CurrentUser
from schemas import estacion as schemas
from models.estacion import EstacionTeorica
from models.proyecto import Proyecto

router = APIRouter()

def verify_estacion_access(
    estacion_id: int,
    current_user: CurrentUser,
    db: Session
) -> EstacionTeorica:
    """Verificar que el usuario tenga acceso a la estación"""
    estacion = db.query(EstacionTeorica).join(Proyecto).filter(
        EstacionTeorica.id == estacion_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not estacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estación no encontrada o no tienes permisos para accederla"
        )
    
    return estacion

@router.get("/", response_model=List[schemas.EstacionTeoricaSimple])
def get_estaciones(
    proyecto_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Listar estaciones, opcionalmente filtradas por proyecto"""
    query = db.query(EstacionTeorica).join(Proyecto).filter(
        Proyecto.usuario_id == current_user.id
    )
    
    if proyecto_id:
        query = query.filter(EstacionTeorica.proyecto_id == proyecto_id)
    
    estaciones = query.order_by(EstacionTeorica.km).offset(skip).limit(limit).all()
    return estaciones

@router.get("/{estacion_id}", response_model=schemas.EstacionTeoricaResponse)
def get_estacion(
    estacion_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Obtener estación específica"""
    estacion = verify_estacion_access(estacion_id, current_user, db)
    return estacion

@router.post("/", response_model=schemas.EstacionTeoricaResponse)
def create_estacion(
    estacion: schemas.EstacionTeoricaCreate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Crear nueva estación"""
    # Verificar que el proyecto pertenezca al usuario
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == estacion.proyecto_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not proyecto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado o no tienes permisos"
        )
    
    # Verificar que no exista ya una estación en ese km
    existing = db.query(EstacionTeorica).filter(
        EstacionTeorica.proyecto_id == estacion.proyecto_id,
        EstacionTeorica.km == estacion.km
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una estación en el km {estacion.km}"
        )
    
    db_estacion = EstacionTeorica(**estacion.dict())
    db.add(db_estacion)
    db.commit()
    db.refresh(db_estacion)
    return db_estacion

@router.put("/{estacion_id}", response_model=schemas.EstacionTeoricaResponse)
def update_estacion(
    estacion_id: int,
    estacion_update: schemas.EstacionTeoricaUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar estación completa"""
    db_estacion = verify_estacion_access(estacion_id, current_user, db)
    
    update_data = estacion_update.dict(exclude_unset=True)
    
    # Si se actualiza el km, verificar que no cause conflicto
    if 'km' in update_data:
        existing = db.query(EstacionTeorica).filter(
            EstacionTeorica.proyecto_id == db_estacion.proyecto_id,
            EstacionTeorica.km == update_data['km'],
            EstacionTeorica.id != estacion_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otra estación en el km {update_data['km']}"
            )
    
    for field, value in update_data.items():
        setattr(db_estacion, field, value)
    
    db.commit()
    db.refresh(db_estacion)
    return db_estacion

@router.patch("/{estacion_id}", response_model=schemas.EstacionTeoricaResponse)
def patch_estacion(
    estacion_id: int,
    estacion_update: schemas.EstacionTeoricaUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar estación parcial"""
    return update_estacion(estacion_id, estacion_update, current_user, db)

@router.delete("/{estacion_id}")
def delete_estacion(
    estacion_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Eliminar estación"""
    db_estacion = verify_estacion_access(estacion_id, current_user, db)
    
    db.delete(db_estacion)
    db.commit()
    
    return {"message": "Estación eliminada correctamente"}