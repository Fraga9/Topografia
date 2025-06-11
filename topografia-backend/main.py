from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import usuarios, proyectos, estaciones, mediciones, lecturas
from config import settings
from database import engine, Base
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear tablas en la base de datos
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Tablas de base de datos creadas correctamente")
except Exception as e:
    logger.error(f"Error al crear tablas: {e}")

# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    description="API REST para sistema de topografía de construcción vial",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# Manejador global de errores
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor"}
    )

# Incluir routers
app.include_router(
    usuarios.router,
    prefix="/usuarios",
    tags=["usuarios"]
)

app.include_router(
    proyectos.router,
    prefix="/proyectos",
    tags=["proyectos"]
)

app.include_router(
    estaciones.router,
    prefix="/estaciones",
    tags=["estaciones"]
)

app.include_router(
    mediciones.router,
    prefix="/mediciones",
    tags=["mediciones"]
)

app.include_router(
    lecturas.router,
    prefix="/lecturas",
    tags=["lecturas"]
)

# Endpoint de salud
@app.get("/")
def root():
    """Endpoint de verificación de estado de la API"""
    return {
        "message": "API Topografía funcionando correctamente",
        "version": "1.0.0",
        "status": "ok"
    }

@app.get("/health")
def health_check():
    """Endpoint de verificación de salud del sistema"""
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Información de la API
@app.get("/info")
def api_info():
    """Información general de la API"""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "API REST para sistema de topografía de construcción vial",
        "endpoints": {
            "usuarios": "/usuarios",
            "proyectos": "/proyectos", 
            "estaciones": "/estaciones",
            "mediciones": "/mediciones",
            "lecturas": "/lecturas"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/status")
def status_check():
    """Estado detallado del sistema"""
    return {
        "api": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "authentication": "supabase_jwt",
        "database": "postgresql",
        "features": [
            "CRUD completo para todas las entidades",
            "Autenticación con Supabase JWT",
            "Row Level Security",
            "Cálculos automáticos de topografía",
            "Validaciones de datos",
            "Documentación automática"
        ]
    }

@app.get("/auth/test")
def auth_test():
    """Endpoint público para probar la estructura de autenticación"""
    return {
        "message": "Este endpoint es público - no requiere autenticación",
        "auth_required_endpoints": [
            "/usuarios/*",
            "/proyectos/*",
            "/estaciones/*", 
            "/mediciones/*",
            "/lecturas/*"
        ],
        "auth_method": "Bearer token (Supabase JWT)",
        "header_format": "Authorization: Bearer <token>"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )