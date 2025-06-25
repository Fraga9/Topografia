// hooks/useRefreshProject.js - Hook para forzar actualización del proyecto actual
import { useQueryClient } from '@tanstack/react-query';
import { useProyectoSeleccionado } from '../context/ProyectoContext';

export const useRefreshProject = () => {
  const queryClient = useQueryClient();
  const { proyectoSeleccionado, actualizarProyectoDesdeSupabase } = useProyectoSeleccionado();

  const refreshCurrentProject = async () => {
    if (!proyectoSeleccionado?.id) {
      console.warn('No hay proyecto seleccionado para actualizar');
      return;
    }

    console.log('🔄 Forzando actualización completa del proyecto...');
    
    try {
      // 1. Actualizar proyecto desde Supabase directamente
      await actualizarProyectoDesdeSupabase(proyectoSeleccionado.id);
      
      // 2. Invalidar todas las queries relacionadas
      await queryClient.invalidateQueries({
        queryKey: ['proyecto', proyectoSeleccionado.id]
      });
      
      // 3. Refetch inmediato si hay queries activas
      await queryClient.refetchQueries({
        queryKey: ['estaciones', proyectoSeleccionado.id]
      });
      
      await queryClient.refetchQueries({
        queryKey: ['mediciones', proyectoSeleccionado.id]
      });

      console.log('✅ Proyecto actualizado completamente');
      
    } catch (error) {
      console.error('❌ Error actualizando proyecto:', error);
    }
  };

  return {
    refreshCurrentProject,
    hasProject: !!proyectoSeleccionado?.id,
    projectId: proyectoSeleccionado?.id
  };
};

export default useRefreshProject;