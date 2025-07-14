import React from 'react';
import { formatDate } from '../../utils/formatters';

const ReporteLiberacionTopografia = ({ 
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

  // Cálculos principales del reporte según especificaciones TOP-FM-05
  const datosReporte = React.useMemo(() => {
    if (!proyecto || !mediciones || !lecturas) return null;

    // Datos por estación con cálculos volumétricos
    const estacionesData = [];
    let volumenAcumuladoReal = 0;
    let volumenAcumuladoProyecto = 0;
    
    // Estadísticas para análisis de espesores
    const diferenciasEspesor = [];
    
    // Ordenar mediciones por estación KM
    const medicionesOrdenadas = [...mediciones].sort((a, b) => a.estacion_km - b.estacion_km);
    
    medicionesOrdenadas.forEach((medicion, index) => {
      const lecturasEstacion = lecturas.filter(l => l.medicion_id === medicion.id);
      
      if (lecturasEstacion.length > 0) {
        // Ordenar lecturas por división transversal
        const lecturasOrdenadas = [...lecturasEstacion].sort((a, b) => a.division_transversal - b.division_transversal);
        
        // Calcular elevaciones promedio para la estación
        const elevacionesCampo = lecturasOrdenadas
          .map(l => l.elv_base_real)
          .filter(e => e !== null && e !== undefined);
        const elevacionesProyecto = lecturasOrdenadas
          .map(l => l.elv_base_proyecto)
          .filter(e => e !== null && e !== undefined);
        
        if (elevacionesCampo.length > 0 && elevacionesProyecto.length > 0) {
          const elevacionCampoPromedio = elevacionesCampo.reduce((a, b) => a + parseFloat(b), 0) / elevacionesCampo.length;
          const elevacionProyectoPromedio = elevacionesProyecto.reduce((a, b) => a + parseFloat(b), 0) / elevacionesProyecto.length;
          
          // Diferencia terreno (elevación real vs diseño)
          const diferenciaTerr = elevacionCampoPromedio - elevacionProyectoPromedio;
          
          // Elevación RT Proyecto (elevación de proyecto + espesor teórico)
          const rtProyecto = elevacionProyectoPromedio + proyecto.espesor;
          
          // Espesor real medido en campo
          const espesorRealPromedio = elevacionCampoPromedio - elevacionProyectoPromedio;
          diferenciasEspesor.push(espesorRealPromedio);
          
          // Área de influencia según intervalo del proyecto
          // Ancho de calzada estándar para carreteras (variable según proyecto)
          const anchoPavimento = 7.5; // metros - ancho estándar de calzada
          const area = proyecto.intervalo * anchoPavimento;
          
          // Volúmenes por estación
          const volumenRealParcial = espesorRealPromedio * area;
          const volumenProyectoParcial = proyecto.espesor * area;
          
          // Acumular volúmenes
          volumenAcumuladoReal += volumenRealParcial;
          volumenAcumuladoProyecto += volumenProyectoParcial;
          
          // Crear datos de divisiones individuales para el PDF
          const divisiones = lecturasOrdenadas.map(lectura => {
            const posicionAbsoluta = parseFloat(lectura.division_transversal) || 0;
            return {
              posicion: posicionAbsoluta.toFixed(3),
              elevacionCampo: parseFloat(lectura.elv_base_real) || 0,
              elevacionProyecto: parseFloat(lectura.elv_base_proyecto) || 0,
              diferencia: (parseFloat(lectura.elv_base_real) || 0) - (parseFloat(lectura.elv_base_proyecto) || 0),
              rtProyecto: (parseFloat(lectura.elv_base_proyecto) || 0) + parseFloat(proyecto.espesor || 0),
              determinacionVolRte: parseFloat(lectura.elv_base_real) || 0
            };
          });

          estacionesData.push({
            estacion: formatearKM(medicion.estacion_km),
            campoElevacion: elevacionCampoPromedio,
            proyectoElevacion: elevacionProyectoPromedio,
            diferenciaTerr: diferenciaTerr,
            rtProyecto: rtProyecto,
            espesorPromedio: espesorRealPromedio,
            area: area,
            volumenParcial: volumenRealParcial,
            volumenAcumulado: volumenAcumuladoReal,
            volumenProyectoParcial: volumenProyectoParcial,
            volumenProyectoAcumulado: volumenAcumuladoProyecto,
            corteTerreno: elevacionCampoPromedio,
            realRtProyecto: diferenciaTerr,
            divisiones: divisiones,
            // Datos adicionales para cálculos
            medicionId: medicion.id,
            estacionKm: medicion.estacion_km
          });
        }
      }
    });

    // Cálculos estadísticos
    const n = diferenciasEspesor.length;
    const datoMaximo = n > 0 ? Math.max(...diferenciasEspesor) : 0;
    const datoMinimo = n > 0 ? Math.min(...diferenciasEspesor) : 0;
    const datoPromedio = n > 0 ? diferenciasEspesor.reduce((a, b) => a + b, 0) / n : 0;
    
    // Desviación estándar
    const varianza = n > 0 ? 
      diferenciasEspesor.reduce((acc, val) => acc + Math.pow(val - datoPromedio, 2), 0) / n : 0;
    const desviacionEstandar = Math.sqrt(varianza);
    
    // Verificación de especificaciones
    const espesorNominal = proyecto.espesor; // En metros
    const requisitoPromedio = 0.98 * espesorNominal; // ē ≥ 0.98 e
    const requisitoDesviacion = 0.10 * espesorNominal; // s ≤ 0.10 e
    
    const cumplePromedio = datoPromedio >= requisitoPromedio;
    const cumpleDesviacion = desviacionEstandar <= requisitoDesviacion;
    
    // Evaluación por zonas
    const zonaRellenoExcesivo = diferenciasEspesor.filter(d => d > (espesorNominal + 0.001)).length;
    const zonaDentroTolerancia = diferenciasEspesor.filter(d => 
      d >= (espesorNominal - 0.004) && d <= (espesorNominal + 0.001)
    ).length;
    const zonaEspesorInsuficiente = diferenciasEspesor.filter(d => d < (espesorNominal - 0.004)).length;
    
    const estadoInspeccion = (zonaDentroTolerancia / n) > 0.95 ? 'CONFORME' : 'NO CONFORME';
    
    return {
      estacionesData,
      volumenProyecto: volumenAcumuladoProyecto,
      volumenRealBase: volumenAcumuladoReal,
      volumenExcedente: volumenAcumuladoReal - volumenAcumuladoProyecto,
      proyecto: proyecto,
      estadisticas: {
        datoMaximo,
        datoMinimo,
        datoPromedio,
        desviacionEstandar,
        numeroDeterminaciones: n
      },
      verificacion: {
        espesorNominal,
        requisitoPromedio,
        requisitoDesviacion,
        cumplePromedio,
        cumpleDesviacion
      },
      evaluacionZonas: {
        zonaRellenoExcesivo,
        zonaDentroTolerancia,
        zonaEspesorInsuficiente,
        estadoInspeccion
      }
    };
  }, [proyecto, mediciones, lecturas]);

  const handleGenerarPDF = () => {
    const reporteData = {
      tipo: 'liberacion_topografia',
      datosReporte: {
        ...datosReporte,
        proyecto: proyecto,
        fechaGeneracion: new Date().toISOString(),
        encargados: proyecto.encargados || []
      }
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
            Seleccione un proyecto para generar el reporte de liberación de pavimentación.
          </p>
        </div>
      </div>
    );
  }

  if (!datosReporte) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Datos Insuficientes</h3>
          <p className="text-gray-600">
            Para generar el reporte de liberación se requieren:
            <br />• Estaciones configuradas (diseño)
            <br />• Mediciones registradas (campo)
            <br />• Lecturas capturadas (divisiones transversales)
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
              Liberación de Pavimentación por Topografía
            </h2>
            <p className="text-sm text-gray-600 mb-4">Código TOP‑FM‑05 (versión 0.1)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-1">
                <p><span className="font-medium">Proyecto:</span> {proyecto.nombre}</p>
                <p><span className="font-medium">Tramo:</span> {proyecto.tramo || `${formatearKM(proyecto.km_inicial)} AL ${formatearKM(proyecto.km_final)}`}</p>
                <p><span className="font-medium">Patio:</span> {proyecto.cuerpo || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-medium">Folio:</span> LIB-{proyecto.id}</p>
                <p><span className="font-medium">Contrato:</span> {proyecto.contrato || 'N/A'}</p>
                <p><span className="font-medium">Fecha:</span> {formatDate(new Date())}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleGenerarPDF}
            disabled={isGenerating || datosReporte.estacionesData.length === 0}
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
                Generar PDF Oficial
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen volumétrico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(datosReporte.volumenProyecto, 2)}</div>
          <div className="text-sm text-blue-800">Volumen de Proyecto (m³)</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{formatNumber(datosReporte.volumenRealBase, 2)}</div>
          <div className="text-sm text-green-800">Volumen Real Base (m³)</div>
        </div>
        <div className={`p-4 rounded-lg text-center ${datosReporte.volumenExcedente >= 0 ? 'bg-orange-50' : 'bg-red-50'}`}>
          <div className={`text-2xl font-bold ${datosReporte.volumenExcedente >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
            {datosReporte.volumenExcedente >= 0 ? '+' : ''}{formatNumber(datosReporte.volumenExcedente, 2)}
          </div>
          <div className={`text-sm ${datosReporte.volumenExcedente >= 0 ? 'text-orange-800' : 'text-red-800'}`}>
            Volumen Excedente (m³)
          </div>
        </div>
      </div>

      {/* Estadísticas de espesores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadística de Espesores</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Dato máximo (m):</span>
              <span className="font-bold text-red-600">{formatNumber(datosReporte.estadisticas.datoMaximo, 6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Dato mínimo (m):</span>
              <span className="font-bold text-green-600">{formatNumber(datosReporte.estadisticas.datoMinimo, 6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Dato promedio (ē):</span>
              <span className="font-bold text-blue-600">{formatNumber(datosReporte.estadisticas.datoPromedio, 6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Desviación estándar (s):</span>
              <span className="font-bold text-purple-600">{formatNumber(datosReporte.estadisticas.desviacionEstandar, 6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Número de determinaciones (n):</span>
              <span className="font-bold text-gray-900">{datosReporte.estadisticas.numeroDeterminaciones}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verificación de Especificaciones</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border">
              <p className="text-sm text-gray-600">Espesor nominal de proyecto (e):</p>
              <p className="font-bold text-gray-900">{formatNumber(datosReporte.verificacion.espesorNominal, 3)} m</p>
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded border ${datosReporte.verificacion.cumplePromedio ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm font-medium">ē ≥ 0.98 e</p>
                <p className={`font-bold ${datosReporte.verificacion.cumplePromedio ? 'text-green-600' : 'text-red-600'}`}>
                  {datosReporte.verificacion.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'}
                </p>
              </div>
              <div className={`p-3 rounded border ${datosReporte.verificacion.cumpleDesviacion ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm font-medium">s ≤ 0.10 e</p>
                <p className={`font-bold ${datosReporte.verificacion.cumpleDesviacion ? 'text-green-600' : 'text-red-600'}`}>
                  {datosReporte.verificacion.cumpleDesviacion ? 'CUMPLE' : 'NO CUMPLE'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluación por zonas */}
      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 mb-8">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Evaluación General en Volúmenes</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{datosReporte.evaluacionZonas.zonaRellenoExcesivo}</div>
            <div className="text-sm text-gray-600">Relleno Excesivo</div>
            <div className="text-xs text-gray-500">(&gt; {formatNumber(datosReporte.verificacion.espesorNominal + 0.001, 3)}m)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{datosReporte.evaluacionZonas.zonaDentroTolerancia}</div>
            <div className="text-sm text-gray-600">Dentro Tolerancia</div>
            <div className="text-xs text-gray-500">
              ({formatNumber(datosReporte.verificacion.espesorNominal - 0.004, 3)} - {formatNumber(datosReporte.verificacion.espesorNominal, 3)}m)
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{datosReporte.evaluacionZonas.zonaEspesorInsuficiente}</div>
            <div className="text-sm text-gray-600">Espesor Insuficiente</div>
            <div className="text-xs text-gray-500">(&lt; {formatNumber(datosReporte.verificacion.espesorNominal - 0.004, 3)}m)</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${datosReporte.evaluacionZonas.estadoInspeccion === 'CONFORME' ? 'text-green-600' : 'text-red-600'}`}>
              {datosReporte.evaluacionZonas.estadoInspeccion}
            </div>
            <div className="text-sm text-gray-600">Estado de Inspección</div>
          </div>
        </div>
      </div>

      {/* Vista previa de la tabla de determinaciones */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tabla de Determinaciones por Estación (Primeras 5 estaciones)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estación</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corte Terr (m)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">RT. Proyecto (m)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Real a RT. Proy. (m)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Esp. Prom (m)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Área (m²)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Volumen Parcial (m³)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Volumen Acumulado (m³)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosReporte.estacionesData.slice(0, 5).map((estacion, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-center text-gray-900">
                    {estacion.estacion}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {formatNumber(estacion.corteTerreno, 3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {formatNumber(estacion.rtProyecto, 3)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-center font-medium ${
                    estacion.realRtProyecto >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {estacion.realRtProyecto >= 0 ? '+' : ''}{formatNumber(estacion.realRtProyecto, 6)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {formatNumber(estacion.espesorPromedio, 3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {formatNumber(estacion.area, 1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {formatNumber(estacion.volumenParcial, 2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                    {formatNumber(estacion.volumenAcumulado, 2)}
                  </td>
                </tr>
              ))}
              {datosReporte.estacionesData.length > 5 && (
                <tr>
                  <td colSpan="8" className="px-4 py-3 text-center text-sm text-gray-500 bg-gray-50">
                    ... y {datosReporte.estacionesData.length - 5} estaciones más en el PDF completo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información de firmas */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Información del Reporte Oficial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Contenido del PDF:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Header oficial CEMEX con datos del proyecto</li>
              <li>• Tabla completa de determinaciones por estación</li>
              <li>• Resumen de volúmenes (proyecto, real, excedente)</li>
              <li>• Estadística completa de espesores</li>
              <li>• Verificación de especificaciones técnicas</li>
              <li>• Evaluación por zonas según criterios SCT</li>
              <li>• Espacios para firmas de responsables</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Responsables del Reporte:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              {proyecto.encargados && proyecto.encargados.length > 0 ? (
                proyecto.encargados.map((encargado, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <p className="font-medium">{encargado.nombre}</p>
                    <p className="text-xs text-gray-600">{encargado.cargo}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white p-2 rounded border">
                  <p className="text-gray-600">No se han definido encargados</p>
                  <p className="text-xs text-gray-500">Configure los responsables en el proyecto</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-sm text-blue-800">
            <strong>Referencia normativa:</strong> N‑CTR‑CAR‑1‑04‑009/20, apartados H.4.6 y H.4.7
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReporteLiberacionTopografia;