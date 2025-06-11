// utils/constants.js - Constantes del sistema de topografía

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'Sistema de Topografía',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de gestión de proyectos de topografía vial',
};

// Estados de proyecto
export const ESTADOS_PROYECTO = {
  CONFIGURACION: 'CONFIGURACION',
  EN_PROGRESO: 'EN_PROGRESO',
  COMPLETADO: 'COMPLETADO',
  PAUSADO: 'PAUSADO',
  CANCELADO: 'CANCELADO',
};

// Calidades de lectura
export const CALIDADES_LECTURA = {
  BUENA: 'BUENA',
  REGULAR: 'REGULAR',
  MALA: 'MALA',
};

// Clasificaciones de terreno
export const CLASIFICACIONES_TERRENO = {
  CORTE: 'CORTE',
  TERRAPLEN: 'TERRAPLEN',
  BALANCEADO: 'BALANCEADO',
};

// Configuraciones por defecto para proyectos
export const DEFAULTS_PROYECTO = {
  INTERVALO: 5.0, // metros
  ESPESOR: 0.25, // metros
  TOLERANCIA_SCT: 0.005, // metros
  DIVISIONES_IZQUIERDAS: [-12.21, -10.7, -9, -6, -3, -1.3, 0],
  DIVISIONES_DERECHAS: [1.3, 3, 6, 9, 10.7, 12.21],
};

// Límites de validación
export const LIMITES_VALIDACION = {
  KM_MIN: 0,
  KM_MAX: 999999,
  INTERVALO_MIN: 1,
  INTERVALO_MAX: 100,
  ESPESOR_MIN: 0.1,
  ESPESOR_MAX: 1.0,
  TOLERANCIA_MIN: 0.001,
  TOLERANCIA_MAX: 0.05,
  LECTURA_MIRA_MIN: 0,
  LECTURA_MIRA_MAX: 10,
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  OPTIONS: [10, 20, 50, 100],
};

// Configuración de cache
export const CACHE_TIMES = {
  SHORT: 2 * 60 * 1000, // 2 minutos
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 10 * 60 * 1000, // 10 minutos
  VERY_LONG: 30 * 60 * 1000, // 30 minutos
};

// Configuración de timeouts
export const TIMEOUTS = {
  API_REQUEST: 15000, // 15 segundos
  MUTATION: 30000, // 30 segundos
  FILE_UPLOAD: 60000, // 60 segundos
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'Sesión expirada. Inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permisos para esta acción.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  VALIDATION: 'Los datos ingresados no son válidos.',
  SERVER: 'Error del servidor. Intenta más tarde.',
  UNKNOWN: 'Error desconocido. Contacta soporte.',
};

// Configuración de formatos
export const FORMATS = {
  DATE: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
  DECIMAL_PLACES: {
    KM: 3,
    ELEVATION: 6,
    DISTANCE: 3,
    ANGLE: 6,
    VOLUME: 6,
  },
};
