// utils/formatters.js - Herramientas para formatear datos de topografía (VERSIÓN MEJORADA)
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FORMATS } from './constants';

/**
 * =========================================================================
 * FUNCIONES SEGURAS DE CONVERSIÓN DE TIPOS (NUEVAS)
 * =========================================================================
 * Estas funciones actúan como "detectores de números" que pueden identificar
 * y convertir números incluso cuando vienen disfrazados como strings o en
 * formatos inesperados.
 */

/**
 * Convierte un valor a número de manera segura.
 * Esta función es como un "detective de números" que puede identificar
 * números incluso cuando vienen disfrazados como strings.
 */
export const safeNumber = (value, defaultValue = 0) => {
  // Si ya es un número válido, lo devolvemos tal como está
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  // Si es un string, intentamos convertirlo
  if (typeof value === 'string') {
    // Limpiamos el string de espacios y caracteres extraños
    const cleaned = value.trim();
    
    // Si el string está vacío, devolvemos el valor por defecto
    if (cleaned === '') {
      return defaultValue;
    }
    
    // Intentamos la conversión
    const parsed = parseFloat(cleaned);
    
    // Si la conversión es exitosa, devolvemos el número
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  // Para cualquier otro caso (null, undefined, objetos, etc.)
  return defaultValue;
};

/**
 * Formatea un número con decimales de manera segura.
 * Combina la conversión segura con el formateo.
 */
export const safeToFixed = (value, decimals = 2, defaultDisplay = '--') => {
  const numberValue = safeNumber(value, null);
  
  // Si el valor se convirtió exitosamente a número, lo formateamos
  if (numberValue !== null && numberValue !== undefined) {
    return numberValue.toFixed(decimals);
  }
  
  // Si no pudimos convertirlo, mostramos el texto por defecto
  return defaultDisplay;
};

/**
 * =========================================================================
 * FUNCIONES EXISTENTES MEJORADAS CON MANEJO ROBUSTO
 * =========================================================================
 */

// Formatear kilómetros con 3 decimales (MEJORADA)
export const formatKm = (value) => {
  return safeToFixed(value, FORMATS?.DECIMAL_PLACES?.KM || 3, '-');
};

// Formatear elevaciones con 6 decimales (MEJORADA)
export const formatElevation = (value) => {
  return safeToFixed(value, FORMATS?.DECIMAL_PLACES?.ELEVATION || 6, '-');
};

// Formatear distancias con 3 decimales (MEJORADA)
export const formatDistance = (value) => {
  return safeToFixed(value, FORMATS?.DECIMAL_PLACES?.DISTANCE || 3, '-');
};

// Formatear ángulos/pendientes con 6 decimales (MEJORADA)
export const formatAngle = (value) => {
  return safeToFixed(value, FORMATS?.DECIMAL_PLACES?.ANGLE || 6, '-');
};

// Formatear volúmenes con 6 decimales (MEJORADA)
export const formatVolume = (value) => {
  return safeToFixed(value, FORMATS?.DECIMAL_PLACES?.VOLUME || 6, '-');
};

// Formatear números con decimales personalizables (MEJORADA)
export const formatNumber = (value, decimals = 2) => {
  return safeToFixed(value, decimals, '-');
};

/**
 * =========================================================================
 * NUEVAS FUNCIONES ESPECIALIZADAS PARA CASOS ESPECÍFICOS
 * =========================================================================
 */

/**
 * Formatea kilómetros específicamente para proyectos de topografía.
 * Esta función entiende las necesidades específicas de tu dominio.
 */
export const formatKilometers = (kmValue, options = {}) => {
  const {
    decimals = 3,
    showUnit = true,
    unit = 'km',
    defaultDisplay = 'No especificado'
  } = options;
  
  const numberValue = safeNumber(kmValue, null);
  
  // Si el valor es 0, lo mostramos como tal (puede ser un punto de inicio válido)
  if (numberValue === 0) {
    return showUnit ? `0.${'0'.repeat(decimals)} ${unit}` : `0.${'0'.repeat(decimals)}`;
  }
  
  // Si no tenemos un valor válido
  if (numberValue === null || numberValue === undefined) {
    return defaultDisplay;
  }
  
  // Formateamos el número
  const formatted = numberValue.toFixed(decimals);
  
  return showUnit ? `${formatted} ${unit}` : formatted;
};

/**
 * Validador y normalizador general para objetos de proyecto.
 * Esta función actúa como un "control de calidad" que verifica
 * que todos los campos importantes estén en el formato correcto.
 */
export const normalizeProyecto = (proyecto) => {
  if (!proyecto || typeof proyecto !== 'object') {
    return {};
  }
  
  return {
    ...proyecto,
    // Normalizamos campos numéricos
    km_inicial: safeNumber(proyecto.km_inicial, 0),
    km_final: safeNumber(proyecto.km_final, 0),
    longitud_total: safeNumber(proyecto.longitud_total, 0),
    
    // Normalizamos strings (eliminamos espacios extra)
    nombre: typeof proyecto.nombre === 'string' ? proyecto.nombre.trim() : '',
    descripcion: typeof proyecto.descripcion === 'string' ? proyecto.descripcion.trim() : '',
    
    // Normalizamos fechas de manera segura
    fecha_inicio: proyecto.fecha_inicio ? safeParseDate(proyecto.fecha_inicio) : null,
    fecha_fin: proyecto.fecha_fin ? safeParseDate(proyecto.fecha_fin) : null,
    fecha_actualizacion: proyecto.fecha_actualizacion ? safeParseDate(proyecto.fecha_actualizacion) : null,
  };
};

/**
 * Hook personalizado para usar con React Query o SWR
 * que automáticamente normaliza los datos de proyectos.
 */
export const useNormalizedProyectos = (proyectos) => {
  if (!Array.isArray(proyectos)) {
    return [];
  }
  
  return proyectos.map(normalizeProyecto);
};

/**
 * =========================================================================
 * FUNCIONES DE FECHA MEJORADAS CON MANEJO ROBUSTO
 * =========================================================================
 */

/**
 * Parsea fechas de manera segura
 */
const safeParseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return parseISO(dateValue);
    if (typeof dateValue === 'number') return new Date(dateValue);
    return null;
  } catch (error) {
    console.warn('Error parseando fecha:', error);
    return null;
  }
};

/**
 * Formatea fechas de manera segura con múltiples opciones
 */
export const safeFormatDate = (dateValue, options = {}) => {
  const {
    locale = es,
    formatString = FORMATS?.DATE || 'dd/MM/yyyy',
    defaultDisplay = 'Fecha no disponible'
  } = options;
  
  const date = safeParseDate(dateValue);
  
  if (!date || isNaN(date.getTime())) {
    return defaultDisplay;
  }
  
  try {
    return format(date, formatString, { locale });
  } catch (error) {
    console.warn('Error formateando fecha:', error);
    return defaultDisplay;
  }
};

// Formatear fecha (MEJORADA)
export const formatDate = (dateString) => {
  return safeFormatDate(dateString, {
    formatString: FORMATS?.DATE || 'dd/MM/yyyy',
    defaultDisplay: '-'
  });
};

// Formatear fecha y hora (MEJORADA)
export const formatDateTime = (dateString) => {
  return safeFormatDate(dateString, {
    formatString: FORMATS?.DATETIME || 'dd/MM/yyyy HH:mm',
    defaultDisplay: '-'
  });
};

// Formatear solo hora (MEJORADA)
export const formatTime = (dateString) => {
  return safeFormatDate(dateString, {
    formatString: FORMATS?.TIME || 'HH:mm',
    defaultDisplay: '-'
  });
};

/**
 * =========================================================================
 * FUNCIONES ESPECÍFICAS DEL DOMINIO (MEJORADAS)
 * =========================================================================
 */

// Formatear estado de proyecto (MEJORADA con más estados)
export const formatEstadoProyecto = (estado) => {
  const estados = {
    'CONFIGURACION': 'Configuración',
    'EN_PROGRESO': 'En Progreso',
    'COMPLETADO': 'Completado',
    'PAUSADO': 'Pausado',
    'CANCELADO': 'Cancelado',
    'PENDIENTE': 'Pendiente',
    'REVISION': 'En Revisión',
    'APROBADO': 'Aprobado'
  };
  return estados[estado] || estado || 'Estado desconocido';
};

// Formatear calidad de lectura (MANTENIDA)
export const formatCalidadLectura = (calidad) => {
  const calidades = {
    'BUENA': 'Buena',
    'REGULAR': 'Regular',
    'MALA': 'Mala',
  };
  return calidades[calidad] || calidad || 'No especificada';
};

// Formatear clasificación de terreno (MANTENIDA)
export const formatClasificacionTerreno = (clasificacion) => {
  const clasificaciones = {
    'CORTE': 'Corte',
    'TERRAPLEN': 'Terraplén',
    'BALANCEADO': 'Balanceado',
  };
  return clasificaciones[clasificacion] || clasificacion || 'No clasificado';
};

// Formatear booleanos de cumplimiento (MEJORADA)
export const formatCumplimiento = (cumple) => {
  if (cumple === null || cumple === undefined) return '-';
  if (typeof cumple === 'string') {
    const lower = cumple.toLowerCase();
    if (lower === 'true' || lower === 'si' || lower === 'sí' || lower === '1') return 'Cumple';
    if (lower === 'false' || lower === 'no' || lower === '0') return 'No cumple';
    return cumple;
  }
  return cumple ? 'Cumple' : 'No cumple';
};

/**
 * =========================================================================
 * VALIDADORES MEJORADOS CON TOLERANCIA A ERRORES
 * =========================================================================
 */

// Validar kilómetro (MEJORADA)
export const validateKm = (value) => {
  const num = safeNumber(value, NaN);
  return !isNaN(num) && num >= 0 && num <= 999999;
};

// Validar elevación (MEJORADA)
export const validateElevation = (value) => {
  const num = safeNumber(value, NaN);
  return !isNaN(num) && num >= -1000 && num <= 10000;
};

// Validar lectura de mira (MEJORADA)
export const validateLecturaMira = (value) => {
  const num = safeNumber(value, NaN);
  return !isNaN(num) && num >= 0 && num <= 10;
};

/**
 * =========================================================================
 * PARSERS MEJORADOS
 * =========================================================================
 */

// Parsear número decimal manteniendo precisión (MEJORADA)
export const parseDecimal = (value, decimals = 3) => {
  const num = safeNumber(value, null);
  return num !== null ? parseFloat(num.toFixed(decimals)) : null;
};

// Parsear fecha desde input date (MEJORADA)
export const parseDate = (dateString) => {
  return safeParseDate(dateString);
};

/**
 * =========================================================================
 * UTILIDADES DE COMPARACIÓN (MANTENIDAS)
 * =========================================================================
 */

// Comparar números con tolerancia
export const compareWithTolerance = (value1, value2, tolerance = 0.001) => {
  const num1 = safeNumber(value1, null);
  const num2 = safeNumber(value2, null);
  
  if (num1 === null || num2 === null) return false;
  
  return Math.abs(num1 - num2) <= tolerance;
};

// Verificar si un valor está dentro de tolerancia SCT
export const verifyToleranceSCT = (valorReal, valorTeorico, tolerancia = 0.005) => {
  const real = safeNumber(valorReal, null);
  const teorico = safeNumber(valorTeorico, null);
  
  if (real === null || teorico === null) return null;
  
  return compareWithTolerance(real, teorico, tolerancia);
};

/**
 * =========================================================================
 * FUNCIONES DE UTILIDAD ADICIONALES
 * =========================================================================
 */

/**
 * Formatea rangos de kilómetros de manera inteligente
 */
export const formatKmRange = (kmInicial, kmFinal, options = {}) => {
  const { 
    decimals = 3, 
    separator = ' - ', 
    unit = 'km',
    defaultDisplay = 'Rango no disponible' 
  } = options;
  
  const inicial = formatKilometers(kmInicial, { decimals, showUnit: false, defaultDisplay: '---' });
  const final = formatKilometers(kmFinal, { decimals, showUnit: false, defaultDisplay: '---' });
  
  if (inicial === '---' && final === '---') {
    return defaultDisplay;
  }
  
  return `${inicial}${separator}${final} ${unit}`;
};

/**
 * Calcula la longitud de un tramo de manera inteligente
 */
export const calculateLength = (kmInicial, kmFinal) => {
  const inicial = safeNumber(kmInicial, null);
  const final = safeNumber(kmFinal, null);
  
  if (inicial === null || final === null || final <= inicial) {
    return null;
  }
  
  return final - inicial;
};

/**
 * Formatea longitudes calculadas
 */
export const formatCalculatedLength = (kmInicial, kmFinal, options = {}) => {
  const length = calculateLength(kmInicial, kmFinal);
  
  if (length === null) {
    return options.defaultDisplay || 'No disponible';
  }
  
  return formatKilometers(length, {
    decimals: options.decimals || 3,
    showUnit: options.showUnit !== false,
    unit: options.unit || 'km'
  });
};

// Alias para mantener compatibilidad con el código existente que espera estas funciones
export { formatKm as formatKmLegacy };
export { formatKilometers as formatKmNew };

/**
 * =========================================================================
 * EJEMPLOS DE USO
 * =========================================================================
 * 
 * // Uso básico
 * formatKilometers("12.345")  // "12.345 km"
 * formatKilometers(null)      // "No especificado"
 * 
 * // Uso con opciones
 * formatKilometers("12.345", { decimals: 2, showUnit: false })  // "12.35"
 * 
 * // Formatear rangos
 * formatKmRange("10.5", "25.8")  // "10.500 - 25.800 km"
 * 
 * // Normalizar proyectos
 * const proyecto = normalizeProyecto(rawProjectData);
 * 
 * // Validar datos
 * if (validateKm(userInput)) {
 *   // procesar input válido
 * }
 */