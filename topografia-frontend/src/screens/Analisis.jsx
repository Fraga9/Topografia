import React, { useState, useMemo } from 'react';
import { 
  useProyectos,
  useEstadisticasEstaciones,
  useEstadisticasMediciones,
  useEstadisticasLecturas,
  useLecturas
} from '../hooks';
import { formatNumber, formatDate } from '../utils/formatters';

const Analisis = () => {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('resumen');
  const [filtroFecha, setFiltroFecha] = useState({
    desde: '',
    hasta: ''
  });

  // Hooks para datos de análisis
  const { data: proyectos } = useProyectos();
  const { data: estadisticasEstaciones } = useEstadisticasEstaciones(proyectoSeleccionado);
  const { data: estadisticasMediciones } = useEstadisticasMediciones(proyectoSeleccionado);
  const { data: estadisticasLecturas } = useEstadisticasLecturas(proyectoSeleccionado);
  const { data: lecturas } = useLecturas({ 
    proyecto_id: proyectoSeleccionado,
    ...filtroFecha 
  });

  // Calcular estadísticas derivadas
  const analisisCalculado = useMemo(() => {
    if (!lecturas || !lecturas.length) return null;

    const elevaciones = lecturas.map(l => l.elevacion_calculada).filter(e => e !== null);
    const distancias = lecturas.map(l => l.distancia_horizontal).filter(d => d !== null);
    
    return {
      promedio_elevacion: elevaciones.reduce((a, b) => a + b, 0) / elevaciones.length,
      min_elevacion: Math.min(...elevaciones),
      max_elevacion: Math.max(...elevaciones),
      rango_elevacion: Math.max(...elevaciones) - Math.min(...elevaciones),
      promedio_distancia: distancias.reduce((a, b) => a + b, 0) / distancias.length,
      total_puntos: lecturas.length,
      puntos_con_errores: lecturas.filter(l => l.calidad === 'malo').length,
      precision_promedio: lecturas.reduce((sum, l) => sum + (l.precision || 0), 0) / lecturas.length
    };
  }, [lecturas]);

  const renderResumen = () => (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            titulo: 'Total de Puntos',
            valor: analisisCalculado?.total_puntos || 0,
            color: 'blue',
            icon: '📍',
            descripcion: 'Lecturas procesadas'
          },
          {
            titulo: 'Rango de Elevación',
            valor: analisisCalculado ? `${formatNumber(analisisCalculado.rango_elevacion, 2)} m` : '0 m',
            color: 'green',
            icon: '⛰️',
            descripcion: 'Diferencia máx-mín'
          },
          {
            titulo: 'Precisión Promedio',
            valor: analisisCalculado ? `±${formatNumber(analisisCalculado.precision_promedio, 3)} m` : '±0 m',
            color: 'purple',
            icon: '🎯',
            descripcion: 'Error estimado'
          },
          {
            titulo: 'Calidad de Datos',
            valor: analisisCalculado 
              ? `${Math.round((1 - analisisCalculado.puntos_con_errores / analisisCalculado.total_puntos) * 100)}%`
              : '0%',
            color: 'yellow',
            icon: '✅',
            descripcion: 'Puntos válidos'
          }
        ].map((stat) => (
          <div key={stat.titulo} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                <p className={`text-2xl font-semibold text-${stat.color}-600 mt-1`}>
                  {stat.valor}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.descripcion}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos de análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de elevaciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Elevaciones
          </h3>
          
          {analisisCalculado ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Mínima: {formatNumber(analisisCalculado.min_elevacion, 2)} m</span>
                <span>Máxima: {formatNumber(analisisCalculado.max_elevacion, 2)} m</span>
              </div>
              
              {/* Barra de progreso visual */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                Promedio: {formatNumber(analisisCalculado.promedio_elevacion, 2)} m
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay datos de elevación disponibles
            </div>
          )}
        </div>

        {/* Calidad por zona */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Análisis de Calidad
          </h3>
          
          {lecturas && lecturas.length > 0 ? (
            <div className="space-y-3">
              {['excelente', 'bueno', 'regular', 'malo'].map((calidad) => {
                const count = lecturas.filter(l => l.calidad === calidad).length;
                const percentage = (count / lecturas.length) * 100;
                const colors = {
                  excelente: 'bg-green-500',
                  bueno: 'bg-blue-500',
                  regular: 'bg-yellow-500',
                  malo: 'bg-red-500'
                };
                
                return (
                  <div key={calidad} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {calidad}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[calidad]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay datos de calidad disponibles
            </div>
          )}
        </div>
      </div>

      {/* Tabla de estadísticas detalladas */}
      {estadisticasEstaciones && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estadísticas por Estación
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elevación Prom.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estadisticasEstaciones.estaciones?.map((estacion) => (
                  <tr key={estacion.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {estacion.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estacion.total_lecturas || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(estacion.elevacion_promedio, 2)} m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ±{formatNumber(estacion.precision_promedio, 3)} m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        estacion.calidad_promedio > 0.8 
                          ? 'bg-green-100 text-green-800'
                          : estacion.calidad_promedio > 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {estacion.calidad_promedio > 0.8 ? 'Excelente' : 
                         estacion.calidad_promedio > 0.6 ? 'Bueno' : 'Requiere revisión'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderComparacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparación Temporal
        </h3>
        
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Funcionalidad de comparación en desarrollo</p>
          <p className="text-sm mt-1">Próximamente: gráficos comparativos y análisis de tendencias</p>
        </div>
      </div>
    </div>
  );

  const renderExportacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Exportar Análisis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { formato: 'PDF', descripcion: 'Reporte completo con gráficos', icon: '📄' },
            { formato: 'Excel', descripcion: 'Datos tabulares para análisis', icon: '📊' },
            { formato: 'CSV', descripcion: 'Datos en formato separado por comas', icon: '📋' },
            { formato: 'KML', descripcion: 'Para visualización en Google Earth', icon: '🌍' }
          ].map((export_type) => (
            <button
              key={export_type.formato}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{export_type.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{export_type.formato}</h4>
                  <p className="text-sm text-gray-600">{export_type.descripcion}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis de Datos</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y analiza los datos topográficos recolectados
          </p>
        </div>
        
        {/* Selector de proyecto */}
        <div className="flex items-center gap-4">
          <select
            value={proyectoSeleccionado || ''}
            onChange={(e) => setProyectoSeleccionado(e.target.value || null)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleccionar proyecto</option>
            {proyectos?.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {proyectoSeleccionado ? (
        <>
          {/* Navegación de pestañas */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'resumen', label: 'Resumen General', icon: '📊' },
                { id: 'comparacion', label: 'Comparación', icon: '📈' },
                { id: 'exportacion', label: 'Exportar', icon: '💾' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVistaActiva(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    vistaActiva === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Filtros de fecha */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium text-gray-700">Filtros:</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Desde:</label>
                <input
                  type="date"
                  value={filtroFecha.desde}
                  onChange={(e) => setFiltroFecha({...filtroFecha, desde: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Hasta:</label>
                <input
                  type="date"
                  value={filtroFecha.hasta}
                  onChange={(e) => setFiltroFecha({...filtroFecha, hasta: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                onClick={() => setFiltroFecha({ desde: '', hasta: '' })}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Contenido según pestaña activa */}
          <div>
            {vistaActiva === 'resumen' && renderResumen()}
            {vistaActiva === 'comparacion' && renderComparacion()}
            {vistaActiva === 'exportacion' && renderExportacion()}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona un proyecto para comenzar
          </h3>
          <p className="text-gray-600">
            Elige un proyecto de la lista superior para ver el análisis detallado de sus datos.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analisis;
