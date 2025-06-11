// context/ProyectoContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

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

  // Cargar proyecto desde localStorage al inicializar
  useEffect(() => {
    const proyectoGuardado = localStorage.getItem('proyectoSeleccionado');
    if (proyectoGuardado) {
      try {
        const proyecto = JSON.parse(proyectoGuardado);
        setProyectoSeleccionado(proyecto);
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

  const limpiarProyecto = () => {
    setProyectoSeleccionado(null);
  };

  const value = {
    proyectoSeleccionado,
    seleccionarProyecto,
    limpiarProyecto,
  };

  return (
    <ProyectoContext.Provider value={value}>
      {children}
    </ProyectoContext.Provider>
  );
};