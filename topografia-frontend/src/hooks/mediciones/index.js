// hooks/mediciones/index.js - ÍNDICE CORREGIDO SIN EXPORTS DUPLICADOS

/**
 * ARCHIVO DE ÍNDICE PARA HOOKS DE MEDICIONES
 * 
 * Este archivo actúa como un "directorio central" que exporta todos
 * los hooks relacionados con mediciones, permitiendo importaciones limpias
 * desde otros archivos.
 */

// Importar y re-exportar todos los hooks desde useMediciones.js
export {
  useMediciones,
  useMedicionesPorProyecto,
  useMedicionesPorEstacion,
  useMedicion,
  useCreateMedicion,
  useUpdateMedicion,
  useDeleteMedicion,
  useUltimaMedicion,
  useValidarMedicion,
  useCalcularVolumenes,
  useEstadisticasMediciones,
  useExportarMediciones,
  useDuplicarMedicion,
  diagnosticarMediciones,
  useMedicionesDiagnostic
} from './useMediciones';

// Export por defecto para el hook principal
export { useMediciones as default } from './useMediciones';

/**
 * EJEMPLOS DE USO DE ESTE ÍNDICE:
 * 
 * // Importar hook principal
 * import useMediciones from '../hooks/mediciones';
 * 
 * // Importar hooks específicos
 * import { useMedicion, useCreateMedicion } from '../hooks/mediciones';
 * 
 * // Importar múltiples hooks
 * import { 
 *   useMediciones, 
 *   useMedicionesPorProyecto,
 *   useCreateMedicion, 
 *   useDeleteMedicion 
 * } from '../hooks/mediciones';
 * 
 * // Importar función de diagnóstico
 * import { diagnosticarMediciones } from '../hooks/mediciones';
 * 
 * // Desde DatosDiseno.jsx (mantiene compatibilidad)
 * import { useMediciones, useMedicionesDiagnostic } from '../hooks/mediciones';
 */

/**
 * FUNCIONES DISPONIBLES:
 * 
 * HOOKS PRINCIPALES:
 * - useMediciones: Hook principal que detecta automáticamente la signature
 * - useMedicionesPorProyecto: Específico para mediciones de un proyecto
 * - useMedicionesPorEstacion: Específico para mediciones de una estación
 * - useMedicion: Para obtener una medición específica por ID
 * 
 * HOOKS DE MUTACIÓN:
 * - useCreateMedicion: Para crear nuevas mediciones
 * - useUpdateMedicion: Para actualizar mediciones existentes
 * - useDeleteMedicion: Para eliminar mediciones
 * 
 * HOOKS AUXILIARES:
 * - useUltimaMedicion: Obtiene la última medición de un proyecto
 * - useValidarMedicion: Valida datos de una medición
 * - useCalcularVolumenes: Calcula volúmenes de corte y relleno
 * - useEstadisticasMediciones: Estadísticas de mediciones
 * - useExportarMediciones: Exporta mediciones a diferentes formatos
 * - useDuplicarMedicion: Duplica una medición existente
 * 
 * FUNCIONES DE DIAGNÓSTICO:
 * - diagnosticarMediciones: Función para diagnosticar configuración
 * - useMedicionesDiagnostic: Hook para diagnóstico automático en desarrollo
 */