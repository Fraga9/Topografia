import React from 'react';
import { formatDate } from '../../utils/formatters';

const ReporteEstaciones = ({ 
  proyecto, 
  estaciones, 
  mediciones, 
  lecturas,
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

  // Estadísticas del proyecto
  const estadisticas = React.useMemo(() => {
    const totalEstaciones = estaciones?.length || 0;
    const estacionesConMediciones = mediciones?.length || 0;
    const totalLecturas = lecturas?.length || 0;
    
    // Análisis de calidad de las lecturas
    const lecturasExcelente = lecturas?.filter(l => l.calidad === 'EXCELENTE').length || 0;
    const lecturasBuena = lecturas?.filter(l => l.calidad === 'BUENA').length || 0;
    const lecturasRegular = lecturas?.filter(l => l.calidad === 'REGULAR').length || 0;
    const lecturasRevisar = lecturas?.filter(l => l.calidad === 'REVISAR').length || 0;
    
    const cumpleTolerancia = lecturas?.filter(l => l.cumple_tolerancia === true).length || 0;
    const porcentajeCumplimiento = totalLecturas > 0 ? (cumpleTolerancia / totalLecturas) * 100 : 0;
    
    return {
      totalEstaciones,
      estacionesConMediciones,
      totalLecturas,
      lecturasExcelente,
      lecturasBuena,
      lecturasRegular,
      lecturasRevisar,
      cumpleTolerancia,
      porcentajeCumplimiento
    };
  }, [estaciones, mediciones, lecturas]);

  // Agrupar lecturas por medición/estación
  const lecturasAgrupadas = React.useMemo(() => {
    if (!mediciones || !lecturas) return {};
    
    const grupos = {};
    mediciones.forEach(medicion => {
      const lecturasEstacion = lecturas.filter(l => l.medicion_id === medicion.id);
      if (lecturasEstacion.length > 0) {
        grupos[medicion.id] = {
          medicion,
          lecturas: lecturasEstacion.sort((a, b) => 
            parseFloat(a.division_transversal) - parseFloat(b.division_transversal)
          )
        };
      }
    });
    
    return grupos;
  }, [mediciones, lecturas]);

  const handleGenerarPDF = () => {
    const reporteData = {
      tipo: 'estaciones',
      proyecto,
      estadisticas,
      lecturasAgrupadas,
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Proyecto Seleccionado</h3>
          <p className="text-gray-600">
            Seleccione un proyecto para generar el reporte de resultados por estación.
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
              Reporte de Resultados por Estación
            </h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Proyecto:</span> {proyecto.nombre}</p>
              <p><span className="font-medium">Tramo:</span> {proyecto.tramo || 'N/A'}</p>
              <p><span className="font-medium">Cuerpo:</span> {proyecto.cuerpo || 'N/A'}</p>
              <p><span className="font-medium">Rango:</span> KM {formatearKM(proyecto.km_inicial)} - {formatearKM(proyecto.km_final)}</p>
            </div>
          </div>
          
          <button
            onClick={handleGenerarPDF}
            disabled={isGenerating || Object.keys(lecturasAgrupadas).length === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Resumen ejecutivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{estadisticas.estacionesConMediciones}</div>
          <div className="text-sm text-blue-800">Estaciones Medidas</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{estadisticas.totalLecturas}</div>
          <div className="text-sm text-green-800">Total Lecturas</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{estadisticas.porcentajeCumplimiento.toFixed(1)}%</div>
          <div className="text-sm text-purple-800">Cumplimiento</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-600">{estadisticas.lecturasRevisar}</div>
          <div className="text-sm text-amber-800">Para Revisar</div>
        </div>
      </div>

      {/* Vista previa de las tablas de resultados */}
      {Object.keys(lecturasAgrupadas).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin Datos Disponibles</h3>
          <p className="text-gray-600">
            No hay lecturas registradas para generar el reporte. Complete las mediciones en campo para ver los resultados.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vista Previa del Contenido ({Object.keys(lecturasAgrupadas).length} estaciones)
          </h3>
          
          {/* Mostrar solo las primeras 2 estaciones como vista previa */}
          {Object.entries(lecturasAgrupadas).slice(0, 2).map(([medicionId, grupo]) => (
            <div key={medicionId} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header de la estación */}
              <div className="bg-blue-600 text-white p-4">
                <h4 className="text-lg font-semibold">
                  Estación KM {formatearKM(grupo.medicion.estacion_km)}
                </h4>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-blue-100">Altura BN:</span> {formatNumber(grupo.medicion.bn_altura, 3)}m
                  </div>
                  <div>
                    <span className="text-blue-100">Lectura BN:</span> {formatNumber(grupo.medicion.bn_lectura, 3)}m
                  </div>
                  <div>
                    <span className="text-blue-100">Altura Aparato:</span> {formatNumber(grupo.medicion.altura_aparato, 3)}m
                  </div>
                </div>
              </div>
              
              {/* Tabla de resultados */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">División (m)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lectura Mira</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Elv. Base Real</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Elv. Base Proyecto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Elv. Concreto Proy.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clasificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {grupo.lecturas.slice(0, 5).map((lectura, index) => {
                      const diferencia = lectura.elv_base_real && lectura.elv_base_proyecto 
                        ? parseFloat(lectura.elv_base_real) - parseFloat(lectura.elv_base_proyecto)
                        : null;
                      
                      return (
                        <tr key={lectura.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {parseFloat(lectura.division_transversal) === 0 ? '0.00 (EJE)' : 
                             parseFloat(lectura.division_transversal) < 0 ? 
                             `${Math.abs(parseFloat(lectura.division_transversal)).toFixed(2)} (I)` :
                             `${parseFloat(lectura.division_transversal).toFixed(2)} (D)`}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {formatNumber(lectura.lectura_mira, 3)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                            {lectura.elv_base_real ? formatNumber(lectura.elv_base_real, 3) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {lectura.elv_base_proyecto ? formatNumber(lectura.elv_base_proyecto, 3) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-purple-600">
                            {lectura.elv_concreto_proyecto ? formatNumber(lectura.elv_concreto_proyecto, 3) : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-center font-bold ${
                            diferencia === null ? 'text-gray-400' :
                            Math.abs(diferencia) <= (proyecto?.tolerancia_sct || 0.005) ? 'text-green-600' :
                            diferencia > 0 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {diferencia !== null ? 
                              `${diferencia >= 0 ? '+' : ''}${diferencia.toFixed(6)}` : 
                              '-'
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lectura.clasificacion && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                lectura.clasificacion === 'CUMPLE' ? 'bg-green-100 text-green-800' :
                                lectura.clasificacion === 'CORTE' ? 'bg-red-100 text-red-800' :
                                lectura.clasificacion === 'TERRAPLEN' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lectura.clasificacion}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {grupo.lecturas.length > 5 && (
                      <tr>
                        <td colSpan="7" className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50">
                          ... y {grupo.lecturas.length - 5} divisiones más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {Object.keys(lecturasAgrupadas).length > 2 && (
            <div className="text-center py-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium">
                ... y {Object.keys(lecturasAgrupadas).length - 2} estaciones más que se incluirán en el PDF completo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Información del reporte */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">📋 Contenido del PDF Profesional</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Header corporativo CEMEX</strong> con información del proyecto</li>
            <li>• <strong>Resumen ejecutivo</strong> con métricas clave de cumplimiento</li>
            <li>• <strong>Tablas profesionales por estación</strong> con todos los resultados calculados</li>
            <li>• <strong>Análisis colorizado</strong> de desviaciones según tolerancia SCT</li>
            <li>• <strong>Clasificaciones visuales</strong> (CUMPLE/CORTE/TERRAPLÉN)</li>
            <li>• <strong>Formato empresarial</strong> listo para presentación al cliente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReporteEstaciones;