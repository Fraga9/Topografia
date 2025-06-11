from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_supabase_user, CurrentUser
from models.usuario import PerfilUsuario
from models.proyecto import Proyecto
import uuid

def get_current_user_profile(
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
) -> PerfilUsuario:
    """
    Obtiene el perfil completo del usuario actual desde la base de datos.
    Si el usuario no existe en la tabla perfiles_usuario, lo crea automáticamente.
    """
    user_profile = db.query(PerfilUsuario).filter(PerfilUsuario.id == current_user.id).first()
    
    if not user_profile:
        # Crear perfil automáticamente si no existe
        user_profile = PerfilUsuario(
            id=uuid.UUID(current_user.id),
            email=current_user.email,
            activo=True
        )
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)
    
    return user_profile

def get_user_project(
    proyecto_id: int,
    current_user: CurrentUser = Depends(get_supabase_user),
    db: Session = Depends(get_db)
) -> Proyecto:
    """
    Obtiene un proyecto específico verificando que pertenezca al usuario actual.
    Esto aprovecha el Row Level Security de Supabase para seguridad adicional.
    """
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == proyecto_id,
        Proyecto.usuario_id == current_user.id
    ).first()
    
    if not proyecto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proyecto {proyecto_id} no encontrado o no tienes permisos para accederlo"
        )
    
    return proyecto