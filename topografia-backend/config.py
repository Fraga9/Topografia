from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación usando Pydantic Settings.
    Esta clase automáticamente lee variables de entorno y proporciona
    valores por defecto sensatos para desarrollo.
    """
    
    # Configuración de base de datos
    database_url: str
    database_password: str = ""
    
    # Configuración de Supabase
    supabase_url: str
    supabase_key: str  # La clave anon/public key
    supabase_jwt_secret: str  # Para validar tokens JWT
    
    # Configuración de la aplicación
    app_name: str = "API Topografía"
    debug: bool = False
    secret_key: str = "dev-secret-key"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Instancia global de configuración
settings = Settings()