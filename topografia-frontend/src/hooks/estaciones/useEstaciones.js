// hooks/estaciones/useEstaciones.js - VERSIÓN CORREGIDA SIN EXPORTS DUPLICADOS
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import { CACHE_TIMES } from '../../utils/constants';

/**
 * HOOK MEJORADO COMPATIBLE CON TU ESTRUCTURA EXISTENTE
 * 
 * Este hook mantiene la misma interfaz que tenías antes pero añade:
 * - Debugging extenso para resolver errores
 * - Manejo robusto de parámetros
 * - Validación de queryKeys
 * - Fallbacks inteligentes
 */

/**
 * Hook principal para obtener estaciones de un proyecto específico.
 * 
 * COMPATIBILIDAD: Mantiene la misma signature que tu código original:
 * useEstaciones(proyectoId, filters)
 */
export const useEstaciones = (proyectoId, filters = {}) => {
  // 🔍 DEBUGGING: Verificar parámetros de entrada
  React.useEffect(() => {
    console.group('🎯 useEstaciones Debug - Estructura Compatible');
    console.log('📋 Parámetros recibidos:', { proyectoId, filters });
    console.log('🔢 proyectoId:', proyectoId, 'tipo:', typeof proyectoId);
    console.log('📊 filters:', filters);
    
    // Verificar estructura de queryKeys
    console.log('🔑 Verificando queryKeys:');
    console.log('- queryKeys disponible:', !!queryKeys);
    console.log('- queryKeys.estacion disponible:', !!queryKeys?.estacion);
    
    if (queryKeys?.estacion) {
      console.log('- Métodos disponibles en queryKeys.estacion:', Object.keys(queryKeys.estacion));
      console.log('- listByProyecto es función:', typeof queryKeys.estacion.listByProyecto === 'function');
      console.log('- list es función:', typeof queryKeys.estacion.list === 'function');
    } else {
      console.error('❌ queryKeys.estacion no está definido');
    }
    
    // Verificar endpoints
    console.log('🌐 Verificando endpoints:');
    console.log('- endpoints disponible:', !!endpoints);
    console.log('- endpoints.estaciones disponible:', !!endpoints?.estaciones);
    
    console.groupEnd();
  }, [proyectoId, filters]);

  // Función para generar query key de manera robusta
  const getQueryKey = () => {
    try {
      // Tu estructura usa listByProyecto para filtrar por proyecto
      if (proyectoId && queryKeys?.estacion?.listByProyecto) {
        const key = queryKeys.estacion.listByProyecto(proyectoId);
        console.log('✅ Query key generada (listByProyecto):', key);
        return key;
      }
      
      // Si no hay proyecto específico, usar lista general
      if (!proyectoId && queryKeys?.estacion?.list) {
        const key = queryKeys.estacion.list(filters);
        console.log('✅ Query key generada (list):', key);
        return key;
      }
      
      // Fallback robusto usando tu estructura conocida
      console.warn('⚠️ Usando fallback para query key');
      if (proyectoId) {
        return [queryKeys.estaciones, 'list', { proyectoId, ...filters }];
      } else {
        return [queryKeys.estaciones, 'list', filters];
      }
      
    } catch (error) {
      console.error('❌ Error generando query key:', error);
      // Fallback final usando strings básicos
      return proyectoId 
        ? ['estaciones', 'byProject', proyectoId, filters]
        : ['estaciones', 'list', filters];
    }
  };

  // Query function robusta compatible con tu estructura
  const queryFn = async () => {
    console.log('🔄 Ejecutando queryFn para estaciones');
    console.log('📍 Parámetros:', { proyectoId, filters });
    
    try {
      let url;
      
      // Tu estructura usa endpoints.estaciones.getByProject
      if (proyectoId && endpoints?.estaciones?.getByProject) {
        url = endpoints.estaciones.getByProject(proyectoId);
        console.log('🌐 URL generada (getByProject):', url);
      } 
      // Fallback a endpoints.estaciones.getAll
      else if (!proyectoId && endpoints?.estaciones?.getAll) {
        url = endpoints.estaciones.getAll();
        console.log('🌐 URL generada (getAll):', url);
      }
      // Fallback manual si endpoints no está disponible
      else {
        url = proyectoId ? `/proyectos/${proyectoId}/estaciones/` : '/estaciones/';
        console.warn('⚠️ Usando URL fallback:', url);
      }
      
      // Añadir filtros a la URL si existen
      if (filters && Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams(filters);
        url = `${url}?${searchParams}`;
        console.log('🔍 URL con filtros:', url);
      }
      
      console.log('📡 Realizando request a:', url);
      const response = await apiClient.get(url);
      
      console.log('✅ Estaciones obtenidas:', {
        cantidad: response?.length || 0,
        muestra: response?.slice(0, 2) || [],
        tipoRespuesta: Array.isArray(response) ? 'array' : typeof response
      });
      
      // Asegurar que siempre retornemos un array
      return Array.isArray(response) ? response : [];
      
    } catch (error) {
      console.error('❌ Error en queryFn de estaciones:', error);
      console.error('- URL intentada:', url);
      console.error('- Parámetros:', { proyectoId, filters });
      throw error;
    }
  };

  // Generar query key
  const queryKey = getQueryKey();
  console.log('🔑 Query key final:', queryKey);

  // Configuración de la query
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: !!proyectoId, // Solo ejecutar si tenemos proyectoId
    staleTime: CACHE_TIMES?.MEDIUM || 5 * 60 * 1000, // 5 minutos
    cacheTime: CACHE_TIMES?.LONG || 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Lógica de retry inteligente
      if (error?.response?.status === 404) return false; // No retry en 404
      if (error?.response?.status >= 400 && error?.response?.status < 500) return false; // No retry en errores de cliente
      return failureCount < 3; // Máximo 3 intentos
    },
    onError: (error) => {
      console.error(`❌ Error en useEstaciones para proyecto ${proyectoId}:`, error);
      console.error('- Query key usada:', queryKey);
      console.error('- Filtros aplicados:', filters);
    },
    onSuccess: (data) => {
      console.log(`✅ useEstaciones exitoso para proyecto ${proyectoId}:`, {
        cantidad: data?.length || 0,
        tieneData: !!data
      });
    },
    // Transformación de datos para asegurar consistencia
    select: (data) => {
      if (!Array.isArray(data)) {
        console.warn('⚠️ Datos recibidos no son un array, convirtiendo:', typeof data);
        return [];
      }
      
      // Normalizar estructura de cada estación
      return data.map(estacion => ({
        ...estacion,
        // Asegurar que campos numéricos sean números
        coordenada_x: parseFloat(estacion.coordenada_x) || 0,
        coordenada_y: parseFloat(estacion.coordenada_y) || 0,
        elevacion: parseFloat(estacion.elevacion) || 0,
        kilometraje: parseFloat(estacion.kilometraje) || 0,
        km: parseFloat(estacion.km) || parseFloat(estacion.kilometraje) || 0, // Compatibilidad
      }));
    }
  });

  // Debug del estado de la query
  React.useEffect(() => {
    console.log('📊 Estado actual de useEstaciones:', {
      proyectoId,
      isLoading: query.isLoading,
      isError: query.isError,
      isSuccess: query.isSuccess,
      dataLength: query.data?.length,
      errorMessage: query.error?.message,
      queryKey: queryKey
    });
  }, [proyectoId, query.isLoading, query.isError, query.isSuccess, query.data?.length, query.error, queryKey]);

  return query;
};

/**
 * Hook para obtener todas las estaciones (manteniendo compatibilidad).
 */
export const useTodasLasEstaciones = (filters = {}) => {
  console.log('🔄 useTodasLasEstaciones llamado con filtros:', filters);
  
  const getQueryKey = () => {
    try {
      if (queryKeys?.estacion?.all) {
        return queryKeys.estacion.all(filters);
      } else {
        return [queryKeys.estaciones, 'all', filters];
      }
    } catch (error) {
      console.warn('⚠️ Error en query key de todas las estaciones, usando fallback');
      return ['estaciones', 'all', filters];
    }
  };

  return useQuery({
    queryKey: getQueryKey(),
    
    queryFn: async () => {
      console.log('🔄 Obteniendo todas las estaciones con filtros:', filters);
      
      try {
        let url;
        
        if (endpoints?.estaciones?.getAll) {
          url = endpoints.estaciones.getAll();
        } else {
          url = '/estaciones/';
          console.warn('⚠️ endpoints.estaciones.getAll no disponible, usando URL manual');
        }
        
        if (filters && Object.keys(filters).length > 0) {
          url = `${url}?${new URLSearchParams(filters)}`;
        }
        
        const response = await apiClient.get(url);
        console.log('✅ Todas las estaciones obtenidas:', response?.length || 0);
        
        return Array.isArray(response) ? response : [];
        
      } catch (error) {
        console.error('❌ Error obteniendo todas las estaciones:', error);
        throw error;
      }
    },
    
    staleTime: CACHE_TIMES?.MEDIUM || 5 * 60 * 1000,
    cacheTime: CACHE_TIMES?.LONG || 10 * 60 * 1000,
    
    onError: (error) => {
      console.error('❌ Error en useTodasLasEstaciones:', error);
    }
  });
};

/**
 * Hook para obtener una estación específica por ID (manteniendo compatibilidad).
 */
export const useEstacion = (estacionId) => {
  console.log('🔄 useEstacion llamado para ID:', estacionId);
  
  const getQueryKey = () => {
    try {
      if (queryKeys?.estacion?.detail) {
        return queryKeys.estacion.detail(estacionId);
      } else {
        return [queryKeys.estaciones, 'detail', estacionId];
      }
    } catch (error) {
      console.warn('⚠️ Error en query key de detalle de estación, usando fallback');
      return ['estaciones', 'detail', estacionId];
    }
  };

  return useQuery({
    queryKey: getQueryKey(),
    
    queryFn: async () => {
      console.log(`🔄 Obteniendo estación ${estacionId}`);
      
      try {
        let url;
        
        if (endpoints?.estaciones?.getById) {
          url = endpoints.estaciones.getById(estacionId);
        } else {
          url = `/estaciones/${estacionId}/`;
          console.warn('⚠️ endpoints.estaciones.getById no disponible, usando URL manual');
        }
        
        const response = await apiClient.get(url);
        console.log(`✅ Estación ${estacionId} obtenida:`, response);
        
        return response;
        
      } catch (error) {
        console.error(`❌ Error obteniendo estación ${estacionId}:`, error);
        throw error;
      }
    },
    
    enabled: !!estacionId,
    staleTime: CACHE_TIMES?.LONG || 10 * 60 * 1000,
    
    onError: (error) => {
      console.error(`❌ Error en useEstacion para ID ${estacionId}:`, error);
    }
  });
};

/**
 * Hook para crear una nueva estación (esqueleto básico).
 */
export const useCreateEstacion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nuevaEstacion) => {
      console.log('🔄 Creando estación:', nuevaEstacion);
      
      let url;
      if (endpoints?.estaciones?.create) {
        url = endpoints.estaciones.create();
      } else {
        url = '/estaciones/';
        console.warn('⚠️ endpoints.estaciones.create no disponible, usando URL manual');
      }
      
      const response = await apiClient.post(url, nuevaEstacion);
      console.log('✅ Estación creada:', response);
      return response;
    },
    
    onSuccess: (data) => {
      console.log('✅ Estación creada exitosamente');
      
      // Invalidar queries relacionadas
      try {
        if (data.proyecto_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.estaciones, 'list', { proyectoId: data.proyecto_id }]
          });
        }
        queryClient.invalidateQueries({ queryKey: [queryKeys.estaciones] });
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de crear estación:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error creando estación:', error);
    }
  });
};

/**
 * Hook para actualizar una estación existente (esqueleto básico).
 */
export const useUpdateEstacion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ estacionId, datosActualizados }) => {
      console.log(`🔄 Actualizando estación ${estacionId}:`, datosActualizados);
      
      let url;
      if (endpoints?.estaciones?.update) {
        url = endpoints.estaciones.update(estacionId);
      } else {
        url = `/estaciones/${estacionId}/`;
        console.warn('⚠️ endpoints.estaciones.update no disponible, usando URL manual');
      }
      
      const response = await apiClient.put(url, datosActualizados);
      console.log(`✅ Estación ${estacionId} actualizada:`, response);
      return response;
    },
    
    onSuccess: (data, variables) => {
      console.log('✅ Estación actualizada exitosamente');
      
      try {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ 
          queryKey: [queryKeys.estaciones, 'detail', variables.estacionId] 
        });
        
        if (data?.proyecto_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.estaciones, 'list', { proyectoId: data.proyecto_id }]
          });
        }
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de actualizar estación:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error actualizando estación:', error);
    }
  });
};

/**
 * Hook para eliminar una estación (esqueleto básico).
 */
export const useDeleteEstacion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (estacionId) => {
      console.log(`🔄 Eliminando estación ${estacionId}`);
      
      let url;
      if (endpoints?.estaciones?.delete) {
        url = endpoints.estaciones.delete(estacionId);
      } else {
        url = `/estaciones/${estacionId}/`;
        console.warn('⚠️ endpoints.estaciones.delete no disponible, usando URL manual');
      }
      
      const response = await apiClient.delete(url);
      console.log(`✅ Estación ${estacionId} eliminada`);
      return response;
    },
    
    onSuccess: (data, estacionId) => {
      console.log('✅ Estación eliminada exitosamente');
      
      try {
        // Invalidar todas las queries de estaciones
        queryClient.invalidateQueries({ queryKey: [queryKeys.estaciones] });
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de eliminar estación:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error eliminando estación:', error);
    }
  });
};

/**
 * Hooks adicionales (esqueletos básicos para mantener compatibilidad).
 */
export const useEstacionesEnRango = (proyectoId, kmInicio, kmFin) => {
  console.log('🔄 useEstacionesEnRango - función placeholder');
  // Implementación básica que retorna el hook principal con filtros
  return useEstaciones(proyectoId, { km_inicio: kmInicio, km_fin: kmFin });
};

export const useEstadisticasEstaciones = (proyectoId) => {
  console.log('🔄 useEstadisticasEstaciones - función placeholder');
  return useQuery({
    queryKey: [queryKeys.estaciones, 'stats', proyectoId],
    queryFn: async () => {
      console.log('📊 Obteniendo estadísticas de estaciones...');
      // Implementación básica
      return { total: 0, activas: 0, inactivas: 0 };
    },
    enabled: !!proyectoId
  });
};

export const useImportarEstaciones = () => {
  console.log('🔄 useImportarEstaciones - función placeholder');
  return useMutation({
    mutationFn: async (data) => {
      console.log('📁 Importando estaciones...');
      return { message: 'Función de importación no implementada' };
    }
  });
};

export const useDuplicarEstacion = () => {
  console.log('🔄 useDuplicarEstacion - función placeholder');
  return useMutation({
    mutationFn: async (data) => {
      console.log('📋 Duplicando estación...');
      return { message: 'Función de duplicación no implementada' };
    }
  });
};

/**
 * Función de diagnóstico para verificar la configuración
 */
export const diagnosticarEstaciones = () => {
  console.group('🔧 Diagnóstico completo de useEstaciones');
  
  // Verificar queryKeys
  console.log('📋 Verificación de queryKeys:');
  console.log('- queryKeys:', !!queryKeys);
  console.log('- queryKeys.estacion:', !!queryKeys?.estacion);
  console.log('- queryKeys.estaciones (string):', queryKeys?.estaciones);
  
  if (queryKeys?.estacion) {
    Object.keys(queryKeys.estacion).forEach(key => {
      console.log(`- queryKeys.estacion.${key}:`, typeof queryKeys.estacion[key]);
    });
  }
  
  // Verificar endpoints
  console.log('🌐 Verificación de endpoints:');
  console.log('- endpoints:', !!endpoints);
  console.log('- endpoints.estaciones:', !!endpoints?.estaciones);
  
  if (endpoints?.estaciones) {
    Object.keys(endpoints.estaciones).forEach(key => {
      console.log(`- endpoints.estaciones.${key}:`, typeof endpoints.estaciones[key]);
    });
  }
  
  // Verificar constantes
  console.log('⚙️ Verificación de constantes:');
  console.log('- CACHE_TIMES:', !!CACHE_TIMES);
  console.log('- CACHE_TIMES.MEDIUM:', CACHE_TIMES?.MEDIUM);
  console.log('- CACHE_TIMES.LONG:', CACHE_TIMES?.LONG);
  
  // Verificar apiClient
  console.log('📡 Verificación de apiClient:');
  console.log('- apiClient:', !!apiClient);
  console.log('- apiClient.get:', typeof apiClient?.get);
  
  console.groupEnd();
};

// Hook para usar el diagnóstico automáticamente en desarrollo
export const useEstacionesDiagnostic = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      diagnosticarEstaciones();
    }
  }, []);
};

/**
 * GUÍA DE USO:
 * 
 * // Usar como antes (mantiene compatibilidad total)
 * const { data: estaciones, isLoading, error } = useEstaciones(proyectoId);
 * 
 * // Con filtros adicionales
 * const { data: estaciones } = useEstaciones(proyectoId, { estado: 'activo' });
 * 
 * // Para diagnóstico en desarrollo
 * useEstacionesDiagnostic(); // Añadir en cualquier componente
 * 
 * // Para diagnóstico manual
 * diagnosticarEstaciones(); // Llamar desde consola
 */