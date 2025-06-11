// hooks/estaciones/index.js - Índice de hooks de estaciones

/**
 * ARCHIVO DE ÍNDICE PARA HOOKS DE ESTACIONES
 * 
 * Este archivo actúa como un "directorio central" que exporta todos
 * los hooks relacionados con estaciones, permitiendo importaciones limpias
 * desde otros archivos.
 */

// Importar todos los hooks desde useEstaciones.js
export {
  useEstaciones,
  useTodasLasEstaciones,
  useEstacion,
  useCreateEstacion,
  useUpdateEstacion,
  useDeleteEstacion,
  useEstacionesEnRango,
  useEstadisticasEstaciones,
  useImportarEstaciones,
  useDuplicarEstacion,
  diagnosticarEstaciones,
  useEstacionesDiagnostic
} from './useEstaciones';

// Export por defecto para el hook principal
export { useEstaciones as default } from './useEstaciones';

/**
 * EJEMPLOS DE USO DE ESTE ÍNDICE:
 * 
 * // Importar hook principal
 * import useEstaciones from '../hooks/estaciones';
 * 
 * // Importar hooks específicos
 * import { useEstacion, useCreateEstacion } from '../hooks/estaciones';
 * 
 * // Importar múltiples hooks
 * import { 
 *   useEstaciones, 
 *   useCreateEstacion, 
 *   useDeleteEstacion 
 * } from '../hooks/estaciones';
 * 
 * // Importar función de diagnóstico
 * import { diagnosticarEstaciones } from '../hooks/estaciones';
 */