// hooks/proyectos/useProyectos.js - El especialista en gestión de proyectos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryKeys, invalidationHelpers } from '../../utils/queryKeys';

/**
 * Hook para obtener la lista de proyectos del usuario.
 * 
 * Este hook maneja automáticamente:
 * - Loading states mientras se cargan los datos
 * - Error states si algo sale mal
 * - Cache automático para evitar requests innecesarios
 * - Refetch automático cuando es necesario
 * 
 * Piensa en este hook como un asistente que siempre sabe
 * el estado actual de tus proyectos y te mantiene informado
 * de cualquier cambio.
 */
export const useProyectos = (filters = {}) => {
  return useQuery({
    // La clave única que identifica esta query en el cache
    queryKey: queryKeys.proyecto.list(filters),
    
    // La función que realmente obtiene los datos
    queryFn: async () => {
      const url = filters && Object.keys(filters).length > 0 
        ? `${endpoints.proyectos.getAll()}?${new URLSearchParams(filters)}`
        : endpoints.proyectos.getAll();
      
      return await apiClient.get(url);
    },
    
    // Configuraciones específicas para proyectos
    staleTime: 5 * 60 * 1000, // Los datos son "frescos" por 5 minutos
    cacheTime: 10 * 60 * 1000, // Mantener en cache por 10 minutos
    
    // Refetch automático cuando la ventana vuelve a tener foco
    refetchOnWindowFocus: false,
    
    // Reintentar hasta 3 veces si hay error
    retry: 3,
    
    // Función que se ejecuta cuando hay error
    onError: (error) => {
      console.error('Error obteniendo proyectos:', error);
    }
  });
};

/**
 * Hook para obtener un proyecto específico por ID.
 * 
 * Este hook es especialmente útil para páginas de detalle
 * donde necesitas toda la información de un proyecto específico.
 */
export const useProyecto = (proyectoId) => {
  return useQuery({
    queryKey: queryKeys.proyecto.detail(proyectoId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.proyectos.getById(proyectoId));
    },
    
    // Solo ejecutar la query si tenemos un ID válido
    enabled: !!proyectoId,
    
    // Los detalles de proyecto cambian menos frecuentemente
    staleTime: 10 * 60 * 1000, // 10 minutos
    
    onError: (error) => {
      console.error(`Error obteniendo proyecto ${proyectoId}:`, error);
    }
  });
};

/**
 * Hook para crear un nuevo proyecto.
 * 
 * Este hook maneja no solo la creación, sino también la actualización
 * automática del cache para reflejar el nuevo proyecto en la lista.
 * Es como tener un asistente que no solo crea el documento,
 * sino que también actualiza automáticamente todos los archivos relacionados.
 */
export const useCreateProyecto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    // La función que ejecuta la creación
    mutationFn: async (nuevoProyecto) => {
      return await apiClient.post(endpoints.proyectos.create(), nuevoProyecto);
    },
    
    // Qué hacer cuando la creación es exitosa
    onSuccess: (data) => {
      // Invalidar las listas para que se recarguen con el nuevo proyecto
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.lists() });
      
      // Agregar el nuevo proyecto al cache de detalles
      queryClient.setQueryData(queryKeys.proyecto.detail(data.id), data);
      
      console.log('Proyecto creado exitosamente:', data.id);
    },
    
    // Qué hacer si hay error
    onError: (error) => {
      console.error('Error creando proyecto:', error);
    }
  });
};

/**
 * Hook especial para crear un proyecto completo con estaciones automáticas.
 * 
 * Este hook utiliza el endpoint especial que activa la función PostgreSQL
 * para crear automáticamente todas las estaciones teóricas del proyecto.
 * Es como tener un arquitecto que no solo diseña el edificio,
 * sino que también coloca automáticamente todos los puntos de referencia.
 */
export const useCreateProyectoCompleto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (datosProyecto) => {
      return await apiClient.post(endpoints.proyectos.createCompleto(), datosProyecto);
    },
    
    onSuccess: (data) => {
      // Invalidar múltiples caches porque este proyecto incluye estaciones
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.estacion.lists() });
      
      // Cachear tanto el proyecto como sus estaciones
      queryClient.setQueryData(queryKeys.proyecto.detail(data.id), data);
      
      console.log('Proyecto completo creado exitosamente:', data.id);
    },
    
    onError: (error) => {
      console.error('Error creando proyecto completo:', error);
    }
  });
};

/**
 * Hook para actualizar un proyecto existente.
 * 
 * Este hook maneja tanto actualizaciones completas (PUT) como parciales (PATCH).
 * Automáticamente decide qué tipo de actualización usar basándose en los datos.
 */
export const useUpdateProyecto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ proyectoId, datosActualizados, parcial = true }) => {
      const endpoint = parcial 
        ? endpoints.proyectos.patch(proyectoId)
        : endpoints.proyectos.update(proyectoId);
      
      const method = parcial ? 'patch' : 'put';
      
      return await apiClient[method](endpoint, datosActualizados);
    },
    
    onSuccess: (data, variables) => {
      const { proyectoId } = variables;
      
      // Actualizar el cache con los nuevos datos
      queryClient.setQueryData(queryKeys.proyecto.detail(proyectoId), data);
      
      // Invalidar las listas para reflejar cualquier cambio en nombres, estados, etc.
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.lists() });
      
      console.log('Proyecto actualizado exitosamente:', proyectoId);
    },
    
    onError: (error, variables) => {
      console.error(`Error actualizando proyecto ${variables.proyectoId}:`, error);
    }
  });
};

/**
 * Hook para eliminar un proyecto.
 * 
 * Este hook no solo elimina el proyecto, sino que también limpia
 * automáticamente todo el cache relacionado (estaciones, mediciones, lecturas).
 * Es como tener un equipo de limpieza que no solo retira el archivo principal,
 * sino que también elimina todas las copias y referencias relacionadas.
 */
export const useDeleteProyecto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (proyectoId) => {
      return await apiClient.delete(endpoints.proyectos.delete(proyectoId));
    },
    
    onSuccess: (data, proyectoId) => {
      // Remover el proyecto del cache de detalles
      queryClient.removeQueries({ queryKey: queryKeys.proyecto.detail(proyectoId) });
      
      // Invalidar todas las listas y datos relacionados
      invalidationHelpers.invalidateProyecto(queryClient, proyectoId);
      invalidationHelpers.invalidateLists(queryClient);
      
      console.log('Proyecto eliminado exitosamente:', proyectoId);
    },
    
    onError: (error, proyectoId) => {
      console.error(`Error eliminando proyecto ${proyectoId}:`, error);
    }
  });
};

/**
 * Hook para obtener las estaciones de un proyecto.
 */
export const useProyectoEstaciones = (proyectoId) => {
  return useQuery({
    queryKey: queryKeys.proyecto.estaciones(proyectoId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.proyectos.getEstaciones(proyectoId));
    },
    
    enabled: !!proyectoId,
    
    staleTime: 5 * 60 * 1000, // 5 minutos
    
    onError: (error) => {
      console.error(`Error obteniendo estaciones del proyecto ${proyectoId}:`, error);
    }
  });
};

/**
 * Hook para obtener las mediciones de un proyecto.
 */
export const useProyectoMediciones = (proyectoId) => {
  return useQuery({
    queryKey: queryKeys.proyecto.mediciones(proyectoId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.proyectos.getMediciones(proyectoId));
    },
    
    enabled: !!proyectoId,
    
    staleTime: 2 * 60 * 1000, // 2 minutos (más dinámico)
    
    onError: (error) => {
      console.error(`Error obteniendo mediciones del proyecto ${proyectoId}:`, error);
    }
  });
};

/**
 * Hook para exportar proyecto completo.
 * Genera archivos de exportación con todos los datos del proyecto.
 */
export const useExportarProyecto = () => {
  return useMutation({
    mutationFn: async ({ proyectoId, formato = 'pdf', configuracion = {} }) => {
      // Simular exportación - en producción esto llamaría al backend
      return await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url: `#export-${proyectoId}-${Date.now()}`,
            nombre: `proyecto_${proyectoId}_${Date.now()}.${formato}`,
            formato,
            tamaño: '2.5 MB'
          });
        }, 2000);
      });
    },
    
    onSuccess: (data) => {
      console.log('Proyecto exportado exitosamente:', data.nombre);
    },
    
    onError: (error) => {
      console.error('Error exportando proyecto:', error);
    }
  });
};

// Exportar todos los hooks en un objeto para fácil importación
export const proyectoHooks = {
  useProyectos,
  useProyecto,
  useCreateProyecto,
  useCreateProyectoCompleto,
  useUpdateProyecto,
  useDeleteProyecto,
  useProyectoEstaciones,
  useProyectoMediciones,
  useExportarProyecto
};
