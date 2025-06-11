// utils/queryKeys.js - El sistema de organización de la información en cache
/**
 * Este sistema de claves es fundamental para el funcionamiento eficiente
 * de TanStack Query. Piensa en cada clave como una etiqueta única que
 * identifica un tipo específico de información en el cache.
 * 
 * La organización jerárquica permite invalidaciones inteligentes.
 * Por ejemplo, cuando se actualiza un proyecto, podemos invalidar
 * automáticamente todas las estaciones, mediciones y lecturas relacionadas.
 */

export const queryKeys = {
  // Claves base para cada entidad principal
  usuarios: 'usuarios',
  proyectos: 'proyectos', 
  estaciones: 'estaciones',
  mediciones: 'mediciones',
  lecturas: 'lecturas',
  
  // Funciones para generar claves específicas de usuarios
  usuario: {
    // Lista de todos los usuarios
    all: () => [queryKeys.usuarios],
    
    // Listas con filtros específicos
    lists: () => [...queryKeys.usuario.all(), 'list'],
    
    // Lista con filtros específicos
    list: (filters) => [...queryKeys.usuario.lists(), { filters }],
    
    // Detalles de un usuario específico
    details: () => [...queryKeys.usuario.all(), 'detail'],
    
    // Detalle de un usuario por ID
    detail: (id) => [...queryKeys.usuario.details(), id],
    
    // Perfil del usuario actual
    me: () => [...queryKeys.usuario.all(), 'me'],
  },

  // Funciones para generar claves específicas de proyectos
  proyecto: {
    // Todos los proyectos
    all: () => [queryKeys.proyectos],
    
    // Listas de proyectos
    lists: () => [...queryKeys.proyecto.all(), 'list'],
    
    // Lista filtrada de proyectos
    list: (filters) => [...queryKeys.proyecto.lists(), { filters }],
    
    // Detalles de proyectos
    details: () => [...queryKeys.proyecto.all(), 'detail'],
    
    // Detalle de un proyecto específico
    detail: (id) => [...queryKeys.proyecto.details(), id],
    
    // Estaciones de un proyecto específico
    estaciones: (id) => [...queryKeys.proyecto.detail(id), 'estaciones'],
    
    // Mediciones de un proyecto específico
    mediciones: (id) => [...queryKeys.proyecto.detail(id), 'mediciones'],
  },

  // Funciones para generar claves específicas de estaciones
  estacion: {
    // Todas las estaciones
    all: () => [queryKeys.estaciones],
    
    // Listas de estaciones
    lists: () => [...queryKeys.estacion.all(), 'list'],
    
    // Lista filtrada por proyecto
    listByProyecto: (proyectoId) => [...queryKeys.estacion.lists(), { proyectoId }],
    
    // Detalles de estaciones
    details: () => [...queryKeys.estacion.all(), 'detail'],
    
    // Detalle de una estación específica
    detail: (id) => [...queryKeys.estacion.details(), id],
  },

  // Funciones para generar claves específicas de mediciones
  medicion: {
    // Todas las mediciones
    all: () => [queryKeys.mediciones],
    
    // Listas de mediciones
    lists: () => [...queryKeys.medicion.all(), 'list'],
    
    // Lista filtrada por proyecto
    listByProyecto: (proyectoId) => [...queryKeys.medicion.lists(), { proyectoId }],
    
    // Lista filtrada por estación
    listByEstacion: (estacionKm, proyectoId) => [...queryKeys.medicion.lists(), { estacionKm, proyectoId }],
    
    // Detalles de mediciones
    details: () => [...queryKeys.medicion.all(), 'detail'],
    
    // Detalle de una medición específica
    detail: (id) => [...queryKeys.medicion.details(), id],
    
    // Lecturas de una medición específica
    lecturas: (id) => [...queryKeys.medicion.detail(id), 'lecturas'],
  },

  // Funciones para generar claves específicas de lecturas
  lectura: {
    // Todas las lecturas
    all: () => [queryKeys.lecturas],
    
    // Listas de lecturas
    lists: () => [...queryKeys.lectura.all(), 'list'],
    
    // Lista filtrada por medición
    listByMedicion: (medicionId) => [...queryKeys.lectura.lists(), { medicionId }],
    
    // Lista con filtros complejos
    listWithFilters: (filters) => [...queryKeys.lectura.lists(), { filters }],
    
    // Detalles de lecturas
    details: () => [...queryKeys.lectura.all(), 'detail'],
    
    // Detalle de una lectura específica
    detail: (id) => [...queryKeys.lectura.details(), id],
  },

  // Claves para utilidades del sistema
  utilidad: {
    // Base para utilidades
    all: () => ['utilidades'],
    
    // Estado de salud del sistema
    health: () => [...queryKeys.utilidad.all(), 'health'],
    
    // Información del sistema
    info: () => [...queryKeys.utilidad.all(), 'info'],
    
    // Estado detallado
    status: () => [...queryKeys.utilidad.all(), 'status'],
  }
};

/**
 * Funciones helper para invalidaciones masivas
 * Estas funciones te permiten invalidar grupos relacionados de datos
 * de manera eficiente cuando algo cambia en el sistema.
 */
export const invalidationHelpers = {
  // Invalidar todo lo relacionado con un proyecto específico
  invalidateProyecto: (queryClient, proyectoId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.detail(proyectoId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.estaciones(proyectoId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.mediciones(proyectoId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.estacion.listByProyecto(proyectoId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicion.listByProyecto(proyectoId) });
  },
  
  // Invalidar todo lo relacionado con una medición específica
  invalidateMedicion: (queryClient, medicionId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicion.detail(medicionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicion.lecturas(medicionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.lectura.listByMedicion(medicionId) });
  },
  
  // Invalidar listas después de crear/actualizar/eliminar
  invalidateLists: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.estacion.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicion.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.lectura.lists() });
  },

  // Invalidar todo después de cambios importantes
  invalidateAll: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.estacion.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicion.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.lectura.all() });
  }
};
