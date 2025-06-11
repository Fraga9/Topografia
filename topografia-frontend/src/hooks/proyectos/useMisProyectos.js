// hooks/proyectos/useMisProyectos.js - Hook para consultar la vista mis_proyectos
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../utils/queryKeys';

/**
 * Hook para obtener proyectos desde la vista mis_proyectos
 * que incluye todos los campos calculados necesarios
 */
export const useMisProyectos = (filters = {}) => {
  return useQuery({
    queryKey: ['mis_proyectos', filters],
    
    queryFn: async () => {
      console.log('🔄 Consultando vista mis_proyectos...');
      
      try {
        // Construir query base
        let query = supabase
          .from('mis_proyectos')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        // Aplicar filtros si existen
        if (filters.estado) {
          query = query.eq('estado', filters.estado);
        }
        
        if (filters.nombre) {
          query = query.ilike('nombre', `%${filters.nombre}%`);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Error consultando mis_proyectos:', error);
          throw error;
        }
        
        console.log('✅ Proyectos obtenidos desde vista:', {
          cantidad: data?.length || 0,
          primerProyecto: data?.[0] ? {
            id: data[0].id,
            nombre: data[0].nombre,
            estaciones_configuradas: data[0].estaciones_configuradas,
            estaciones_medidas: data[0].estaciones_medidas,
            total_lecturas: data[0].total_lecturas,
            porcentaje_cumplimiento: data[0].porcentaje_cumplimiento
          } : null
        });
        
        return data || [];
        
      } catch (error) {
        console.error('❌ Error en useMisProyectos:', error);
        throw error;
      }
    },
    
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    
    onError: (error) => {
      console.error('❌ Error obteniendo proyectos desde vista:', error);
    }
  });
};

// Alternativa usando apiClient si lo prefieres
export const useMisProyectosApi = (filters = {}) => {
  const { apiClient } = require('../../api/client');
  
  return useQuery({
    queryKey: ['mis_proyectos_api', filters],
    
    queryFn: async () => {
      console.log('🔄 Consultando mis_proyectos via API...');
      
      try {
        // Construir URL con filtros
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value);
          }
        });
        
        const url = params.toString() 
          ? `/mis_proyectos/?${params.toString()}`
          : '/mis_proyectos/';
        
        const response = await apiClient.get(url);
        
        console.log('✅ Proyectos obtenidos desde API:', {
          cantidad: response?.length || 0,
          muestra: response?.[0]
        });
        
        return response || [];
        
      } catch (error) {
        console.error('❌ Error en useMisProyectosApi:', error);
        throw error;
      }
    },
    
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
};