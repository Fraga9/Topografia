// context/ProyectoContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../utils/queryKeys';

const ProyectoContext = createContext();

export const useProyectoSeleccionado = () => {
  const context = useContext(ProyectoContext);
  if (!context) {
    throw new Error('useProyectoSeleccionado debe usarse dentro de ProyectoProvider');
  }
  return context;
};

export const ProyectoProvider = ({ children }) => {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const queryClient = useQueryClient();

  // Cargar proyecto desde localStorage al inicializar y refrescar desde Supabase
  useEffect(() => {
    const proyectoGuardado = localStorage.getItem('proyectoSeleccionado');
    if (proyectoGuardado) {
      try {
        const proyecto = JSON.parse(proyectoGuardado);
        console.log('🔍 Proyecto cargado desde localStorage:', proyecto);
        console.log('🔍 Divisiones en localStorage - izquierdas:', proyecto.divisiones_izquierdas);
        console.log('🔍 Divisiones en localStorage - derechas:', proyecto.divisiones_derechas);
        setProyectoSeleccionado(proyecto);
        
        // Actualizar inmediatamente desde Supabase para tener datos frescos
        if (proyecto.id) {
          console.log('🔄 Actualizando proyecto desde Supabase...');
          actualizarProyectoDesdeSupabase(proyecto.id);
        }
      } catch (error) {
        console.error('Error al cargar proyecto desde localStorage:', error);
        localStorage.removeItem('proyectoSeleccionado');
      }
    }
  }, []);

  // Guardar proyecto en localStorage cuando cambie
  useEffect(() => {
    if (proyectoSeleccionado) {
      localStorage.setItem('proyectoSeleccionado', JSON.stringify(proyectoSeleccionado));
    } else {
      localStorage.removeItem('proyectoSeleccionado');
    }
  }, [proyectoSeleccionado]);

  const seleccionarProyecto = (proyecto) => {
    console.log('🔄 Cambiando proyecto seleccionado:', proyecto);
    
    // Si hay un proyecto anterior, limpiar sus queries
    if (proyectoSeleccionado && proyectoSeleccionado.id !== proyecto?.id) {
      console.log('🧹 Limpiando queries del proyecto anterior:', proyectoSeleccionado.id);
      
      // Cancelar queries en curso del proyecto anterior usando los query keys correctos
      queryClient.cancelQueries({ queryKey: queryKeys.estacion.listByProyecto(proyectoSeleccionado.id) });
      queryClient.cancelQueries({ queryKey: queryKeys.medicion.listByProyecto(proyectoSeleccionado.id) });
      queryClient.cancelQueries({ queryKey: queryKeys.proyecto.estaciones(proyectoSeleccionado.id) });
      queryClient.cancelQueries({ queryKey: queryKeys.proyecto.mediciones(proyectoSeleccionado.id) });
      
      // Cancelar TODAS las queries de lecturas del proyecto anterior
      queryClient.cancelQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            // Lecturas genéricas
            key[0] === queryKeys.lecturas ||
            // Lecturas por patrón específico
            (Array.isArray(key) && key.includes('lecturas')) ||
            (Array.isArray(key) && key.includes('byMedicion'))
          );
        }
      });
    }
    
    setProyectoSeleccionado(proyecto);
    
    // Si hay un nuevo proyecto, forzar refresh de sus datos
    if (proyecto?.id) {
      console.log('🔄 Invalidando queries del nuevo proyecto:', proyecto.id);
      
      // Invalidar queries del nuevo proyecto para forzar refresh usando los query keys correctos
      queryClient.invalidateQueries({ queryKey: queryKeys.estacion.listByProyecto(proyecto.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicion.listByProyecto(proyecto.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.estaciones(proyecto.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.mediciones(proyecto.id) });
      
      // Invalidar TODAS las queries de lecturas para que se recarguen con el nuevo proyecto
      // Esto invalidará tanto las genéricas como las específicas por medición
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            // Lecturas genéricas
            key[0] === queryKeys.lecturas ||
            // Lecturas por patrón específico
            (Array.isArray(key) && key.includes('lecturas')) ||
            (Array.isArray(key) && key.includes('byMedicion'))
          );
        }
      });
      
      // También invalidar el detalle del proyecto
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.detail(proyecto.id) });
    }
  };

  // Función para actualizar proyecto desde tiempo real
  const actualizarProyectoDesdeSupabase = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error actualizando proyecto desde Supabase:', error);
        return;
      }

      if (data) {
        console.log('✅ Proyecto actualizado desde Supabase:', data);
        console.log('✅ Nuevas divisiones - izquierdas:', data.divisiones_izquierdas);
        console.log('✅ Nuevas divisiones - derechas:', data.divisiones_derechas);
        setProyectoSeleccionado(data);
      }
    } catch (error) {
      console.error('Error en actualizarProyectoDesdeSupabase:', error);
    }
  };

  const limpiarProyecto = () => {
    setProyectoSeleccionado(null);
  };

  // Función para refrescar manualmente los datos del proyecto actual
  const refrescarDatosProyecto = () => {
    if (proyectoSeleccionado?.id) {
      console.log('🔄 Refrescando datos del proyecto actual:', proyectoSeleccionado.id);
      
      // Invalidar todas las queries relacionadas con el proyecto actual
      queryClient.invalidateQueries({ queryKey: queryKeys.estacion.listByProyecto(proyectoSeleccionado.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicion.listByProyecto(proyectoSeleccionado.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.estaciones(proyectoSeleccionado.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.mediciones(proyectoSeleccionado.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proyecto.detail(proyectoSeleccionado.id) });
      
      // Invalidar TODAS las queries de lecturas
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            // Lecturas genéricas
            key[0] === queryKeys.lecturas ||
            // Lecturas por patrón específico
            (Array.isArray(key) && key.includes('lecturas')) ||
            (Array.isArray(key) && key.includes('byMedicion'))
          );
        }
      });
    }
  };

  const value = {
    proyectoSeleccionado,
    seleccionarProyecto,
    limpiarProyecto,
    actualizarProyectoDesdeSupabase,
    refrescarDatosProyecto,
  };

  return (
    <ProyectoContext.Provider value={value}>
      {children}
    </ProyectoContext.Provider>
  );
};