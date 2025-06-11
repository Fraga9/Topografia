from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_supabase_user, CurrentUser
from dependencies import get_current_user_profile
from schemas import usuario as schemas
from models.usuario import PerfilUsuario
import uuid

router = APIRouter()

@router.get("/", response_model=List[schemas.PerfilUsuarioResponse])
def get_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Listar todos los usuarios (solo para administradores o uso interno)"""
    usuarios = db.query(PerfilUsuario).offset(skip).limit(limit).all()
    return usuarios

@router.get("/me", response_model=schemas.PerfilUsuarioResponse)
def get_current_user(
    user_profile: PerfilUsuario = Depends(get_current_user_profile)
):
    """Obtener perfil del usuario actual"""
    return user_profile

@router.get("/{usuario_id}", response_model=schemas.PerfilUsuarioResponse)
def get_usuario(
    usuario_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Obtener usuario específico por ID"""
    usuario = db.query(PerfilUsuario).filter(PerfilUsuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return usuario

@router.post("/", response_model=schemas.PerfilUsuarioResponse)
def create_usuario(
    usuario: schemas.PerfilUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Crear nuevo usuario"""
    # Verificar si el usuario ya existe
    existing_user = db.query(PerfilUsuario).filter(PerfilUsuario.email == usuario.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con este email"
        )
    
    db_usuario = PerfilUsuario(**usuario.dict())
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.put("/{usuario_id}", response_model=schemas.PerfilUsuarioResponse)
def update_usuario(
    usuario_id: uuid.UUID,
    usuario: schemas.PerfilUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Actualizar usuario completo"""
    db_usuario = db.query(PerfilUsuario).filter(PerfilUsuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar permisos (solo el mismo usuario puede actualizarse)
    if str(usuario_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )
    
    update_data = usuario.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_usuario, field, value)
    
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.patch("/{usuario_id}", response_model=schemas.PerfilUsuarioResponse)
def patch_usuario(
    usuario_id: uuid.UUID,
    usuario: schemas.PerfilUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Actualizar usuario parcial"""
    return update_usuario(usuario_id, usuario, db, current_user)

@router.delete("/{usuario_id}")
def delete_usuario(
    usuario_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_supabase_user)
):
    """Eliminar usuario (soft delete)"""
    db_usuario = db.query(PerfilUsuario).filter(PerfilUsuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar permisos
    if str(usuario_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este usuario"
        )
    
    # Soft delete
    db_usuario.activo = False
    db.commit()
    
    return {"message": "Usuario desactivado correctamente"}