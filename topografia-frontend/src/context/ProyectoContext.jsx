// context/ProyectoContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    setProyectoSeleccionado(proyecto);
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

  const value = {
    proyectoSeleccionado,
    seleccionarProyecto,
    limpiarProyecto,
    actualizarProyectoDesdeSupabase,
  };

  return (
    <ProyectoContext.Provider value={value}>
      {children}
    </ProyectoContext.Provider>
  );
};