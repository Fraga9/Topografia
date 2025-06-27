import React, { useState, useMemo } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { useEstaciones } from '../hooks/estaciones/useEstaciones';
import { useMediciones } from '../hooks/mediciones/useMediciones';
import { useLecturas } from '../hooks/lecturas/useLecturas';
import { formatNumber } from '../utils/formatters';

const Alertas = () => {
  const [filtroSeveridad, setFiltroSeveridad] = useState('todas'); // todas, criticas, advertencias, info
  const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, corte, terraplen, tolerancia
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('todas');

  // Hook para proyecto actual
  const { proyecto, tieneProyecto } = useProyecto();

  // Hooks para datos del proyecto
  const { 
    data: estaciones = [], 
    isLoading: loadingEstaciones 
  } = useEstaciones(proyecto?.id, { enabled: !!proyecto?.id });

  const { 
    data: mediciones = [], 
    isLoading: loadingMediciones 
  } = useMediciones({ proyecto_id: proyecto?.id, enabled: !!proyecto?.id });

  // Obtener todas las lecturas de todas las mediciones
  const lecturasQueries = mediciones.map(medicion => 
    useLecturas(medicion.id, {}, { enabled: !!medicion.id })
  );

  // Formatear KM para mostrar
  const formatearKM = (km) => {
    if (!km) return '';
    const kmNum = parseFloat(km);
    const kmMiles = Math.floor(kmNum / 1000);
    const metros = kmNum % 1000;
    return `${kmMiles}+${metros.toFixed(0).padStart(3, '0')}`;
  };

  // Procesar todas las lecturas y generar alertas
  const alertas = useMemo(() => {
    if (!proyecto || !mediciones.length) return [];

    const alertasGeneradas = [];

    mediciones.forEach((medicion, indexMedicion) => {
      const lecturas = lecturasQueries[indexMedicion]?.data || [];
      const estacion = estaciones.find(e => 
        Math.abs(parseFloat(e.km) - medicion.estacion_km) < 0.001
      );

      if (lecturas.length === 0) {
        // Alerta por falta de lecturas
        alertasGeneradas.push({
          id: `medicion-${medicion.id}-sin-lecturas`,
          tipo: 'sin_lecturas',
          severidad: 'critica',
          estacion_km: medicion.estacion_km,
          titulo: 'Sin lecturas registradas',
          descripcion: `La estación ${formatearKM(medicion.estacion_km)} no tiene lecturas registradas`,
          valor_requerido: 'Lecturas de mira',
          valor_actual: '0 lecturas',
          accion_recomendada: 'Registrar lecturas en la página de Campo',
          fecha: medicion.fecha_medicion || new Date().toISOString(),
          division_transversal: null,
          volumen_trabajo: 0
        });
        return;
      }

      // Procesar cada lectura para generar alertas específicas
      lecturas.forEach(lectura => {
        const diferencia = lectura.elv_base_real - lectura.elv_base_proyecto;
        const diferenciaAbs = Math.abs(diferencia);
        
        // Alerta por tolerancia SCT
        if (diferenciaAbs > proyecto.tolerancia_sct) {
          let severidad = 'advertencia';
          let tipoAlerta = lectura.clasificacion?.toLowerCase() || 'tolerancia';
          
          // Determinar severidad basada en qué tan fuera está de tolerancia
          if (diferenciaAbs > proyecto.tolerancia_sct * 5) {
            severidad = 'critica';
          } else if (diferenciaAbs > proyecto.tolerancia_sct * 2) {
            severidad = 'advertencia';
          } else {
            severidad = 'info';
          }

          let tituloAlerta = '';
          let descripcionAlerta = '';
          let accionRecomendada = '';

          if (lectura.clasificacion === 'CORTE') {
            tituloAlerta = `Corte requerido: ${formatNumber(diferenciaAbs * 1000, 0)}mm`;
            descripcionAlerta = `El terreno está ${formatNumber(diferenciaAbs * 1000, 0)}mm arriba del nivel de proyecto`;
            accionRecomendada = `Realizar corte de ${formatNumber(diferenciaAbs * 1000, 0)}mm en división ${formatNumber(lectura.division_transversal, 1)}m`;
          } else if (lectura.clasificacion === 'TERRAPLEN') {
            tituloAlerta = `Terraplén requerido: ${formatNumber(diferenciaAbs * 1000, 0)}mm`;
            descripcionAlerta = `El terreno está ${formatNumber(diferenciaAbs * 1000, 0)}mm debajo del nivel de proyecto`;
            accionRecomendada = `Realizar terraplén de ${formatNumber(diferenciaAbs * 1000, 0)}mm en división ${formatNumber(lectura.division_transversal, 1)}m`;
          } else {
            tituloAlerta = `Fuera de tolerancia: ${formatNumber(diferenciaAbs * 1000, 0)}mm`;
            descripcionAlerta = `La diferencia excede la tolerancia SCT de ±${formatNumber(proyecto.tolerancia_sct * 1000, 0)}mm`;
            accionRecomendada = 'Revisar medición o ajustar nivel';
          }

          alertasGeneradas.push({
            id: `lectura-${lectura.id}-${tipoAlerta}`,
            tipo: tipoAlerta,
            severidad,
            estacion_km: medicion.estacion_km,
            titulo: tituloAlerta,
            descripcion: descripcionAlerta,
            valor_requerido: `${formatNumber(lectura.elv_base_proyecto, 3)}m`,
            valor_actual: `${formatNumber(lectura.elv_base_real, 3)}m`,
            diferencia: formatNumber(diferencia * 1000, 0), // en mm
            accion_recomendada: accionRecomendada,
            fecha: medicion.fecha_medicion || new Date().toISOString(),
            division_transversal: lectura.division_transversal,
            volumen_trabajo: Math.abs(lectura.volumen_por_metro || 0),
            tolerancia_sct: proyecto.tolerancia_sct * 1000 // en mm
          });
        }

        // Alerta por calidad de lectura
        if (lectura.calidad && lectura.calidad !== 'EXCELENTE' && lectura.calidad !== 'BUENA') {
          alertasGeneradas.push({
            id: `lectura-${lectura.id}-calidad`,
            tipo: 'calidad',
            severidad: lectura.calidad === 'REVISAR' ? 'critica' : 'advertencia',
            estacion_km: medicion.estacion_km,
            titulo: `Calidad de lectura: ${lectura.calidad}`,
            descripcion: `La lectura en división ${formatNumber(lectura.division_transversal, 1)}m requiere atención`,
            valor_requerido: 'Calidad BUENA o EXCELENTE',
            valor_actual: lectura.calidad,
            accion_recomendada: 'Repetir medición o verificar condiciones de campo',
            fecha: medicion.fecha_medicion || new Date().toISOString(),
            division_transversal: lectura.division_transversal,
            volumen_trabajo: 0
          });
        }
      });

      // Verificar si hay estación teórica configurada
      if (!estacion) {
        alertasGeneradas.push({
          id: `estacion-${medicion.estacion_km}-sin-teorica`,
          tipo: 'configuracion',
          severidad: 'critica',
          estacion_km: medicion.estacion_km,
          titulo: 'Estación teórica no configurada',
          descripcion: `Falta configurar los parámetros teóricos para ${formatearKM(medicion.estacion_km)}`,
          valor_requerido: 'Pendiente y Base CL',
          valor_actual: 'No configurado',
          accion_recomendada: 'Configurar estación teórica en Datos de Diseño',
          fecha: medicion.fecha_medicion || new Date().toISOString(),
          division_transversal: null,
          volumen_trabajo: 0
        });
      }
    });

    return alertasGeneradas.sort((a, b) => {
      // Ordenar por severidad (críticas primero) y luego por estación
      const severidadOrder = { critica: 0, advertencia: 1, info: 2 };
      if (severidadOrder[a.severidad] !== severidadOrder[b.severidad]) {
        return severidadOrder[a.severidad] - severidadOrder[b.severidad];
      }
      return a.estacion_km - b.estacion_km;
    });
  }, [proyecto, mediciones, lecturasQueries, estaciones]);

  // Filtrar alertas
  const alertasFiltradas = useMemo(() => {
    return alertas.filter(alerta => {
      // Filtro por severidad
      if (filtroSeveridad !== 'todas' && alerta.severidad !== filtroSeveridad) {
        return false;
      }

      // Filtro por tipo
      if (filtroTipo !== 'todos' && alerta.tipo !== filtroTipo) {
        return false;
      }

      // Filtro por estación
      if (estacionSeleccionada !== 'todas' && 
          alerta.estacion_km !== parseFloat(estacionSeleccionada)) {
        return false;
      }

      return true;
    });
  }, [alertas, filtroSeveridad, filtroTipo, estacionSeleccionada]);

  // Estadísticas de alertas
  const estadisticas = useMemo(() => {
    return {
      total: alertas.length,
      criticas: alertas.filter(a => a.severidad === 'critica').length,
      advertencias: alertas.filter(a => a.severidad === 'advertencia').length,
      info: alertas.filter(a => a.severidad === 'info').length,
      cortes: alertas.filter(a => a.tipo === 'corte').length,
      terraplenes: alertas.filter(a => a.tipo === 'terraplen').length,
      volumenTotalCorte: alertas
        .filter(a => a.tipo === 'corte')
        .reduce((sum, a) => sum + (a.volumen_trabajo || 0), 0),
      volumenTotalTerraplen: alertas
        .filter(a => a.tipo === 'terraplen')
        .reduce((sum, a) => sum + (a.volumen_trabajo || 0), 0)
    };
  }, [alertas]);

  // Obtener icono según severidad
  const getIconoSeveridad = (severidad) => {
    switch (severidad) {
      case 'critica':
        return '🚨';
      case 'advertencia':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  // Obtener color según severidad
  const getColorSeveridad = (severidad) => {
    switch (severidad) {
      case 'critica':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'advertencia':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Si no hay proyecto seleccionado
  if (!tieneProyecto) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Seleccione un Proyecto</h2>
          <p className="text-gray-600 mb-4">
            Para ver alertas y ajustes necesarios, primero seleccione un proyecto.
          </p>
          <button 
            onClick={() => window.location.href = '/proyectos'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg"
          >
            Ir a Proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas y Ajustes</h1>
            <p className="text-gray-600 mt-1">
              Monitoreo de trabajos necesarios por estación: cortes, terraplenes y tolerancias
            </p>
          </div>
          
          <div className="text-right">
            <h3 className="font-medium text-gray-900">{proyecto.nombre}</h3>
            <p className="text-sm text-gray-500">{proyecto.tramo}</p>
            <p className="text-xs text-gray-400">
              {formatearKM(proyecto.km_inicial)} → {formatearKM(proyecto.km_final)}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
          <div className="text-sm text-gray-600">Total Alertas</div>
        </div>
        
        <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{estadisticas.criticas}</div>
          <div className="text-sm text-red-600">Críticas</div>
        </div>
        
        <div className="bg-white rounded-lg border border-yellow-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{estadisticas.advertencias}</div>
          <div className="text-sm text-yellow-600">Advertencias</div>
        </div>
        
        <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{estadisticas.cortes}</div>
          <div className="text-sm text-red-700">Cortes</div>
        </div>
        
        <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{estadisticas.terraplenes}</div>
          <div className="text-sm text-orange-600">Terraplenes</div>
        </div>
        
        <div className="bg-white rounded-lg border border-purple-200 p-4 text-center">
          <div className="text-lg font-bold text-purple-600">
            {formatNumber(estadisticas.volumenTotalCorte + estadisticas.volumenTotalTerraplen, 2)}
          </div>
          <div className="text-sm text-purple-600">m³ Total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severidad
            </label>
            <select
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="critica">Críticas</option>
              <option value="advertencia">Advertencias</option>
              <option value="info">Información</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Trabajo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="corte">Cortes</option>
              <option value="terraplen">Terraplenes</option>
              <option value="tolerancia">Fuera de Tolerancia</option>
              <option value="calidad">Calidad</option>
              <option value="configuracion">Configuración</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estación
            </label>
            <select
              value={estacionSeleccionada}
              onChange={(e) => setEstacionSeleccionada(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las estaciones</option>
              {Array.from(new Set(mediciones.map(m => m.estacion_km)))
                .sort((a, b) => a - b)
                .map(km => (
                  <option key={km} value={km}>
                    {formatearKM(km)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {(loadingEstaciones || loadingMediciones) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando datos del proyecto...</p>
        </div>
      )}

      {/* Lista de Alertas */}
      {!loadingEstaciones && !loadingMediciones && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Alertas Activas ({alertasFiltradas.length})
            </h3>
            
            {alertasFiltradas.length > 0 && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                Exportar Reporte
              </button>
            )}
          </div>

          {alertasFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-green-500 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {alertas.length === 0 ? '¡Excelente! No hay alertas' : 'No hay alertas que coincidan con los filtros'}
              </h3>
              <p className="text-gray-600">
                {alertas.length === 0 
                  ? 'Todas las mediciones están dentro de tolerancia.'
                  : 'Prueba ajustando los filtros para ver más alertas.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasFiltradas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`rounded-lg border p-6 ${getColorSeveridad(alerta.severidad)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getIconoSeveridad(alerta.severidad)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">
                            {alerta.titulo}
                          </h4>
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded text-xs font-medium">
                            {formatearKM(alerta.estacion_km)}
                          </span>
                          {alerta.division_transversal !== null && (
                            <span className="bg-white bg-opacity-50 px-2 py-1 rounded text-xs font-medium">
                              División {formatNumber(alerta.division_transversal, 1)}m
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm mb-3">
                          {alerta.descripcion}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Valor Requerido:</span>
                            <p>{alerta.valor_requerido}</p>
                          </div>
                          <div>
                            <span className="font-medium">Valor Actual:</span>
                            <p>{alerta.valor_actual}</p>
                          </div>
                          {alerta.diferencia && (
                            <div>
                              <span className="font-medium">Diferencia:</span>
                              <p>{alerta.diferencia}mm</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 p-3 bg-white bg-opacity-30 rounded">
                          <span className="font-medium text-sm">Acción Recomendada:</span>
                          <p className="text-sm mt-1">{alerta.accion_recomendada}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs opacity-75">
                      {new Date(alerta.fecha).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumen de Volúmenes */}
      {estadisticas.total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Volúmenes de Trabajo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Trabajos de Corte</h4>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {formatNumber(estadisticas.volumenTotalCorte, 3)} m³
              </div>
              <p className="text-sm text-red-600">
                {estadisticas.cortes} puntos requieren corte
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">Trabajos de Terraplén</h4>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {formatNumber(estadisticas.volumenTotalTerraplen, 3)} m³
              </div>
              <p className="text-sm text-orange-600">
                {estadisticas.terraplenes} puntos requieren terraplén
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alertas;