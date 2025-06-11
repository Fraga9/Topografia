// utils/unitConversion.js - Sistema inteligente de conversión de unidades

/**
 * SISTEMA INTELIGENTE DE CONVERSIÓN DE UNIDADES
 * 
 * Este módulo resuelve el problema común en topografía donde los datos
 * se almacenan en metros pero necesitan mostrarse en kilómetros.
 * 
 * Detecta automáticamente la unidad más apropiada basándose en el contexto
 * y magnitud de los números.
 */

import { safeNumber } from './formatters';

/**
 * Detecta si un valor está probablemente en metros y debería convertirse a km
 * 
 * Reglas de detección:
 * - Si el valor es >= 1000, probablemente está en metros
 * - Si dos valores están muy cerca en magnitud pero > 1000, probablemente metros
 * - Si la diferencia entre valores es pequeña comparada con su magnitud, metros
 */
export const detectUnits = (value1, value2 = null) => {
  const val1 = safeNumber(value1, 0);
  const val2 = safeNumber(value2, val1);
  
  // Si ambos valores son menores a 1000, probablemente ya están en km
  if (val1 < 1000 && val2 < 1000) {
    return 'km';
  }
  
  // Si ambos valores son >= 1000, probablemente están en metros
  if (val1 >= 1000 && val2 >= 1000) {
    // Verificación adicional: si la diferencia es pequeña relativa al valor
    const diff = Math.abs(val2 - val1);
    const avgValue = (val1 + val2) / 2;
    const relativeDiff = diff / avgValue;
    
    // Si la diferencia relativa es pequeña, definitivamente metros
    if (relativeDiff < 0.1) { // menos del 10% de diferencia
      return 'meters';
    }
    
    return 'meters';
  }
  
  // Caso mixto - usar el valor mayor para decidir
  const maxValue = Math.max(val1, val2);
  return maxValue >= 1000 ? 'meters' : 'km';
};

/**
 * Convierte metros a kilómetros con la precisión apropiada
 */
export const metersToKilometers = (meters, decimals = 3) => {
  const m = safeNumber(meters, null);
  if (m === null) return null;
  
  return parseFloat((m / 1000).toFixed(decimals));
};

/**
 * Convierte kilómetros a metros
 */
export const kilometersToMeters = (kilometers) => {
  const km = safeNumber(kilometers, null);
  if (km === null) return null;
  
  return km * 1000;
};

/**
 * Formatea un valor de distancia detectando automáticamente las unidades
 */
export const formatDistanceAuto = (value, options = {}) => {
  const {
    referenceValue = null, // valor de referencia para detectar unidades
    forceUnit = null, // 'meters', 'km', o null para auto-detect
    decimals = 3,
    showUnit = true,
    defaultDisplay = 'No especificado',
    debugMode = false
  } = options;
  
  const numValue = safeNumber(value, null);
  if (numValue === null) return defaultDisplay;
  
  let detectedUnit = forceUnit;
  let displayValue = numValue;
  let displayUnit = 'km';
  
  // Auto-detectar unidad si no está forzada
  if (!forceUnit) {
    detectedUnit = detectUnits(value, referenceValue);
    
    if (debugMode) {
      console.log(`🔍 Detección de unidades:`, {
        value,
        referenceValue,
        detectedUnit,
        originalValue: numValue
      });
    }
  }
  
  // Convertir según la unidad detectada
  if (detectedUnit === 'meters') {
    displayValue = metersToKilometers(numValue, decimals);
    displayUnit = 'km';
    
    if (debugMode) {
      console.log(`📐 Conversión metros → km:`, {
        original: `${numValue} metros`,
        converted: `${displayValue} km`
      });
    }
  } else {
    // Ya está en km, solo formatear
    displayValue = parseFloat(numValue.toFixed(decimals));
  }
  
  if (displayValue === null) return defaultDisplay;
  
  const formatted = displayValue.toFixed(decimals);
  return showUnit ? `${formatted} ${displayUnit}` : formatted;
};

/**
 * Formatea un rango de distancias con conversión automática
 */
export const formatDistanceRangeAuto = (startValue, endValue, options = {}) => {
  const {
    separator = ' - ',
    forceUnit = null,
    decimals = 3,
    showUnit = true,
    defaultDisplay = 'Rango no disponible',
    debugMode = false
  } = options;
  
  const start = safeNumber(startValue, null);
  const end = safeNumber(endValue, null);
  
  if (start === null && end === null) return defaultDisplay;
  
  // Detectar unidades usando ambos valores
  const detectedUnit = forceUnit || detectUnits(start, end);
  
  if (debugMode) {
    console.group(`🎯 Formateo de rango automático`);
    console.log(`Valores originales:`, { start, end });
    console.log(`Unidad detectada:`, detectedUnit);
  }
  
  const formattedStart = formatDistanceAuto(start, {
    referenceValue: end,
    forceUnit: detectedUnit,
    decimals,
    showUnit: false,
    defaultDisplay: '---',
    debugMode
  });
  
  const formattedEnd = formatDistanceAuto(end, {
    referenceValue: start,
    forceUnit: detectedUnit,
    decimals,
    showUnit: false,
    defaultDisplay: '---',
    debugMode
  });
  
  if (debugMode) {
    console.log(`Valores formateados:`, { formattedStart, formattedEnd });
    console.groupEnd();
  }
  
  const unit = showUnit ? ' km' : '';
  const result = `${formattedStart}${separator}${formattedEnd}${unit}`;
  
  return result;
};

/**
 * Calcula la longitud de un tramo con conversión automática
 */
export const calculateTramLength = (startValue, endValue, options = {}) => {
  const {
    forceUnit = null,
    outputUnit = 'km', // 'km' o 'meters'
    decimals = 3,
    debugMode = false
  } = options;
  
  const start = safeNumber(startValue, null);
  const end = safeNumber(endValue, null);
  
  if (start === null || end === null || end <= start) {
    return null;
  }
  
  // Detectar unidades
  const detectedUnit = forceUnit || detectUnits(start, end);
  
  let startInMeters, endInMeters;
  
  if (detectedUnit === 'meters') {
    startInMeters = start;
    endInMeters = end;
  } else {
    startInMeters = kilometersToMeters(start);
    endInMeters = kilometersToMeters(end);
  }
  
  const lengthInMeters = endInMeters - startInMeters;
  
  if (debugMode) {
    console.log(`📏 Cálculo de longitud:`, {
      original: { start, end },
      detectedUnit,
      inMeters: { start: startInMeters, end: endInMeters },
      lengthInMeters,
      outputUnit
    });
  }
  
  // Convertir al formato de salida deseado
  if (outputUnit === 'km') {
    return metersToKilometers(lengthInMeters, decimals);
  } else {
    return parseFloat(lengthInMeters.toFixed(decimals));
  }
};

/**
 * Formatea la longitud calculada con unidades apropiadas
 */
export const formatCalculatedLength = (startValue, endValue, options = {}) => {
  const {
    showUnit = true,
    decimals = 3,
    defaultDisplay = 'No disponible',
    debugMode = false
  } = options;
  
  const length = calculateTramLength(startValue, endValue, { 
    outputUnit: 'km',
    decimals,
    debugMode
  });
  
  if (length === null) return defaultDisplay;
  
  // Formatear según la magnitud
  let displayValue, unit;
  
  if (length < 1) {
    // Menos de 1 km, mostrar en metros
    displayValue = (length * 1000).toFixed(0);
    unit = 'm';
  } else {
    // 1 km o más, mostrar en km
    displayValue = length.toFixed(decimals);
    unit = 'km';
  }
  
  return showUnit ? `${displayValue} ${unit}` : displayValue;
};

/**
 * Configuración global para forzar unidades en toda la aplicación
 */
export const UNIT_CONFIG = {
  // Forzar interpretación de unidades
  forceInputUnit: null, // null (auto), 'meters', 'km'
  
  // Preferencias de display
  preferredDisplayUnit: 'km',
  defaultDecimals: 3,
  
  // Debug
  enableDebugMode: process.env.NODE_ENV === 'development',
  
  // Thresholds para detección automática
  meterThreshold: 1000, // valores >= a esto se consideran metros
  relativeDifferenceThreshold: 0.1 // 10%
};

/**
 * Función de conveniencia para configurar el comportamiento global
 */
export const configureUnits = (config) => {
  Object.assign(UNIT_CONFIG, config);
};

// Exportar funciones principales para uso directo
export {
  formatDistanceAuto as formatKm,
  formatDistanceRangeAuto as formatKmRange,
  formatCalculatedLength as formatLength
};

/**
 * EJEMPLOS DE USO:
 * 
 * // Auto-detección (recomendado)
 * formatDistanceAuto(78000) // "78.000 km" (detecta metros, convierte)
 * formatDistanceRangeAuto(78000, 78050) // "78.000 - 78.050 km"
 * formatCalculatedLength(78000, 78050) // "50 m" (longitud pequeña en metros)
 * 
 * // Forzar unidades específicas
 * formatDistanceAuto(78, { forceUnit: 'km' }) // "78.000 km"
 * formatDistanceAuto(78000, { forceUnit: 'meters' }) // "78.000 km"
 * 
 * // Con debugging
 * formatDistanceRangeAuto(78000, 78050, { debugMode: true })
 * 
 * // Configuración global
 * configureUnits({ forceInputUnit: 'meters', defaultDecimals: 2 });
 */