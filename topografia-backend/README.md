# API FastAPI para Sistema de Topografía

## 📋 Descripción

API REST completa desarrollada con FastAPI para un sistema de topografía de construcción vial. La aplicación maneja proyectos, estaciones teóricas, mediciones de campo y lecturas de divisiones transversales con cálculos automáticos de elevaciones y volúmenes.

## 🚀 Características Principales

- **Autenticación segura** con Supabase JWT tokens
- **Row Level Security** automática a nivel de base de datos
- **CRUD completo** para todas las entidades
- **Cálculos automáticos** de elevaciones y volúmenes
- **Validaciones avanzadas** de datos topográficos
- **Documentación automática** con FastAPI
- **Manejo de errores** robusto
- **Integración completa** con PostgreSQL/Supabase

## 🏗️ Arquitectura

```
topografia-backend/
├── main.py                    # Aplicación FastAPI principal
├── database.py               # Configuración de base de datos
├── auth.py                   # Middleware de autenticación Supabase
├── config.py                 # Configuración centralizada
├── dependencies.py           # Dependencias comunes
├── requirements.txt          # Dependencias del proyecto
├── models/                   # Modelos SQLAlchemy
│   ├── usuario.py
│   ├── proyecto.py
│   ├── estacion.py
│   ├── medicion.py
│   └── lectura.py
├── schemas/                  # Esquemas Pydantic
│   ├── usuario.py
│   ├── proyecto.py
│   ├── estacion.py
│   ├── medicion.py
│   └── lectura.py
└── routers/                  # Routers de endpoints
    ├── usuarios.py
    ├── proyectos.py
    ├── estaciones.py
    ├── mediciones.py
    └── lecturas.py
```

## 🛠️ Instalación y Configuración

### 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
# Configuración de Base de Datos Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Configuración de Supabase Auth
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Configuración de la Aplicación
APP_NAME=API Topografía
DEBUG=false
```

### 3. Ejecutar la Aplicación

```bash
uvicorn main:app --reload
```

La API estará disponible en: http://localhost:8000

## 📚 Documentación

- **Documentación interactiva (Swagger)**: http://localhost:8000/docs
- **Documentación alternativa (ReDoc)**: http://localhost:8000/redoc
- **Schema OpenAPI**: http://localhost:8000/openapi.json

## 🔐 Autenticación

La API utiliza **Supabase Auth** con tokens JWT. Todos los endpoints están protegidos excepto los públicos.

### Endpoints Públicos
- `GET /` - Estado de la API
- `GET /health` - Verificación de salud
- `GET /info` - Información de la API
- `GET /status` - Estado detallado
- `GET /auth/test` - Información de autenticación

### Endpoints Protegidos
Todos los endpoints bajo `/usuarios`, `/proyectos`, `/estaciones`, `/mediciones`, `/lecturas` requieren autenticación.

### Formato de Autenticación
```
Authorization: Bearer <supabase_jwt_token>
```

## 📊 Endpoints de la API

### Usuarios (perfiles_usuario)
- `GET /usuarios/` - Listar usuarios
- `GET /usuarios/me` - Perfil del usuario actual
- `GET /usuarios/{id}` - Obtener usuario específico
- `POST /usuarios/` - Crear usuario
- `PUT /usuarios/{id}` - Actualizar usuario completo
- `PATCH /usuarios/{id}` - Actualizar usuario parcial
- `DELETE /usuarios/{id}` - Eliminar usuario

### Proyectos
- `GET /proyectos/` - Listar proyectos del usuario
- `GET /proyectos/{id}` - Obtener proyecto específico
- `POST /proyectos/` - Crear proyecto
- `POST /proyectos/completo/` - Crear proyecto con estaciones automáticas
- `PUT /proyectos/{id}` - Actualizar proyecto
- `PATCH /proyectos/{id}` - Actualizar proyecto parcial
- `DELETE /proyectos/{id}` - Eliminar proyecto
- `GET /proyectos/{id}/estaciones/` - Estaciones del proyecto
- `GET /proyectos/{id}/mediciones/` - Mediciones del proyecto

### Estaciones Teóricas
- `GET /estaciones/` - Listar estaciones
- `GET /estaciones/{id}` - Obtener estación específica
- `POST /estaciones/` - Crear estación
- `PUT /estaciones/{id}` - Actualizar estación
- `PATCH /estaciones/{id}` - Actualizar estación parcial
- `DELETE /estaciones/{id}` - Eliminar estación

### Mediciones
- `GET /mediciones/` - Listar mediciones
- `GET /mediciones/{id}` - Obtener medición específica
- `POST /mediciones/` - Crear medición
- `PUT /mediciones/{id}` - Actualizar medición
- `PATCH /mediciones/{id}` - Actualizar medición parcial
- `DELETE /mediciones/{id}` - Eliminar medición
- `GET /mediciones/{id}/lecturas/` - Lecturas de la medición

### Lecturas
- `GET /lecturas/` - Listar lecturas
- `GET /lecturas/{id}` - Obtener lectura específica
- `POST /lecturas/` - Crear lectura
- `PUT /lecturas/{id}` - Actualizar lectura
- `PATCH /lecturas/{id}` - Actualizar lectura parcial
- `DELETE /lecturas/{id}` - Eliminar lectura

## 💾 Base de Datos

### Esquema Principal

1. **perfiles_usuario** - Usuarios del sistema
2. **proyectos** - Proyectos de construcción vial
3. **estaciones_teoricas** - Estaciones de diseño teórico
4. **mediciones_estacion** - Mediciones de campo
5. **lecturas_divisiones** - Lecturas en divisiones transversales

### Relaciones
- Usuario → Proyectos (1:N)
- Proyecto → Estaciones (1:N)
- Proyecto → Mediciones (1:N)
- Medición → Lecturas (1:N)

## 🧮 Cálculos Automáticos

### En Mediciones
- **altura_aparato** = `bn_altura + bn_lectura`

### En Lecturas
- **elv_base_real** = `altura_aparato - lectura_mira`
- Validaciones de tolerancias SCT
- Clasificación automática de lecturas
- Cálculo de volúmenes por metro

### En Proyectos
- **total_estaciones** = Calculado automáticamente según intervalo
- **longitud_proyecto** = `km_final - km_inicial`

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en Supabase
- **Validación JWT** en cada request autenticado
- **Políticas de acceso** por usuario
- **Validaciones de datos** en entrada
- **Manejo seguro** de errores

## 🚨 Manejo de Errores

### Códigos de Estado HTTP
- `200` - Operación exitosa
- `201` - Recurso creado
- `400` - Error en datos de entrada
- `401` - No autenticado
- `403` - Sin permisos
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### Formato de Errores
```json
{
  "detail": "Descripción del error"
}
```

## 📝 Ejemplos de Uso

### Crear Proyecto
```bash
curl -X POST "http://localhost:8000/proyectos/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carretera San Miguel - Dolores",
    "tramo": "Frente 3",
    "cuerpo": "A",
    "km_inicial": 78000,
    "km_final": 79000,
    "intervalo": 5.0,
    "espesor": 0.25,
    "tolerancia_sct": 0.005,
    "usuario_id": "uuid-del-usuario"
  }'
```

### Crear Medición
```bash
curl -X POST "http://localhost:8000/mediciones/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "proyecto_id": 1,
    "estacion_km": 78000,
    "bn_altura": 100.500,
    "bn_lectura": 1.234,
    "fecha_medicion": "2024-01-15",
    "operador": "Juan Pérez"
  }'
```

## 🏃‍♂️ Desarrollo

### Ejecutar en Modo Desarrollo
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Ejecutar Tests (cuando estén implementados)
```bash
pytest
```

## 🚀 Despliegue

### Variables de Entorno de Producción
- Configurar `DEBUG=false`
- Usar HTTPS en producción
- Configurar CORS específicos
- Usar secrets seguros para JWT

### Docker (Opcional)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, consulta la documentación automática en `/docs` o revisa los logs de la aplicación.

## 🔧 Estado del Proyecto

✅ **Completado:**
- Estructura completa de la API
- Todos los modelos SQLAlchemy
- Todos los schemas Pydantic
- Todos los routers con CRUD completo
- Autenticación con Supabase
- Documentación automática
- Manejo de errores
- Cálculos automáticos básicos

🚧 **Por Implementar (Futuro):**
- Tests unitarios y de integración
- Cálculos avanzados de volúmenes
- Reportes en PDF
- Validaciones adicionales
- Optimizaciones de rendimiento
- Logs más detallados
