import React from 'react';
import { formatDate } from '../../utils/formatters';

const ReporteDiseno = ({ 
  proyecto, 
  estaciones, 
  onGenerar,
  isGenerating 
}) => {
  const formatNumber = (num, decimales = 3) => {
    if (num === null || num === undefined || num === '') return '';
    return parseFloat(num).toFixed(decimales);
  };

  const formatearKM = (km) => {
    if (!km) return 'N/A';
    const kmNum = parseFloat(km);
    const kilometro = Math.floor(kmNum / 1000);
    const metro = kmNum % 1000;
    return `${kilometro}+${String(metro).padStart(3, '0')}`;
  };

  // Función auxiliar para calcular elevaciones teóricas
  const calcularElevacionesTeoricasParaEstacion = React.useCallback((estacion) => {
    if (!estacion) return [];
    
    const divisiones = [-6, -4, -2, 0, 2, 4, 6]; // Divisiones ejemplo
    return divisiones.map(division => {
      const elevacionTeorica = estacion.base_cl + (division * estacion.pendiente_derecha);
      return {
        division,
        elevacionTeorica
      };
    });
  }, []);

  // Análisis de especificaciones técnicas
  const especificacionesTecnicas = React.useMemo(() => {
    if (!proyecto) return null;

    const longitudTotal = proyecto.km_final - proyecto.km_inicial;
    const estacionesTotales = Math.floor(longitudTotal / proyecto.intervalo) + 1;
    const volumenEstimado = longitudTotal * proyecto.espesor * 7.5; // Asumiendo ancho promedio de 7.5m
    
    // Análisis de estaciones teóricas
    const estacionesAnalisis = estaciones?.map(estacion => ({
      km: estacion.km,
      pendienteDerecha: estacion.pendiente_derecha,
      baseCL: estacion.base_cl,
      // Calcular elevaciones teóricas para diferentes divisiones
      elevacionesCalculadas: calcularElevacionesTeoricasParaEstacion(estacion)
    })) || [];

    // Pendientes máxima y mínima
    const pendientes = estaciones?.map(e => e.pendiente_derecha).filter(p => p !== null) || [];
    const pendienteMaxima = pendientes.length > 0 ? Math.max(...pendientes) : 0;
    const pendienteMinima = pendientes.length > 0 ? Math.min(...pendientes) : 0;
    const pendientePromedio = pendientes.length > 0 ? pendientes.reduce((a, b) => a + b, 0) / pendientes.length : 0;

    return {
      longitudTotal,
      estacionesTotales,
      volumenEstimado,
      estacionesAnalisis,
      pendienteMaxima,
      pendienteMinima,
      pendientePromedio,
      totalEstacionesDefinidas: estaciones?.length || 0
    };
  }, [proyecto, estaciones, calcularElevacionesTeoricasParaEstacion]);

  // Análisis de geometría del proyecto
  const analisisGeometria = React.useMemo(() => {
    if (!estaciones || estaciones.length < 2) return null;

    const estacionesOrdenadas = [...estaciones].sort((a, b) => a.km - b.km);
    let cambiosPendiente = 0;
    let pendienteAnterior = null;
    
    const segmentos = [];
    
    for (let i = 0; i < estacionesOrdenadas.length - 1; i++) {
      const actual = estacionesOrdenadas[i];
      const siguiente = estacionesOrdenadas[i + 1];
      
      const distancia = siguiente.km - actual.km;
      const diferenciaPendiente = Math.abs(siguiente.pendiente_derecha - actual.pendiente_derecha);
      
      segmentos.push({
        desde: actual.km,
        hasta: siguiente.km,
        distancia,
        pendienteInicial: actual.pendiente_derecha,
        pendienteFinal: siguiente.pendiente_derecha,
        diferenciaPendiente
      });
      
      if (pendienteAnterior !== null && Math.abs(actual.pendiente_derecha - pendienteAnterior) > 0.001) {
        cambiosPendiente++;
      }
      pendienteAnterior = actual.pendiente_derecha;
    }
    
    return {
      segmentos,
      cambiosPendiente,
      segmentoMayorCambio: segmentos.reduce((max, seg) => 
        seg.diferenciaPendiente > max.diferenciaPendiente ? seg : max, 
        segmentos[0] || {}
      )
    };
  }, [estaciones]);

  const handleGenerarPDF = () => {
    const reporteData = {
      tipo: 'diseno',
      proyecto,
      especificacionesTecnicas,
      analisisGeometria,
      fechaGeneracion: new Date().toISOString()
    };
    
    onGenerar(reporteData);
  };

  if (!proyecto) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Proyecto Seleccionado</h3>
          <p className="text-gray-600">
            Seleccione un proyecto para generar el reporte de diseño y especificaciones.
          </p>
        </div>
      </div>
    );
  }

  if (!especificacionesTecnicas) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en Cálculos</h3>
          <p className="text-gray-600">
            No se pudieron calcular las especificaciones técnicas del proyecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header del reporte */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reporte de Diseño y Especificaciones
            </h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Proyecto:</span> {proyecto.nombre}</p>
              <p><span className="font-medium">Tramo:</span> {proyecto.tramo || 'N/A'}</p>
              <p><span className="font-medium">Cuerpo:</span> {proyecto.cuerpo || 'N/A'}</p>
              <p><span className="font-medium">Fecha Creación:</span> {formatDate(proyecto.fecha_creacion)}</p>
            </div>
          </div>
          
          <button
            onClick={handleGenerarPDF}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Especificaciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-blue-600 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-1">Longitud Total</h3>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(especificacionesTecnicas.longitudTotal, 0)}m</p>
          <p className="text-sm text-blue-700">KM {formatearKM(proyecto.km_inicial)} - {formatearKM(proyecto.km_final)}</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-green-600 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">Estaciones</h3>
          <p className="text-3xl font-bold text-green-600">{especificacionesTecnicas.estacionesTotales}</p>
          <p className="text-sm text-green-700">Cada {proyecto.intervalo}m de intervalo</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-purple-600 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-purple-900 mb-1">Espesor Diseño</h3>
          <p className="text-3xl font-bold text-purple-600">{formatNumber(proyecto.espesor, 2)}m</p>
          <p className="text-sm text-purple-700">Especificación técnica</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
          <div className="text-amber-600 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-amber-900 mb-1">Volumen Est.</h3>
          <p className="text-3xl font-bold text-amber-600">{formatNumber(especificacionesTecnicas.volumenEstimado, 0)}</p>
          <p className="text-sm text-amber-700">m³ de concreto</p>
        </div>
      </div>

      {/* Análisis de pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Pendientes</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded border">
              <span className="font-medium text-gray-700">Pendiente Máxima:</span>
              <span className="text-lg font-bold text-red-600">
                {formatNumber(especificacionesTecnicas.pendienteMaxima * 100, 2)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border">
              <span className="font-medium text-gray-700">Pendiente Mínima:</span>
              <span className="text-lg font-bold text-green-600">
                {formatNumber(especificacionesTecnicas.pendienteMinima * 100, 2)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border">
              <span className="font-medium text-gray-700">Pendiente Promedio:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatNumber(especificacionesTecnicas.pendientePromedio * 100, 2)}%
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Tolerancia SCT:</span> ±{formatNumber(proyecto.tolerancia_sct * 1000, 1)}mm
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geometría del Proyecto</h3>
          {analisisGeometria ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border text-center">
                  <div className="text-2xl font-bold text-gray-900">{analisisGeometria.segmentos.length}</div>
                  <div className="text-sm text-gray-600">Segmentos</div>
                </div>
                <div className="bg-white p-3 rounded border text-center">
                  <div className="text-2xl font-bold text-orange-600">{analisisGeometria.cambiosPendiente}</div>
                  <div className="text-sm text-gray-600">Cambios de Pendiente</div>
                </div>
              </div>
              
              {analisisGeometria.segmentoMayorCambio && (
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">Mayor Cambio de Pendiente:</h4>
                  <p className="text-sm text-orange-700">
                    KM {formatearKM(analisisGeometria.segmentoMayorCambio.desde)} - {formatearKM(analisisGeometria.segmentoMayorCambio.hasta)}
                  </p>
                  <p className="text-sm text-orange-700">
                    Diferencia: {formatNumber(analisisGeometria.segmentoMayorCambio.diferenciaPendiente * 100, 2)}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Datos insuficientes para análisis geométrico</p>
              <p className="text-xs mt-1">Se requieren al menos 2 estaciones definidas</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de estaciones teóricas */}
      {especificacionesTecnicas.estacionesAnalisis.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estaciones Teóricas Definidas ({especificacionesTecnicas.totalEstacionesDefinidas})
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estación (KM)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendiente Derecha
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base CL (m)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elev. Eje (0m)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elev. +6m
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elev. -6m
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {especificacionesTecnicas.estacionesAnalisis.slice(0, 10).map((estacion, index) => {
                    const elevacionEje = estacion.elevacionesCalculadas.find(e => e.division === 0)?.elevacionTeorica;
                    const elevacionMas6 = estacion.elevacionesCalculadas.find(e => e.division === 6)?.elevacionTeorica;
                    const elevacionMenos6 = estacion.elevacionesCalculadas.find(e => e.division === -6)?.elevacionTeorica;
                    
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatearKM(estacion.km)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {formatNumber(estacion.pendienteDerecha * 100, 2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {formatNumber(estacion.baseCL, 3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                          {formatNumber(elevacionEje, 3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">
                          {formatNumber(elevacionMas6, 3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600">
                          {formatNumber(elevacionMenos6, 3)}
                        </td>
                      </tr>
                    );
                  })}
                  {especificacionesTecnicas.estacionesAnalisis.length > 10 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 bg-gray-50">
                        ... y {especificacionesTecnicas.estacionesAnalisis.length - 10} estaciones más en el reporte completo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Especificaciones técnicas detalladas */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📐 Especificaciones Técnicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Intervalo de estaciones:</span>
              <span className="text-blue-700">{proyecto.intervalo}m</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Espesor de diseño:</span>
              <span className="text-blue-700">{formatNumber(proyecto.espesor, 3)}m</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Tolerancia SCT:</span>
              <span className="text-blue-700">±{formatNumber(proyecto.tolerancia_sct * 1000, 1)}mm</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Estado del proyecto:</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                {proyecto.estado}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Fecha de creación:</span>
              <span className="text-blue-700">{formatDate(proyecto.fecha_creacion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-800">Estaciones definidas:</span>
              <span className="text-blue-700">
                {especificacionesTecnicas.totalEstacionesDefinidas} de {especificacionesTecnicas.estacionesTotales}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del reporte */}
      <div className="pt-6 border-t border-gray-200">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">📋 Contenido del PDF Técnico</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Header corporativo CEMEX</strong> con datos del proyecto</li>
            <li>• <strong>Especificaciones principales</strong> en dashboard visual</li>
            <li>• <strong>Parámetros técnicos</strong> en tabla estructurada</li>
            <li>• <strong>Análisis de pendientes</strong> con valores máximos, mínimos y promedio</li>
            <li>• <strong>Tabla de estaciones teóricas</strong> con elevaciones calculadas</li>
            <li>• <strong>Formato técnico profesional</strong> para documentación del proyecto</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReporteDiseno;