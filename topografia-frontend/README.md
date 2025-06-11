# Sistema de Topografía - Frontend Moderno

Sistema frontend avanzado para gestión de proyectos de topografía vial, desarrollado con **React 19**, **TanStack Query**, **Supabase** y **Tailwind CSS**.

## 🏗️ Arquitectura Moderna

### Bibliotecario Digital - TanStack Query
El corazón del sistema utiliza TanStack Query como un "bibliotecario especializado" que:
- **Gestiona automáticamente el estado del servidor** - Mantiene sincronizados los datos sin esfuerzo manual
- **Cache inteligente** - Almacena datos frecuentemente consultados para mejorar rendimiento
- **Optimistic updates** - Actualiza la UI inmediatamente, revirtiendo si hay errores
- **Background refetching** - Mantiene los datos frescos sin interrumpir al usuario
- **Error boundaries** - Manejo elegante de errores de red y servidor

### Especialistas por Dominio - Hooks Personalizados
Cada entidad del sistema tiene su propio "especialista":

#### 🔐 Hooks de Autenticación (`hooks/auth/`)
- `useAuth()` - Estado general de autenticación
- `useLogin()` - Proceso de inicio de sesión
- `useLogout()` - Cierre de sesión seguro
- `useSignUp()` - Registro de nuevos usuarios

#### 📁 Hooks de Proyectos (`hooks/proyectos/`)
- `useProyectos()` - Lista de proyectos con filtros
- `useProyecto(id)` - Detalles de proyecto específico
- `useCreateProyecto()` - Creación con validaciones
- `useUpdateProyecto()` - Actualización optimista

#### 📍 Hooks de Estaciones (`hooks/estaciones/`)
- `useEstaciones(proyectoId)` - Estaciones por proyecto
- `useEstacion(id)` - Detalle de estación
- `useCreateEstacion()` - Nueva estación con validaciones topográficas
- `useEstacionesEnRango()` - Búsqueda por kilómetros

#### 📏 Hooks de Mediciones (`hooks/mediciones/`)
- `useMediciones(estacionId)` - Mediciones de una estación
- `useCreateMedicion()` - Nueva medición con cálculos automáticos
- `useValidarMedicion()` - Validación contra tolerancias SCT
- `useCalcularVolumenes()` - Cálculo de volúmenes entre secciones

#### 📐 Hooks de Lecturas (`hooks/lecturas/`)
- `useLecturas(medicionId)` - Lecturas de mira
- `useCreateLecturasLote()` - Entrada masiva de datos
- `useCalcularElevaciones()` - Cálculo automático de elevaciones
- `useValidarLecturas()` - Detección de anomalías

## 🔧 Tecnologías Implementadas

### Core Framework
- **React 19** - Última versión con Server Components y nuevas características
- **Vite** - Build tool ultra-rápido para desarrollo
- **React Router DOM** - Navegación declarativa con protección de rutas

### Estado y Datos
- **TanStack Query v5** - Gestión de estado del servidor de última generación
- **Supabase** - Backend-as-a-Service con autenticación JWT
- **Axios** - Cliente HTTP con interceptores automáticos

### UI y Estilos
- **Tailwind CSS** - Framework de utilidades CSS
- **Lucide React** - Iconografía moderna y consistente
- **React Hook Form** - Manejo eficiente de formularios

### Validación y Formateo
- **Date-fns** - Manipulación de fechas
- **Lodash** - Utilidades de JavaScript
- **Validadores personalizados** - Específicos para datos topográficos

## 📂 Estructura del Proyecto

```
src/
├── api/                    # Configuración de API
│   ├── client.js          # Cliente Axios con Supabase
│   └── endpoints.js       # Definición de endpoints
├── context/               # Contextos React
│   ├── AuthContext.jsx    # Gestión de autenticación
│   └── QueryProvider.jsx  # Configuración TanStack Query
├── hooks/                 # Hooks especializados
│   ├── auth/             # Autenticación
│   ├── proyectos/        # Gestión de proyectos
│   ├── estaciones/       # Estaciones topográficas
│   ├── mediciones/       # Mediciones de campo
│   └── lecturas/         # Lecturas de mira
├── services/             # Lógica de negocio
│   ├── authService.js    # Validaciones de auth
│   ├── projectService.js # Lógica de proyectos
│   └── calculationService.js # Cálculos topográficos
├── utils/                # Utilidades
│   ├── constants.js      # Constantes del sistema
│   ├── formatters.js     # Formateo de datos
│   ├── validators.js     # Validaciones
│   └── queryKeys.js      # Claves de cache
└── screens/              # Componentes de página
    ├── Dashboard.jsx     # Panel principal
    ├── Login.jsx         # Autenticación
    └── Layout.jsx        # Layout principal
```

## 🚀 Características Implementadas

### Sistema de Cache Inteligente
```javascript
// Cache automático con invalidación inteligente
const { data: proyectos } = useProyectos({
  staleTime: 5 * 60 * 1000,  // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});

// Invalidación automática al crear
const createProyecto = useCreateProyecto();
createProyecto.mutate(nuevoProyecto, {
  onSuccess: () => {
    // Cache automáticamente invalidado
  }
});
```

### Updates Optimistas
```javascript
const updateEstacion = useUpdateEstacion();

// UI se actualiza inmediatamente
updateEstacion.mutate({ id, datos }, {
  onMutate: async ({ id, datos }) => {
    // UI actualizada instantáneamente
    await queryClient.cancelQueries(['estacion', id]);
    const previous = queryClient.getQueryData(['estacion', id]);
    queryClient.setQueryData(['estacion', id], { ...previous, ...datos });
    return { previous };
  },
  onError: (err, variables, context) => {
    // Revertir en caso de error
    queryClient.setQueryData(['estacion', id], context.previous);
  }
});
```

### Validaciones Topográficas
```javascript
// Validación automática de datos topográficos
const validation = validators.lectura.lecturaMira(valor);
if (!validation.valid) {
  setErrors({ lectura: validation.message });
}

// Detección de anomalías
const anomalias = calculationService.detectAnomalies(lecturas, {
  desviacion_maxima: 2,
  salto_maximo: 1.0
});
```

### Cálculos Automáticos
```javascript
// Cálculo automático de volúmenes
const volumenes = calculationService.calculateVolumeBySimpsons(
  seccion1, seccion2, distancia
);

// Clasificación automática de terreno
const tipo = calculationService.classifyTerrain(areas, 0.1);
```

## 🔑 Configuración

### Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

### Instalación
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build
```

## 🎯 Uso de Hooks

### Ejemplo de Dashboard Moderno
```jsx
import { useProyectos, useAuth } from '../hooks';

const Dashboard = () => {
  const { usuario } = useAuth();
  const { data: proyectos, isLoading, error } = useProyectos();

  // Cálculos automáticos
  const stats = useMemo(() => {
    if (!proyectos) return null;
    return {
      total: proyectos.length,
      activos: proyectos.filter(p => p.estado === 'EN_PROGRESO').length,
      completados: proyectos.filter(p => p.estado === 'COMPLETADO').length
    };
  }, [proyectos]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>Bienvenido, {usuario?.email}</h1>
      <StatsCards stats={stats} />
      <ProyectosList proyectos={proyectos} />
    </div>
  );
};
```

### Ejemplo de Formulario con Validación
```jsx
import { useCreateEstacion } from '../hooks/estaciones';
import { validators } from '../utils/validators';

const NuevaEstacion = ({ proyectoId }) => {
  const [datos, setDatos] = useState({});
  const [errores, setErrores] = useState({});
  const createEstacion = useCreateEstacion();

  const validarFormulario = () => {
    const resultado = validators.formulario(datos, {
      nombre: validators.estacion.nombre,
      km: validators.estacion.km,
      coordenadas: (datos) => validators.estacion.coordenadas(datos.x, datos.y)
    });
    
    setErrores(resultado.errores);
    return resultado.valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      await createEstacion.mutateAsync({ ...datos, proyecto_id: proyectoId });
      // Redirección automática o notificación
    } catch (error) {
      setErrores({ general: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario con validación en tiempo real */}
    </form>
  );
};
```

## 🔄 Flujo de Datos

1. **Usuario interactúa** con componente
2. **Hook especializado** maneja la lógica
3. **TanStack Query** gestiona el estado del servidor
4. **Cache inteligente** optimiza rendimiento
5. **UI se actualiza** automáticamente
6. **Validaciones** aseguran integridad
7. **Cálculos automáticos** procesan datos topográficos

## 🛡️ Características de Seguridad

- **Autenticación JWT** con Supabase
- **Protección de rutas** automática
- **Refresh de tokens** transparente
- **Validación de permisos** por rol
- **Manejo de intentos fallidos** con bloqueo temporal
- **Validación de entrada** en cliente y servidor

## 📊 Optimizaciones de Rendimiento

- **Code splitting** automático con React Router
- **Lazy loading** de componentes pesados
- **Memoización** inteligente con React.memo
- **Cache persistente** con TanStack Query
- **Debouncing** en búsquedas y filtros
- **Paginación** automática para listas grandes

## 🔧 Desarrollo y Testing

### DevTools Incluidos
- **React Query DevTools** - Inspección de cache y queries
- **React Developer Tools** compatible
- **Hot Module Replacement** para desarrollo rápido

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint
```

## 🤝 Contribución

Este sistema implementa patrones modernos de desarrollo React:

1. **Hooks personalizados** para lógica reutilizable
2. **Separación de responsabilidades** clara
3. **Tipado implícito** con JSDoc
4. **Patrones de composición** sobre herencia
5. **Gestión de estado** moderna sin Redux

La arquitectura está diseñada para ser **escalable**, **mantenible** y **performante**, siguiendo las mejores prácticas de la comunidad React y topografía profesional.

---

*Desarrollado con ❤️ para CEMEX - Sistema de Topografía Avanzado v1.0*
