from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_supabase_user, CurrentUser
from schemas import lectura as schemas
from models.lectura import LecturaDivision
from models.medicion import MedicionEstacion
from models.proyecto import Proyecto

router = APIRouter()

def verify_lectura_access(
    lectura_id: int,
    current_user: CurrentUser,
    db: Session
) -> LecturaDivision:
    """Verificar que el usuario tenga acceso a la lectura"""
    lectura = db.query(LecturaDivision).join(
        MedicionEstacion
    ).join(Proyecto).filter(
        LecturaDivision.id == lectura_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not lectura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lectura no encontrada o no tienes permisos para accederla"
        )
    
    return lectura

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

@router.get("/", response_model=List[schemas.LecturaDivisionResponse])
def get_lecturas(
    medicion_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Listar lecturas, opcionalmente filtradas por medición"""
    query = db.query(LecturaDivision).join(
        MedicionEstacion
    ).join(Proyecto).filter(
        Proyecto.usuario_id == current_user.id
    )
    
    if medicion_id:
        query = query.filter(LecturaDivision.medicion_id == medicion_id)
    
    lecturas = query.order_by(LecturaDivision.division_transversal).offset(skip).limit(limit).all()
    return lecturas

@router.get("/{lectura_id}", response_model=schemas.LecturaDivisionResponse)
def get_lectura(
    lectura_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Obtener lectura específica"""
    lectura = verify_lectura_access(lectura_id, current_user, db)
    return lectura

@router.post("/", response_model=schemas.LecturaDivisionResponse)
def create_lectura(
    lectura: schemas.LecturaDivisionCreate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Crear nueva lectura o actualizar existente (UPSERT)"""
    # Verificar que la medición pertenezca al usuario
    medicion = verify_medicion_access(lectura.medicion_id, current_user, db)
    
    # Buscar si ya existe una lectura para esta medición y división
    lectura_existente = db.query(LecturaDivision).filter(
        LecturaDivision.medicion_id == lectura.medicion_id,
        LecturaDivision.division_transversal == lectura.division_transversal
    ).first()
    
    if lectura_existente:
        # Actualizar lectura existente (comportamiento UPSERT)
        lectura_existente.lectura_mira = lectura.lectura_mira
        
        # Recalcular elv_base_real si tenemos la información necesaria
        if medicion.altura_aparato:
            lectura_existente.elv_base_real = medicion.altura_aparato - lectura.lectura_mira
        
        db.commit()
        db.refresh(lectura_existente)
        return lectura_existente
    else:
        # Crear nueva lectura
        db_lectura = LecturaDivision(**lectura.dict())
        
        # Calcular elv_base_real si tenemos la información necesaria
        if medicion.altura_aparato:
            db_lectura.elv_base_real = medicion.altura_aparato - lectura.lectura_mira
        
        try:
            db.add(db_lectura)
            db.commit()
            db.refresh(db_lectura)
            return db_lectura
        except Exception as e:
            db.rollback()
            # Si falla por constraint único, intentar actualizar en su lugar
            if "unique constraint" in str(e).lower() or "duplicate key" in str(e).lower():
                lectura_existente = db.query(LecturaDivision).filter(
                    LecturaDivision.medicion_id == lectura.medicion_id,
                    LecturaDivision.division_transversal == lectura.division_transversal
                ).first()
                
                if lectura_existente:
                    lectura_existente.lectura_mira = lectura.lectura_mira
                    if medicion.altura_aparato:
                        lectura_existente.elv_base_real = medicion.altura_aparato - lectura.lectura_mira
                    db.commit()
                    db.refresh(lectura_existente)
                    return lectura_existente
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creando lectura: {str(e)}"
            )

@router.put("/{lectura_id}", response_model=schemas.LecturaDivisionResponse)
def update_lectura(
    lectura_id: int,
    lectura_update: schemas.LecturaDivisionUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar lectura completa"""
    db_lectura = verify_lectura_access(lectura_id, current_user, db)
    
    update_data = lectura_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_lectura, field, value)
    
    # Recalcular elv_base_real si se actualizó lectura_mira
    if 'lectura_mira' in update_data:
        medicion = db.query(MedicionEstacion).filter(
            MedicionEstacion.id == db_lectura.medicion_id
        ).first()
        
        if medicion and medicion.altura_aparato:
            db_lectura.elv_base_real = medicion.altura_aparato - db_lectura.lectura_mira
    
    db.commit()
    db.refresh(db_lectura)
    return db_lectura

@router.patch("/{lectura_id}", response_model=schemas.LecturaDivisionResponse)
def patch_lectura(
    lectura_id: int,
    lectura_update: schemas.LecturaDivisionUpdate,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Actualizar lectura parcial"""
    return update_lectura(lectura_id, lectura_update, current_user, db)

@router.delete("/{lectura_id}")
def delete_lectura(
    lectura_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
):
    """Eliminar lectura"""
    db_lectura = verify_lectura_access(lectura_id, current_user, db)
    
    db.delete(db_lectura)
    db.commit()
    
    return {"message": "Lectura eliminada correctamente"}