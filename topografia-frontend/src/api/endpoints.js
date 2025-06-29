// api/endpoints.js - Endpoints corregidos para el backend
export const endpoints = {
  // Departamento de Usuarios
  usuarios: {
    getAll: () => '/usuarios/',
    getMe: () => '/usuarios/me',
    getById: (id) => `/usuarios/${id}`,
    create: () => '/usuarios/',
    update: (id) => `/usuarios/${id}`,
    patch: (id) => `/usuarios/${id}`,
    delete: (id) => `/usuarios/${id}`,
  },

  // ✅ CORREGIDO: Departamento de Proyectos con endpoints exactos del backend
  proyectos: {
    // Obtener todos los proyectos (ahora devuelve ProyectoCompleto)
    getAll: () => '/proyectos/',
    
    // Obtener un proyecto específico
    getById: (id) => `/proyectos/${id}`,
    
    // Crear un nuevo proyecto básico
    create: () => '/proyectos/',
    
    // Crear un proyecto completo con estaciones automáticas
    createCompleto: () => '/proyectos/completo/',
    
    // Actualizar completamente un proyecto
    update: (id) => `/proyectos/${id}`,
    
    // Actualizar campos específicos de un proyecto
    patch: (id) => `/proyectos/${id}`,
    
    // Eliminar un proyecto
    delete: (id) => `/proyectos/${id}`,
    
    // ✅ ENDPOINTS ESPECÍFICOS que el backend ya implementa
    getEstaciones: (id) => `/proyectos/${id}/estaciones/`,
    getMediciones: (id) => `/proyectos/${id}/mediciones/`,
    
    // ✅ NUEVO: Endpoint de debug
    getDebug: (id) => `/proyectos/${id}/debug/`,
  },

  // ✅ ACTUALIZADO: Departamento de Estaciones
  estaciones: {
    // Obtener todas las estaciones (filtradas por query params)
    getAll: () => '/estaciones/',
    
    // ✅ ACTUALIZADO: Obtener estaciones por proyecto (usar el endpoint de proyectos)
    getByProject: (proyectoId) => `/proyectos/${proyectoId}/estaciones/`,
    
    // Obtener una estación específica
    getById: (id) => `/estaciones/${id}`,
    
    // Crear una nueva estación teórica
    create: () => '/estaciones/',
    
    // Actualizar completamente una estación
    update: (id) => `/estaciones/${id}`,
    
    // Actualizar campos específicos
    patch: (id) => `/estaciones/${id}`,
    
    // Eliminar una estación teórica
    delete: (id) => `/estaciones/${id}`,
  },

  // ✅ ACTUALIZADO: Departamento de Mediciones
  mediciones: {
    // Obtener todas las mediciones (filtradas por query params)
    getAll: () => '/mediciones/',
    
    // ✅ ACTUALIZADO: Obtener mediciones por proyecto (usar el endpoint de proyectos)
    getByProject: (proyectoId) => `/proyectos/${proyectoId}/mediciones/`,
    
    // Obtener una medición específica
    getById: (id) => `/mediciones/${id}`,
    
    // Crear una nueva medición de campo
    create: () => '/mediciones/',
    
    // Actualizar completamente una medición
    update: (id) => `/mediciones/${id}`,
    
    // Actualizar campos específicos de una medición
    patch: (id) => `/mediciones/${id}`,
    
    // Eliminar una medición
    delete: (id) => `/mediciones/${id}`,
    
    // Obtener todas las lecturas de una medición específica
    getLecturas: (id) => `/mediciones/${id}/lecturas/`,
  },

  // ✅ NUEVO: Departamento de Lecturas (coincide con el backend)
  lecturas: {
    // Obtener todas las lecturas (con filtro opcional por medicion_id)
    getAll: () => '/lecturas/',
    
    // Obtener lecturas filtradas por medición
    getByMedicion: (medicionId) => `/lecturas/?medicion_id=${medicionId}`,
    
    // Obtener una lectura específica
    getById: (id) => `/lecturas/${id}`,
    
    // Crear una nueva lectura
    create: () => '/lecturas/',
    
    // Actualizar completamente una lectura
    update: (id) => `/lecturas/${id}`,
    
    // Actualizar campos específicos de una lectura
    patch: (id) => `/lecturas/${id}`,
    
    // Eliminar una lectura
    delete: (id) => `/lecturas/${id}`,
    
    // Endpoints adicionales para funcionalidades avanzadas (placeholders)
    getWithFilters: (filters) => {
      const params = new URLSearchParams(filters);
      return `/lecturas/?${params.toString()}`;
    },
    
    // Endpoints para operaciones batch
    createBatch: () => '/lecturas/batch/',
    
    // Endpoints para validación y cálculos
    validate: (medicionId) => `/lecturas/validate/${medicionId}`,
    calculateElevations: (medicionId) => `/lecturas/calculate-elevations/${medicionId}`,
    
    // Endpoints para estadísticas y análisis
    getStats: (medicionId) => `/lecturas/stats/${medicionId}`,
    getProfile: (medicionId) => `/lecturas/profile/${medicionId}`,
    getByQuality: (medicionId, calidad) => `/lecturas/quality/${medicionId}?calidad=${calidad}`,
    
    // Endpoints para importación/exportación
    import: (medicionId) => `/lecturas/import/${medicionId}`,
    export: (medicionId) => `/lecturas/export/${medicionId}`,
  },

  // Endpoints de utilidad
  utilidades: {
    health: () => '/health',
    info: () => '/info',
    status: () => '/status',
    authTest: () => '/auth/test',
  }
};

// ✅ FUNCIONES HELPER MEJORADAS
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      searchParams.append(key, params[key]);
    }
  });
  
  return searchParams.toString();
};

// ✅ NUEVO: Helper para debug de endpoints
export const debugEndpoints = (proyectoId) => {
  console.group('🌐 Debug de Endpoints');
  console.log('Proyecto ID:', proyectoId);
  console.log('URL Estaciones:', endpoints.proyectos.getEstaciones(proyectoId));
  console.log('URL Mediciones:', endpoints.proyectos.getMediciones(proyectoId));
  console.log('URL Debug:', endpoints.proyectos.getDebug(proyectoId));
  console.log('URL Estaciones alternativa:', endpoints.estaciones.getByProject(proyectoId));
  console.log('URL Mediciones alternativa:', endpoints.mediciones.getByProject(proyectoId));
  console.log('URL Lecturas por medición:', endpoints.lecturas.getByMedicion(123));
  console.groupEnd();
};