# Comandos de Prueba para la API de Topografía

## Endpoints Públicos (No requieren autenticación)

### Estado de la API
```bash
curl -X GET "http://127.0.0.1:8000/"
```

### Información detallada del estado
```bash
curl -X GET "http://127.0.0.1:8000/status"
```

### Información de autenticación
```bash
curl -X GET "http://127.0.0.1:8000/auth/test"
```

### Verificación de salud
```bash
curl -X GET "http://127.0.0.1:8000/health"
```

### Información general de la API
```bash
curl -X GET "http://127.0.0.1:8000/info"
```

## Endpoints Protegidos (Requieren token JWT de Supabase)

**Nota:** Reemplaza `<TOKEN>` con un token JWT válido de Supabase.

### Obtener perfil del usuario actual
```bash
curl -X GET "http://127.0.0.1:8000/usuarios/me" \
  -H "Authorization: Bearer <TOKEN>"
```

### Listar proyectos del usuario
```bash
curl -X GET "http://127.0.0.1:8000/proyectos/" \
  -H "Authorization: Bearer <TOKEN>"
```

### Crear un nuevo proyecto
```bash
curl -X POST "http://127.0.0.1:8000/proyectos/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carretera Ejemplo",
    "tramo": "Tramo 1",
    "cuerpo": "A",
    "km_inicial": 1000,
    "km_final": 2000,
    "intervalo": 5.0,
    "espesor": 0.25,
    "tolerancia_sct": 0.005,
    "usuario_id": "00000000-0000-0000-0000-000000000000"
  }'
```

### Crear proyecto completo con estaciones automáticas
```bash
curl -X POST "http://127.0.0.1:8000/proyectos/completo/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Proyecto Completo",
    "tramo": "Tramo 1",
    "cuerpo": "A", 
    "km_inicial": 1000,
    "km_final": 1100,
    "intervalo": 10.0,
    "espesor": 0.25,
    "tolerancia_sct": 0.005,
    "usuario_id": "00000000-0000-0000-0000-000000000000",
    "generar_estaciones": true
  }'
```

### Obtener estaciones de un proyecto
```bash
curl -X GET "http://127.0.0.1:8000/proyectos/1/estaciones/" \
  -H "Authorization: Bearer <TOKEN>"
```

### Crear una medición
```bash
curl -X POST "http://127.0.0.1:8000/mediciones/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "proyecto_id": 1,
    "estacion_km": 1000,
    "bn_altura": 100.500,
    "bn_lectura": 1.234,
    "fecha_medicion": "2024-01-15",
    "operador": "Juan Pérez",
    "condiciones_clima": "Soleado"
  }'
```

### Crear una lectura de división
```bash
curl -X POST "http://127.0.0.1:8000/lecturas/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "medicion_id": 1,
    "division_transversal": -6.0,
    "lectura_mira": 2.345,
    "calidad": "BUENA"
  }'
```

### Listar todas las lecturas de una medición
```bash
curl -X GET "http://127.0.0.1:8000/mediciones/1/lecturas/" \
  -H "Authorization: Bearer <TOKEN>"
```

## Códigos de Respuesta Esperados

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Error en los datos enviados
- **401 Unauthorized**: Token de autenticación faltante o inválido
- **403 Forbidden**: Sin permisos para acceder al recurso
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error interno del servidor

## Cómo Obtener un Token de Supabase

1. **Desde el Frontend**: El token se obtiene automáticamente al autenticar al usuario
2. **Para Pruebas**: Usar la consola de Supabase o herramientas como Postman con Supabase Auth
3. **Desarrollo**: Temporalmente se puede usar un token de servicio (solo para desarrollo)

## Estructura de Respuestas de Error

```json
{
  "detail": "Descripción específica del error"
}
```

## Validaciones Importantes

1. **Proyectos**: `km_final` debe ser mayor que `km_inicial`
2. **Mediciones**: No puede haber dos mediciones en la misma estación km
3. **Estaciones**: No puede haber dos estaciones teóricas en el mismo km
4. **Lecturas**: `lectura_mira` debe ser positiva
5. **Autenticación**: Todos los recursos pertenecen al usuario autenticado

## Campos Calculados Automáticamente

1. **En Mediciones**: `altura_aparato = bn_altura + bn_lectura`
2. **En Proyectos**: `total_estaciones` y `longitud_proyecto`
3. **En Lecturas**: `elv_base_real = altura_aparato - lectura_mira`
