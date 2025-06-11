from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
import os
from pydantic import BaseModel

# Este esquema representa la información del usuario extraída del token JWT de Supabase
class CurrentUser(BaseModel):
    id: str
    email: str
    aud: str = "authenticated"

# Configuración del esquema de autenticación Bearer
security = HTTPBearer()

def get_supabase_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """
    Esta función valida el token JWT de Supabase y extrae la información del usuario.
    Es crucial para que funcione el Row Level Security, ya que Supabase necesita
    conocer qué usuario está haciendo la request para aplicar las políticas correctas.
    
    Args:
        credentials: Token JWT enviado en el header Authorization
        
    Returns:
        CurrentUser: Información del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o ha expirado
    """
    try:
        # Debug: Imprimir información del token para troubleshooting
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        print(f"🔐 DEBUG - JWT Secret configurado: {jwt_secret is not None}")
        print(f"🔐 DEBUG - Token recibido (primeros 50 chars): {credentials.credentials[:50]}...")
        
        # El JWT secret se obtiene de la configuración de tu proyecto Supabase
        # Se encuentra en: Proyecto > Settings > API > JWT Secret
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        print(f"🔐 DEBUG - Token decodificado exitosamente para usuario: {payload.get('email')}")
        
        # Extraer información del usuario del payload del token
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no se pudo extraer ID de usuario"
            )
            
        return CurrentUser(id=user_id, email=email)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}"
        )

# Dependencia opcional para endpoints que pueden funcionar con o sin autenticación
def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[CurrentUser]:
    """
    Versión opcional de get_supabase_user para endpoints públicos que pueden
    beneficiarse de información del usuario si está disponible, pero no la requieren.
    """
    if not credentials:
        return None
    return get_supabase_user(credentials)
