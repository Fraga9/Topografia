from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# La URL de base de datos apunta directamente a PostgreSQL de Supabase
# Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada en las variables de entorno")

# Configuración del engine SQLAlchemy
# Importante: pool_pre_ping=True ayuda con conexiones que pueden cerrarse
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    echo=False,  # Cambia a True para debug de SQL queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Generador de sesiones de base de datos. Esta función se usa como dependencia
    en FastAPI para inyectar una sesión de DB en cada endpoint.
    
    El patrón try/finally asegura que la sesión se cierre correctamente
    incluso si ocurre una excepción durante el procesamiento.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()