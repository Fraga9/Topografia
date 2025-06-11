// hooks/proyectos/index.js - Actualizado con useMisProyectos

// Exportar todos los hooks de useProyectos.js
export {
  useProyectos,
  useProyecto,
  useCreateProyecto,
  useCreateProyectoCompleto,
  useUpdateProyecto,
  useDeleteProyecto,
  useProyectoEstaciones,
  useProyectoMediciones,
  useExportarProyecto,
  proyectoHooks
} from './useProyectos';

// Exportar el nuevo hook para la vista mis_proyectos
export { useMisProyectos, useMisProyectosApi } from './useMisProyectos';

// Export por defecto
export { useProyectos as default } from './useProyectos';