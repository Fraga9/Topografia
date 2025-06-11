// hooks/useProyecto.js - Versión mejorada que usa datos más completos
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
    divisionesIzquierdas: proyectoSeleccionado.divisiones_izquierdas || [-12.21, -10.7, -9, -6, -3, -1.3, 0],
    divisionesDerechas: proyectoSeleccionado.divisiones_derechas || [1.3, 3, 6, 9, 10.7, 12.21]
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