// hooks/useRealTimeProject.js - Hook para sincronización en tiempo real con Supabase
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProyectoSeleccionado } from '../context/ProyectoContext';

export const useRealTimeProject = () => {
  const queryClient = useQueryClient();
  const { proyectoSeleccionado, seleccionarProyecto, actualizarProyectoDesdeSupabase } = useProyectoSeleccionado();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!proyectoSeleccionado?.id) {
      console.log('No hay proyecto seleccionado para tiempo real');
      return;
    }

    const projectId = proyectoSeleccionado.id;
    console.log(`Iniciando suscripción tiempo real para proyecto ${projectId}`);

    // Configurar suscripción de tiempo real
    const channel = supabase
      .channel(`project-updates-${projectId}`, {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proyectos',
          filter: `id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Cambio detectado en proyecto:', payload);
          
          try {
            // Actualizar el proyecto desde Supabase (más confiable)
            await actualizarProyectoDesdeSupabase(projectId);
            
            // Invalidar y refetch inmediatamente para mayor efectividad
            await Promise.all([
              queryClient.invalidateQueries({ 
                queryKey: ['proyecto', projectId] 
              }),
              queryClient.invalidateQueries({ 
                queryKey: ['estaciones', projectId] 
              }),
              queryClient.invalidateQueries({ 
                queryKey: ['mediciones', projectId] 
              }),
              // Forzar refetch inmediato
              queryClient.refetchQueries({ 
                queryKey: ['estaciones', projectId] 
              }),
              queryClient.refetchQueries({ 
                queryKey: ['mediciones', projectId] 
              })
            ]);

            console.log('Proyecto actualizado en tiempo real exitosamente');
            
          } catch (error) {
            console.error('Error actualizando proyecto en tiempo real:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'estaciones_teoricas',
          filter: `proyecto_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Cambio detectado en estaciones:', payload);
          
          // Invalidar solo las estaciones
          await queryClient.invalidateQueries({ 
            queryKey: ['estaciones', projectId] 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'mediciones',
          filter: `proyecto_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Cambio detectado en mediciones:', payload);
          
          // Invalidar mediciones y lecturas relacionadas
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: ['mediciones', projectId] 
            }),
            queryClient.invalidateQueries({ 
              queryKey: ['lecturas'] 
            })
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lecturas'
        },
        async (payload) => {
          console.log('Cambio detectado en lecturas:', payload);
          
          // Invalidar lecturas - esto afectará las gráficas inmediatamente
          await queryClient.invalidateQueries({ 
            queryKey: ['lecturas'] 
          });
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción tiempo real:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Tiempo real activado para proyecto:', projectId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de tiempo real');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Timeout en canal de tiempo real');
        }
      });

    // Guardar referencia para cleanup
    subscriptionRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`Desconectando tiempo real para proyecto ${projectId}`);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };

  }, [proyectoSeleccionado?.id, queryClient, actualizarProyectoDesdeSupabase]);

  // Función manual para forzar actualización
  const forceRefresh = async () => {
    if (!proyectoSeleccionado?.id) return;
    
    console.log('Forzando actualización manual...');
    
    try {
      // Invalidar todas las queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['proyecto', proyectoSeleccionado.id] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['estaciones', proyectoSeleccionado.id] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['mediciones', proyectoSeleccionado.id] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['lecturas'] 
        })
      ]);

      // Refetch forzado
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ['proyecto', proyectoSeleccionado.id] 
        }),
        queryClient.refetchQueries({ 
          queryKey: ['estaciones', proyectoSeleccionado.id] 
        }),
        queryClient.refetchQueries({ 
          queryKey: ['mediciones', proyectoSeleccionado.id] 
        })
      ]);

      console.log('✅ Actualización manual completada');
      
    } catch (error) {
      console.error('❌ Error en actualización manual:', error);
    }
  };

  return {
    isConnected: !!subscriptionRef.current,
    forceRefresh,
    projectId: proyectoSeleccionado?.id
  };
};

export default useRealTimeProject;