// hooks/lecturas/useLecturas.js - El especialista en gestión de lecturas de mira
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import { CACHE_TIMES, CALIDADES_LECTURA } from '../../utils/constants';

/**
 * Hook para obtener lecturas de una medición específica.
 * 
 * Las lecturas son el nivel más detallado de datos topográficos,
 * representando cada punto individual medido en el terreno.
 */
export const useLecturas = (medicionId, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.lectura.listByMedicion(medicionId, filters),
    
    queryFn: async () => {
      const baseUrl = endpoints.lecturas.getByMedicion(medicionId);
      const url = filters && Object.keys(filters).length > 0 
        ? `${baseUrl}?${new URLSearchParams(filters)}`
        : baseUrl;
      
      return await apiClient.get(url);
    },
    
    enabled: !!medicionId,
    staleTime: CACHE_TIMES.SHORT, // 2 minutos - las lecturas cambian muy frecuentemente
    cacheTime: CACHE_TIMES.MEDIUM, // 5 minutos
    refetchOnWindowFocus: false,
    
    onError: (error) => {
      console.error(`Error obteniendo lecturas de la medición ${medicionId}:`, error);
    }
  });
};

/**
 * Hook para obtener todas las lecturas de una estación.
 * Útil para análisis completos de una estación.
 */
export const useLecturasPorEstacion = (estacionId, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.lectura.byEstacion(estacionId, filters),
    
    queryFn: async () => {
      const baseUrl = endpoints.lecturas.getByEstacion(estacionId);
      const url = filters && Object.keys(filters).length > 0 
        ? `${baseUrl}?${new URLSearchParams(filters)}`
        : baseUrl;
      
      return await apiClient.get(url);
    },
    
    enabled: !!estacionId,
    staleTime: CACHE_TIMES.SHORT,
    cacheTime: CACHE_TIMES.MEDIUM,
    
    onError: (error) => {
      console.error(`Error obteniendo lecturas de la estación ${estacionId}:`, error);
    }
  });
};

/**
 * Hook para obtener una lectura específica por ID.
 */
export const useLectura = (lecturaId) => {
  return useQuery({
    queryKey: queryKeys.lectura.detail(lecturaId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.lecturas.getById(lecturaId));
    },
    
    enabled: !!lecturaId,
    staleTime: CACHE_TIMES.MEDIUM,
    
    onError: (error) => {
      console.error(`Error obteniendo lectura ${lecturaId}:`, error);
    }
  });
};

/**
 * Hook para crear una nueva lectura.
 * 
 * Incluye validaciones automáticas de rango y calidad,
 * y cálculos automáticos de elevaciones.
 */
export const useCreateLectura = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nuevaLectura) => {
      return await apiClient.post(endpoints.lecturas.create(), nuevaLectura);
    },
    
    onSuccess: (data) => {
      // Invalidar lecturas de la medición
      if (data.medicion_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lectura.listByMedicion(data.medicion_id) 
        });
      }
      
      // Invalidar lecturas de la estación
      if (data.estacion_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lectura.byEstacion(data.estacion_id) 
        });
      }
      
      // Agregar al cache de detalles
      queryClient.setQueryData(queryKeys.lectura.detail(data.id), data);
      
      console.log(`Lectura creada: ${data.posicion}m - ${data.lectura_mira}m`);
    },
    
    onError: (error) => {
      console.error('Error creando lectura:', error);
    }
  });
};

/**
 * Hook para crear múltiples lecturas en lote.
 * Optimizado para entrada rápida de datos de campo.
 */
export const useCreateLecturasLote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ medicionId, lecturas }) => {
      return await apiClient.post(endpoints.lecturas.createBatch(), {
        medicion_id: medicionId,
        lecturas
      });
    },
    
    onSuccess: (data, { medicionId }) => {
      // Invalidar todas las lecturas relacionadas
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lectura.listByMedicion(medicionId) 
      });
      
      // Obtener información de la medición para invalidar estación
      const medicion = queryClient.getQueryData(queryKeys.medicion.detail(medicionId));
      if (medicion?.estacion_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lectura.byEstacion(medicion.estacion_id) 
        });
      }
      
      console.log(`${data.created_count} lecturas creadas exitosamente`);
    },
    
    onError: (error) => {
      console.error('Error creando lecturas en lote:', error);
    }
  });
};

/**
 * Hook para actualizar una lectura existente.
 */
export const useUpdateLectura = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ lecturaId, datosActualizados }) => {
      return await apiClient.put(
        endpoints.lecturas.update(lecturaId), 
        datosActualizados
      );
    },
    
    onMutate: async ({ lecturaId, datosActualizados }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: queryKeys.lectura.detail(lecturaId) });
      
      // Snapshot del valor anterior
      const previousLectura = queryClient.getQueryData(queryKeys.lectura.detail(lecturaId));
      
      // Update optimista
      queryClient.setQueryData(queryKeys.lectura.detail(lecturaId), old => ({
        ...old,
        ...datosActualizados,
        fecha_actualizacion: new Date().toISOString()
      }));
      
      return { previousLectura, lecturaId };
    },
    
    onError: (err, variables, context) => {
      // Revertir cambios en caso de error
      if (context?.previousLectura) {
        queryClient.setQueryData(
          queryKeys.lectura.detail(context.lecturaId), 
          context.previousLectura
        );
      }
    },
    
    onSettled: (data, error, { lecturaId }) => {
      // Invalidar para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: queryKeys.lectura.detail(lecturaId) });
      
      // Invalidar listas relacionadas
      if (data?.medicion_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lectura.listByMedicion(data.medicion_id) 
        });
      }
    }
  });
};

/**
 * Hook para eliminar una lectura.
 */
export const useDeleteLectura = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lecturaId) => {
      return await apiClient.delete(endpoints.lecturas.delete(lecturaId));
    },
    
    onMutate: async (lecturaId) => {
      // Obtener datos de la lectura antes de eliminarla
      const lectura = queryClient.getQueryData(queryKeys.lectura.detail(lecturaId));
      return { lectura };
    },
    
    onSuccess: (data, lecturaId, context) => {
      // Remover del cache de detalles
      queryClient.removeQueries({ queryKey: queryKeys.lectura.detail(lecturaId) });
      
      // Invalidar listas relevantes
      if (context?.lectura?.medicion_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lectura.listByMedicion(context.lectura.medicion_id) 
        });
      }
      
      console.log('Lectura eliminada exitosamente');
    },
    
    onError: (error) => {
      console.error('Error eliminando lectura:', error);
    }
  });
};

/**
 * Hook para validar lecturas contra tolerancias.
 * Detecta lecturas fuera de rango o con calidad deficiente.
 */
export const useValidarLecturas = () => {
  return useMutation({
    mutationFn: async ({ medicionId, criteriosValidacion = {} }) => {
      return await apiClient.post(endpoints.lecturas.validate(medicionId), criteriosValidacion);
    },
    
    onSuccess: (data) => {
      console.log('Validación de lecturas completada:', {
        total: data.total_lecturas,
        validas: data.lecturas_validas,
        advertencias: data.advertencias,
        errores: data.errores
      });
    },
    
    onError: (error) => {
      console.error('Error validando lecturas:', error);
    }
  });
};

/**
 * Hook para calcular elevaciones de todas las lecturas de una medición.
 * Actualiza automáticamente las elevaciones calculadas.
 */
export const useCalcularElevaciones = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ medicionId, elevacionInstrumento, configuracion = {} }) => {
      return await apiClient.post(endpoints.lecturas.calculateElevations(medicionId), {
        elevacion_instrumento: elevacionInstrumento,
        configuracion
      });
    },
    
    onSuccess: (data, { medicionId }) => {
      // Invalidar lecturas de la medición para reflejar las nuevas elevaciones
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lectura.listByMedicion(medicionId) 
      });
      
      console.log(`Elevaciones calculadas para ${data.lecturas_actualizadas} lecturas`);
    },
    
    onError: (error) => {
      console.error('Error calculando elevaciones:', error);
    }
  });
};

/**
 * Hook para obtener estadísticas de lecturas.
 * Incluye rangos, promedios, distribución de calidades, etc.
 */
export const useEstadisticasLecturas = (medicionId) => {
  return useQuery({
    queryKey: queryKeys.lectura.stats(medicionId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.lecturas.getStats(medicionId));
    },
    
    enabled: !!medicionId,
    staleTime: CACHE_TIMES.MEDIUM,
    
    onError: (error) => {
      console.error(`Error obteniendo estadísticas de lecturas:`, error);
    }
  });
};

/**
 * Hook para obtener el perfil de terreno de una medición.
 * Genera los datos necesarios para gráficas de perfil.
 */
export const usePerfilTerreno = (medicionId) => {
  return useQuery({
    queryKey: queryKeys.lectura.profile(medicionId),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.lecturas.getProfile(medicionId));
    },
    
    enabled: !!medicionId,
    staleTime: CACHE_TIMES.MEDIUM,
    
    onError: (error) => {
      console.error(`Error obteniendo perfil de terreno:`, error);
    }
  });
};

/**
 * Hook para filtrar lecturas por calidad.
 * Útil para análisis de calidad de datos.
 */
export const useLecturasPorCalidad = (medicionId, calidad = CALIDADES_LECTURA.BUENA) => {
  return useQuery({
    queryKey: queryKeys.lectura.byQuality(medicionId, calidad),
    
    queryFn: async () => {
      return await apiClient.get(endpoints.lecturas.getByQuality(medicionId, calidad));
    },
    
    enabled: !!(medicionId && calidad),
    staleTime: CACHE_TIMES.MEDIUM,
    
    onError: (error) => {
      console.error(`Error obteniendo lecturas de calidad ${calidad}:`, error);
    }
  });
};

/**
 * Hook para exportar lecturas a diferentes formatos.
 */
export const useExportarLecturas = () => {
  return useMutation({
    mutationFn: async ({ medicionId, formato = 'CSV', opciones = {} }) => {
      return await apiClient.post(endpoints.lecturas.export(medicionId), {
        formato,
        opciones
      }, {
        responseType: 'blob'
      });
    },
    
    onSuccess: (data, { formato }) => {
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lecturas.${formato.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log(`Lecturas exportadas en formato ${formato}`);
    },
    
    onError: (error) => {
      console.error('Error exportando lecturas:', error);
    }
  });
};

/**
 * Hook para importar lecturas desde dispositivos de campo.
 * Soporta formatos comunes de estaciones totales.
 */
export const useImportarLecturas = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ medicionId, archivo, formatoDispositivo, opciones = {} }) => {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('formato_dispositivo', formatoDispositivo);
      formData.append('opciones', JSON.stringify(opciones));
      
      return await apiClient.post(
        endpoints.lecturas.import(medicionId), 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    
    onSuccess: (data, { medicionId }) => {
      // Invalidar todas las lecturas de la medición
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lectura.listByMedicion(medicionId) 
      });
      
      console.log(`${data.imported_count} lecturas importadas exitosamente`);
    },
    
    onError: (error) => {
      console.error('Error importando lecturas:', error);
    }
  });
};
