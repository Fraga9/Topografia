// hooks/useProyecto.js - Versión mejorada que usa datos más completos
import React from 'react';
import { useProyectoSeleccionado } from '../context/ProyectoContext';

export const useProyecto = () => {
  const { proyectoSeleccionado, seleccionarProyecto, limpiarProyecto } = useProyectoSeleccionado();

  const tieneProyecto = Boolean(proyectoSeleccionado);
  
  const formatearKM = (km) => {
    if (!km) return '';
    // ✅ MEJORADO: Manejar tanto números como strings
    const kmNumero = typeof km === 'string' ? parseFloat(km) : km;
    return `${Math.floor(kmNumero/1000)}+${String(kmNumero%1000).padStart(3,'0')}`;
  };

  const rangoKM = proyectoSeleccionado 
    ? `${formatearKM(proyectoSeleccionado.km_inicial)} - ${formatearKM(proyectoSeleccionado.km_final)}`
    : '';

  // ✅ MEJORADO: Usar datos más completos y manejar valores undefined
  const descripcionCompleta = proyectoSeleccionado 
    ? `${proyectoSeleccionado.nombre} - ${proyectoSeleccionado.tramo}, Cuerpo ${proyectoSeleccionado.cuerpo || 'N/A'}`
    : '';

  // Debug para identificar problema con divisiones
  React.useEffect(() => {
    if (proyectoSeleccionado && process.env.NODE_ENV === 'development') {
      console.group('🔍 Debug useProyecto - Divisiones');
      console.log('Proyecto completo:', proyectoSeleccionado);
      console.log('divisiones_izquierdas raw:', proyectoSeleccionado.divisiones_izquierdas);
      console.log('divisiones_derechas raw:', proyectoSeleccionado.divisiones_derechas);
      console.log('Es array izquierdas?', Array.isArray(proyectoSeleccionado.divisiones_izquierdas));
      console.log('Es array derechas?', Array.isArray(proyectoSeleccionado.divisiones_derechas));
      console.groupEnd();
    }
  }, [proyectoSeleccionado]);

  // ✅ NUEVO: Información adicional del proyecto
  const informacionProyecto = proyectoSeleccionado ? {
    // Datos básicos normalizados
    id: proyectoSeleccionado.id,
    nombre: proyectoSeleccionado.nombre,
    tramo: proyectoSeleccionado.tramo || 'N/A',
    cuerpo: proyectoSeleccionado.cuerpo || 'N/A',
    
    // Datos numéricos convertidos de forma segura
    kmInicial: typeof proyectoSeleccionado.km_inicial === 'string' 
      ? parseFloat(proyectoSeleccionado.km_inicial) 
      : proyectoSeleccionado.km_inicial || 0,
    kmFinal: typeof proyectoSeleccionado.km_final === 'string' 
      ? parseFloat(proyectoSeleccionado.km_final) 
      : proyectoSeleccionado.km_final || 0,
    intervalo: typeof proyectoSeleccionado.intervalo === 'string' 
      ? parseFloat(proyectoSeleccionado.intervalo) 
      : proyectoSeleccionado.intervalo || 5,
    espesor: typeof proyectoSeleccionado.espesor === 'string' 
      ? parseFloat(proyectoSeleccionado.espesor) 
      : proyectoSeleccionado.espesor || 0.25,
    toleranciaSct: typeof proyectoSeleccionado.tolerancia_sct === 'string' 
      ? parseFloat(proyectoSeleccionado.tolerancia_sct) 
      : proyectoSeleccionado.tolerancia_sct || 0.005,
    
    // Metadatos
    estado: proyectoSeleccionado.estado || 'CONFIGURACION',
    fechaCreacion: proyectoSeleccionado.fecha_creacion,
    usuarioId: proyectoSeleccionado.usuario_id,
    
    // Datos calculados si están disponibles
    totalEstaciones: proyectoSeleccionado.total_estaciones,
    longitudProyecto: proyectoSeleccionado.longitud_proyecto,
    divisionesIzquierdas: proyectoSeleccionado.divisiones_izquierdas ?? [],
    divisionesDerechas: proyectoSeleccionado.divisiones_derechas ?? []
  } : null;

  // ✅ NUEVO: Cálculos derivados
  const calculosProyecto = informacionProyecto ? {
    longitudReal: informacionProyecto.kmFinal - informacionProyecto.kmInicial,
    estacionesTotalesCalculadas: Math.ceil((informacionProyecto.kmFinal - informacionProyecto.kmInicial) / informacionProyecto.intervalo) + 1,
    rangoKmFormateado: `${formatearKM(informacionProyecto.kmInicial)} - ${formatearKM(informacionProyecto.kmFinal)}`,
    toleranciaSctMm: (informacionProyecto.toleranciaSct * 1000).toFixed(1)
  } : null;

  return {
    // Datos básicos originales
    proyecto: proyectoSeleccionado,
    tieneProyecto,
    seleccionar: seleccionarProyecto,
    limpiar: limpiarProyecto,
    rangoKM,
    descripcionCompleta,
    formatearKM,
    
    // ✅ NUEVOS: Datos normalizados y cálculos
    informacionProyecto,
    calculosProyecto,
    
    // ✅ NUEVOS: Helpers útiles
    esProyectoCompleto: !!(proyectoSeleccionado?.cuerpo && proyectoSeleccionado?.intervalo && proyectoSeleccionado?.espesor),
    tieneEstacionesConfiguradas: !!(proyectoSeleccionado?.total_estaciones),
    
    // ✅ NUEVO: Debug info
    debugInfo: process.env.NODE_ENV === 'development' ? {
      proyectoOriginal: proyectoSeleccionado,
      tiposOriginales: proyectoSeleccionado ? {
        km_inicial: typeof proyectoSeleccionado.km_inicial,
        km_final: typeof proyectoSeleccionado.km_final,
        intervalo: typeof proyectoSeleccionado.intervalo,
        espesor: typeof proyectoSeleccionado.espesor,
        cuerpo: typeof proyectoSeleccionado.cuerpo
      } : null
    } : null
  };
};