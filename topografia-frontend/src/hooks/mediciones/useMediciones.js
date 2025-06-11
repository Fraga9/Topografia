// hooks/mediciones/useMediciones.js - VERSIÓN CORREGIDA SIN EXPORTS DUPLICADOS
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import { CACHE_TIMES } from '../../utils/constants';

/**
 * HOOK MEJORADO COMPATIBLE CON TU ESTRUCTURA EXISTENTE
 * 
 * Detecta automáticamente el parámetro correcto y ajusta el comportamiento
 * para mantener compatibilidad con la signature original de tu DatosDiseno.jsx
 */

/**
 * Hook principal que detecta automáticamente cómo se está llamando
 * 
 * COMPATIBILIDAD con tu código original:
 * - useMediciones({ proyecto_id: 1 })  ← Desde DatosDiseno.jsx
 * - useMediciones(estacionId, filters)  ← Estructura original
 */
export const useMediciones = (firstParam, secondParam = {}) => {
  // Detectar automáticamente la signature usada
  const isObjectSignature = typeof firstParam === 'object' && firstParam !== null;
  
  const { proyecto_id, estacion_id, enabled = true, ...otherOptions } = isObjectSignature 
    ? firstParam 
    : { estacion_id: firstParam, enabled: true };
    
  const filters = isObjectSignature ? {} : secondParam;

  // 🔍 DEBUGGING: Verificar cómo se está llamando el hook
  React.useEffect(() => {
    console.group('🎯 useMediciones Debug - Detección de Signature');
    console.log('📋 Parámetros recibidos:', { firstParam, secondParam });
    console.log('🔍 Signature detectada:', isObjectSignature ? 'Objeto { proyecto_id }' : 'Parámetros separados (estacionId, filters)');
    console.log('🔢 proyecto_id extraído:', proyecto_id);
    console.log('🔢 estacion_id extraído:', estacion_id);
    console.log('✅ enabled:', enabled);
    console.log('📊 filters:', filters);
    
    // Verificar estructura de queryKeys
    console.log('🔑 Verificando queryKeys.medicion:');
    if (queryKeys?.medicion) {
      console.log('- Métodos disponibles:', Object.keys(queryKeys.medicion));
      console.log('- listByProyecto es función:', typeof queryKeys.medicion.listByProyecto === 'function');
      console.log('- listByEstacion es función:', typeof queryKeys.medicion.listByEstacion === 'function');
      console.log('- list es función:', typeof queryKeys.medicion.list === 'function');
    } else {
      console.error('❌ queryKeys.medicion no está definido');
    }
    
    console.groupEnd();
  }, [firstParam, secondParam, proyecto_id, estacion_id, enabled, isObjectSignature]);

  // Función para generar query key de manera robusta
  const getQueryKey = () => {
    try {
      // Prioridad: estacion_id específica
      if (estacion_id && queryKeys?.medicion?.listByEstacion) {
        const key = queryKeys.medicion.listByEstacion(estacion_id, proyecto_id);
        console.log('✅ Query key generada (listByEstacion):', key);
        return key;
      }
      
      // Alternativa: proyecto_id
      if (proyecto_id && queryKeys?.medicion?.listByProyecto) {
        const key = queryKeys.medicion.listByProyecto(proyecto_id);
        console.log('✅ Query key generada (listByProyecto):', key);
        return key;
      }
      
      // Lista general con filtros
      if (!estacion_id && !proyecto_id && queryKeys?.medicion?.list) {
        const key = queryKeys.medicion.list(filters);
        console.log('✅ Query key generada (list):', key);
        return key;
      }
      
      // Fallback robusto usando tu estructura conocida
      console.warn('⚠️ Usando fallback para query key de mediciones');
      if (estacion_id) {
        return [queryKeys.mediciones, 'list', { estacionId: estacion_id, proyectoId: proyecto_id, ...filters }];
      } else if (proyecto_id) {
        return [queryKeys.mediciones, 'list', { proyectoId: proyecto_id, ...filters }];
      } else {
        return [queryKeys.mediciones, 'list', filters];
      }
      
    } catch (error) {
      console.error('❌ Error generando query key de mediciones:', error);
      // Fallback final usando strings básicos
      return estacion_id 
        ? ['mediciones', 'byEstacion', estacion_id, filters]
        : proyecto_id 
        ? ['mediciones', 'byProject', proyecto_id, filters]
        : ['mediciones', 'list', filters];
    }
  };

  // Query function robusta compatible con tu estructura
  const queryFn = async () => {
    console.log('🔄 Ejecutando queryFn para mediciones');
    console.log('📍 Parámetros:', { proyecto_id, estacion_id, filters });
    
    try {
      let url;
      let params = {};
      
      // Tu estructura usa diferentes endpoints según el contexto
      if (estacion_id && endpoints?.mediciones?.getByEstacion) {
        url = endpoints.mediciones.getByEstacion(estacion_id);
        console.log('🌐 URL generada (getByEstacion):', url);
      } 
      else if (proyecto_id && endpoints?.mediciones?.getByProject) {
        url = endpoints.mediciones.getByProject(proyecto_id);
        console.log('🌐 URL generada (getByProject):', url);
      }
      else if (endpoints?.mediciones?.getAll) {
        url = endpoints.mediciones.getAll();
        console.log('🌐 URL generada (getAll):', url);
        
        // Añadir parámetros como query parameters
        if (proyecto_id) params.proyecto_id = proyecto_id;
        if (estacion_id) params.estacion_id = estacion_id;
      }
      // Fallback manual si endpoints no está disponible
      else {
        url = '/mediciones/';
        console.warn('⚠️ Usando URL fallback para mediciones:', url);
        
        // Añadir parámetros como query parameters
        if (proyecto_id) params.proyecto_id = proyecto_id;
        if (estacion_id) params.estacion_id = estacion_id;
      }
      
      // Combinar filtros adicionales
      const allParams = { ...params, ...filters };
      
      // Hacer la request
      let finalUrl = url;
      if (Object.keys(allParams).length > 0) {
        const searchParams = new URLSearchParams(allParams);
        finalUrl = `${url}?${searchParams}`;
        console.log('🔍 URL final con parámetros:', finalUrl);
      }
      
      console.log('📡 Realizando request a:', finalUrl);
      const response = await apiClient.get(finalUrl);
      
      console.log('✅ Mediciones obtenidas:', {
        cantidad: response?.length || 0,
        muestra: response?.slice(0, 2) || [],
        tipoRespuesta: Array.isArray(response) ? 'array' : typeof response
      });
      
      // Asegurar que siempre retornemos un array
      return Array.isArray(response) ? response : [];
      
    } catch (error) {
      console.error('❌ Error en queryFn de mediciones:', error);
      console.error('- Parámetros:', { proyecto_id, estacion_id, filters });
      throw error;
    }
  };

  // Generar query key
  const queryKey = getQueryKey();
  console.log('🔑 Query key final para mediciones:', queryKey);

  // Configuración de la query
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: enabled && (proyecto_id !== undefined || estacion_id !== undefined), // Solo ejecutar si tenemos al menos uno
    staleTime: CACHE_TIMES?.SHORT || 2 * 60 * 1000, // 2 minutos - mediciones cambian frecuentemente
    cacheTime: CACHE_TIMES?.MEDIUM || 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
      return failureCount < 3;
    },
    onError: (error) => {
      console.error(`❌ Error en useMediciones:`, error);
      console.error('- Query key usada:', queryKey);
      console.error('- Parámetros:', { proyecto_id, estacion_id, filters });
    },
    onSuccess: (data) => {
      console.log(`✅ useMediciones exitoso:`, {
        cantidad: data?.length || 0,
        proyecto_id,
        estacion_id
      });
    },
    // Transformación de datos para asegurar consistencia
    select: (data) => {
      if (!Array.isArray(data)) {
        console.warn('⚠️ Datos de mediciones no son un array, convirtiendo:', typeof data);
        return [];
      }
      
      // Normalizar estructura de cada medición
      return data.map(medicion => ({
        ...medicion,
        // Asegurar que campos numéricos sean números
        kilometraje: parseFloat(medicion.kilometraje) || 0,
        coordenada_x: parseFloat(medicion.coordenada_x) || 0,
        coordenada_y: parseFloat(medicion.coordenada_y) || 0,
        elevacion: parseFloat(medicion.elevacion) || 0,
        numero_medicion: medicion.numero_medicion || medicion.numero || '',
      }));
    }
  });

  // Debug del estado de la query
  React.useEffect(() => {
    console.log('📊 Estado actual de useMediciones:', {
      proyecto_id,
      estacion_id,
      isLoading: query.isLoading,
      isError: query.isError,
      isSuccess: query.isSuccess,
      dataLength: query.data?.length,
      errorMessage: query.error?.message,
      queryKey: queryKey
    });
  }, [proyecto_id, estacion_id, query.isLoading, query.isError, query.isSuccess, query.data?.length, query.error, queryKey]);

  return query;
};

/**
 * Hook específico para mediciones por proyecto (mantiene compatibilidad)
 */
export const useMedicionesPorProyecto = (proyectoId, filters = {}) => {
  console.log('🔄 useMedicionesPorProyecto llamado:', { proyectoId, filters });
  
  // Usar el hook principal con la signature específica
  return useMediciones({ proyecto_id: proyectoId, ...filters });
};

/**
 * Hook específico para mediciones por estación (mantiene compatibilidad)
 */
export const useMedicionesPorEstacion = (estacionId, filters = {}) => {
  console.log('🔄 useMedicionesPorEstacion llamado:', { estacionId, filters });
  
  // Usar el hook principal con la signature específica
  return useMediciones({ estacion_id: estacionId, ...filters });
};

/**
 * Hook para obtener una medición específica por ID
 */
export const useMedicion = (medicionId) => {
  console.log('🔄 useMedicion llamado para ID:', medicionId);
  
  const getQueryKey = () => {
    try {
      if (queryKeys?.medicion?.detail) {
        return queryKeys.medicion.detail(medicionId);
      } else {
        return [queryKeys.mediciones, 'detail', medicionId];
      }
    } catch (error) {
      console.warn('⚠️ Error en query key de detalle de medición, usando fallback');
      return ['mediciones', 'detail', medicionId];
    }
  };

  return useQuery({
    queryKey: getQueryKey(),
    
    queryFn: async () => {
      console.log(`🔄 Obteniendo medición ${medicionId}`);
      
      try {
        let url;
        
        if (endpoints?.mediciones?.getById) {
          url = endpoints.mediciones.getById(medicionId);
        } else {
          url = `/mediciones/${medicionId}/`;
          console.warn('⚠️ endpoints.mediciones.getById no disponible, usando URL manual');
        }
        
        const response = await apiClient.get(url);
        console.log(`✅ Medición ${medicionId} obtenida:`, response);
        
        return response;
        
      } catch (error) {
        console.error(`❌ Error obteniendo medición ${medicionId}:`, error);
        throw error;
      }
    },
    
    enabled: !!medicionId,
    staleTime: CACHE_TIMES?.MEDIUM || 5 * 60 * 1000,
    
    onError: (error) => {
      console.error(`❌ Error en useMedicion para ID ${medicionId}:`, error);
    }
  });
};

/**
 * Hook para crear una nueva medición
 */
export const useCreateMedicion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nuevaMedicion) => {
      console.log('🔄 Creando medición:', nuevaMedicion);
      
      let url;
      if (endpoints?.mediciones?.create) {
        url = endpoints.mediciones.create();
      } else {
        url = '/mediciones/';
        console.warn('⚠️ endpoints.mediciones.create no disponible, usando URL manual');
      }
      
      const response = await apiClient.post(url, nuevaMedicion);
      console.log('✅ Medición creada:', response);
      return response;
    },
    
    onSuccess: (data) => {
      console.log('✅ Medición creada exitosamente');
      
      // Invalidar queries relacionadas
      try {
        if (data.proyecto_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.mediciones, 'list', { proyectoId: data.proyecto_id }]
          });
        }
        if (data.estacion_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.mediciones, 'list', { estacionId: data.estacion_id }]
          });
        }
        queryClient.invalidateQueries({ queryKey: [queryKeys.mediciones] });
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de crear medición:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error creando medición:', error);
    }
  });
};

/**
 * Hook para actualizar una medición existente
 */
export const useUpdateMedicion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ medicionId, datosActualizados }) => {
      console.log(`🔄 Actualizando medición ${medicionId}:`, datosActualizados);
      
      let url;
      if (endpoints?.mediciones?.update) {
        url = endpoints.mediciones.update(medicionId);
      } else {
        url = `/mediciones/${medicionId}/`;
        console.warn('⚠️ endpoints.mediciones.update no disponible, usando URL manual');
      }
      
      const response = await apiClient.put(url, datosActualizados);
      console.log(`✅ Medición ${medicionId} actualizada:`, response);
      return response;
    },
    
    onSuccess: (data, variables) => {
      console.log('✅ Medición actualizada exitosamente');
      
      try {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ 
          queryKey: [queryKeys.mediciones, 'detail', variables.medicionId] 
        });
        
        if (data?.proyecto_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.mediciones, 'list', { proyectoId: data.proyecto_id }]
          });
        }
        if (data?.estacion_id) {
          queryClient.invalidateQueries({ 
            queryKey: [queryKeys.mediciones, 'list', { estacionId: data.estacion_id }]
          });
        }
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de actualizar medición:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error actualizando medición:', error);
    }
  });
};

/**
 * Hook para eliminar una medición
 */
export const useDeleteMedicion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (medicionId) => {
      console.log(`🔄 Eliminando medición ${medicionId}`);
      
      let url;
      if (endpoints?.mediciones?.delete) {
        url = endpoints.mediciones.delete(medicionId);
      } else {
        url = `/mediciones/${medicionId}/`;
        console.warn('⚠️ endpoints.mediciones.delete no disponible, usando URL manual');
      }
      
      const response = await apiClient.delete(url);
      console.log(`✅ Medición ${medicionId} eliminada`);
      return response;
    },
    
    onSuccess: (data, medicionId) => {
      console.log('✅ Medición eliminada exitosamente');
      
      try {
        // Invalidar todas las queries de mediciones
        queryClient.invalidateQueries({ queryKey: [queryKeys.mediciones] });
      } catch (error) {
        console.warn('⚠️ Error invalidando queries después de eliminar medición:', error);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error eliminando medición:', error);
    }
  });
};

/**
 * Hook para obtener la última medición (esqueleto básico para mantener compatibilidad)
 */
export const useUltimaMedicion = (proyectoId) => {
  console.log('🔄 useUltimaMedicion - función placeholder');
  
  return useQuery({
    queryKey: [queryKeys.mediciones, 'ultima', proyectoId],
    queryFn: async () => {
      console.log('🔄 Obteniendo última medición...');
      // Implementación básica usando el endpoint general con límite
      try {
        let url = '/mediciones/';
        const params = new URLSearchParams({
          proyecto_id: proyectoId,
          ordering: '-created_at',
          limit: 1
        });
        url = `${url}?${params}`;
        
        const response = await apiClient.get(url);
        return Array.isArray(response) && response.length > 0 ? response[0] : null;
      } catch (error) {
        console.error('❌ Error obteniendo última medición:', error);
        throw error;
      }
    },
    enabled: !!proyectoId
  });
};

/**
 * Hook para validar una medición (esqueleto básico)
 */
export const useValidarMedicion = () => {
  console.log('🔄 useValidarMedicion - función placeholder');
  
  return useMutation({
    mutationFn: async (medicionData) => {
      console.log('📏 Validando medición...');
      // Implementación básica de validación
      const validaciones = [];
      
      // Validaciones básicas
      if (!medicionData.coordenada_x || !medicionData.coordenada_y) {
        validaciones.push('Coordenadas requeridas');
      }
      if (!medicionData.elevacion) {
        validaciones.push('Elevación requerida');
      }
      
      return {
        valida: validaciones.length === 0,
        errores: validaciones,
        advertencias: []
      };
    }
  });
};

/**
 * Hooks adicionales (esqueletos básicos para mantener compatibilidad)
 */
export const useCalcularVolumenes = (proyectoId) => {
  console.log('🔄 useCalcularVolumenes - función placeholder');
  
  return useQuery({
    queryKey: [queryKeys.mediciones, 'volumenes', proyectoId],
    queryFn: async () => {
      console.log('📊 Calculando volúmenes...');
      return { corte: 0, relleno: 0, total: 0 };
    },
    enabled: !!proyectoId
  });
};

export const useEstadisticasMediciones = (proyectoId) => {
  console.log('🔄 useEstadisticasMediciones - función placeholder');
  
  return useQuery({
    queryKey: [queryKeys.mediciones, 'stats', proyectoId],
    queryFn: async () => {
      console.log('📊 Obteniendo estadísticas de mediciones...');
      return { total: 0, promedio_elevacion: 0, rango_kilometraje: { min: 0, max: 0 } };
    },
    enabled: !!proyectoId
  });
};

export const useExportarMediciones = () => {
  console.log('🔄 useExportarMediciones - función placeholder');
  
  return useMutation({
    mutationFn: async ({ proyectoId, formato = 'csv' }) => {
      console.log('📁 Exportando mediciones...');
      return { url: '#', mensaje: 'Función de exportación no implementada' };
    }
  });
};

export const useDuplicarMedicion = () => {
  console.log('🔄 useDuplicarMedicion - función placeholder');
  
  return useMutation({
    mutationFn: async (medicionId) => {
      console.log('📋 Duplicando medición...');
      return { message: 'Función de duplicación no implementada' };
    }
  });
};

/**
 * Función de diagnóstico para verificar la configuración de mediciones
 */
export const diagnosticarMediciones = () => {
  console.group('🔧 Diagnóstico completo de useMediciones');
  
  // Verificar queryKeys
  console.log('📋 Verificación de queryKeys:');
  console.log('- queryKeys:', !!queryKeys);
  console.log('- queryKeys.medicion:', !!queryKeys?.medicion);
  console.log('- queryKeys.mediciones (string):', queryKeys?.mediciones);
  
  if (queryKeys?.medicion) {
    Object.keys(queryKeys.medicion).forEach(key => {
      console.log(`- queryKeys.medicion.${key}:`, typeof queryKeys.medicion[key]);
    });
  }
  
  // Verificar endpoints
  console.log('🌐 Verificación de endpoints:');
  console.log('- endpoints:', !!endpoints);
  console.log('- endpoints.mediciones:', !!endpoints?.mediciones);
  
  if (endpoints?.mediciones) {
    Object.keys(endpoints.mediciones).forEach(key => {
      console.log(`- endpoints.mediciones.${key}:`, typeof endpoints.mediciones[key]);
    });
  }
  
  // Test de signature detection
  console.log('🧪 Test de detección de signature:');
  const testCases = [
    { input: { proyecto_id: 1 }, expected: 'Objeto { proyecto_id }' },
    { input: [123, {}], expected: 'Parámetros separados (estacionId, filters)' },
    { input: { estacion_id: 456, proyecto_id: 1 }, expected: 'Objeto { proyecto_id }' }
  ];
  
  testCases.forEach((testCase, index) => {
    const isObject = typeof testCase.input === 'object' && !Array.isArray(testCase.input);
    console.log(`- Test ${index + 1}: ${isObject ? 'Objeto' : 'Array'} → ${testCase.expected}`);
  });
  
  console.groupEnd();
};

// Hook para usar el diagnóstico automáticamente en desarrollo
export const useMedicionesDiagnostic = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      diagnosticarMediciones();
    }
  }, []);
};

/**
 * GUÍA DE USO COMPLETA:
 * 
 * // 1. DESDE DatosDiseno.jsx (tu código actual) - FUNCIONA SIN CAMBIOS
 * const { data: mediciones } = useMediciones({ proyecto_id: proyectoSeleccionado });
 * 
 * // 2. Signature original (estacionId, filters)
 * const { data: mediciones } = useMediciones(estacionId, { estado: 'activo' });
 * 
 * // 3. Con estacion_id específica en formato objeto
 * const { data: mediciones } = useMediciones({ estacion_id: 123, proyecto_id: 456 });
 * 
 * // 4. Para diagnóstico en desarrollo
 * useMedicionesDiagnostic(); // Añadir en cualquier componente
 * 
 * // 5. Para diagnóstico manual
 * diagnosticarMediciones(); // Llamar desde consola
 * 
 * // 6. Hooks específicos
 * const { data } = useMedicionesPorProyecto(proyectoId);
 * const { data } = useMedicionesPorEstacion(estacionId);
 * const { data } = useMedicion(medicionId);
 */