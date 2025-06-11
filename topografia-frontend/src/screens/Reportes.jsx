import React, { useState } from 'react';
import { 
  useProyectos,
  useExportarMediciones,
  useExportarLecturas,
  useExportarProyecto 
} from '../hooks';
import { formatDate, formatNumber } from '../utils/formatters';

const Reportes = () => {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [tipoReporte, setTipoReporte] = useState('');
  const [parametrosReporte, setParametrosReporte] = useState({
    formato: 'pdf',
    incluir_graficos: true,
    incluir_estadisticas: true,
    filtro_fecha_desde: '',
    filtro_fecha_hasta: '',
    nivel_detalle: 'completo'
  });

  // Hooks para datos y exportación
  const { data: proyectos } = useProyectos();
  const exportarMediciones = useExportarMediciones();
  const exportarLecturas = useExportarLecturas();
  const exportarProyecto = useExportarProyecto();

  const tiposReporte = [
    {
      id: 'proyecto_completo',
      nombre: 'Reporte Completo del Proyecto',
      descripcion: 'Incluye todas las estaciones, mediciones y análisis',
      icon: '📊',
      formatos: ['pdf', 'docx'],
      estimado: '2-5 min'
    },
    {
      id: 'mediciones',
      nombre: 'Reporte de Mediciones',
      descripcion: 'Listado detallado de todas las mediciones',
      icon: '📏',
      formatos: ['pdf', 'excel', 'csv'],
      estimado: '30 seg'
    },
    {
      id: 'lecturas',
      nombre: 'Reporte de Lecturas',
      descripcion: 'Datos de todas las lecturas y cálculos',
      icon: '📋',
      formatos: ['pdf', 'excel', 'csv'],
      estimado: '1-2 min'
    },
    {
      id: 'estadisticas',
      nombre: 'Reporte Estadístico',
      descripcion: 'Análisis estadístico y gráficos de rendimiento',
      icon: '📈',
      formatos: ['pdf'],
      estimado: '1 min'
    },
    {
      id: 'control_calidad',
      nombre: 'Control de Calidad',
      descripcion: 'Validación de datos y detección de anomalías',
      icon: '✅',
      formatos: ['pdf', 'excel'],
      estimado: '2 min'
    },
    {
      id: 'topografico',
      nombre: 'Plano Topográfico',
      descripcion: 'Representación gráfica del levantamiento',
      icon: '🗺️',
      formatos: ['pdf', 'dwg', 'kml'],
      estimado: '3-5 min'
    }
  ];

  const handleGenerarReporte = async () => {
    if (!proyectoSeleccionado || !tipoReporte) {
      alert('Por favor selecciona un proyecto y tipo de reporte');
      return;
    }

    try {
      let resultado;
      
      switch (tipoReporte) {
        case 'proyecto_completo':
          resultado = await exportarProyecto.mutateAsync({
            proyectoId: proyectoSeleccionado,
            formato: parametrosReporte.formato,
            configuracion: parametrosReporte
          });
          break;
          
        case 'mediciones':
          resultado = await exportarMediciones.mutateAsync({
            proyectoId: proyectoSeleccionado,
            formato: parametrosReporte.formato,
            filtros: {
              fecha_desde: parametrosReporte.filtro_fecha_desde,
              fecha_hasta: parametrosReporte.filtro_fecha_hasta
            }
          });
          break;
          
        case 'lecturas':
          resultado = await exportarLecturas.mutateAsync({
            proyectoId: proyectoSeleccionado,
            formato: parametrosReporte.formato,
            configuracion: parametrosReporte
          });
          break;
          
        default:
          // Para otros tipos de reporte, simular generación
          await new Promise(resolve => setTimeout(resolve, 2000));
          resultado = {
            url: '#',
            nombre: `reporte_${tipoReporte}_${Date.now()}.${parametrosReporte.formato}`
          };
      }

      // Simular descarga
      if (resultado.url) {
        const link = document.createElement('a');
        link.href = resultado.url;
        link.download = resultado.nombre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      alert('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Por favor intenta nuevamente.');
    }
  };

  const proyectoSeleccionadoData = proyectos?.find(p => p.id === parseInt(proyectoSeleccionado));
  const tipoReporteData = tiposReporte.find(t => t.id === tipoReporte);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          Genera reportes personalizados de tus proyectos topográficos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de proyecto */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. Seleccionar Proyecto
            </h2>
            
            <select
              value={proyectoSeleccionado || ''}
              onChange={(e) => setProyectoSeleccionado(e.target.value || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Seleccionar proyecto...</option>
              {proyectos?.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>

            {proyectoSeleccionadoData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{proyectoSeleccionadoData.nombre}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Estado:</span> {proyectoSeleccionadoData.estado}
                  </div>
                  <div>
                    <span className="font-medium">Creado:</span> {formatDate(proyectoSeleccionadoData.fecha_creacion)}
                  </div>
                  {proyectoSeleccionadoData.ubicacion && (
                    <div className="col-span-2">
                      <span className="font-medium">Ubicación:</span> {proyectoSeleccionadoData.ubicacion}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selección de tipo de reporte */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              2. Tipo de Reporte
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiposReporte.map((tipo) => (
                <div
                  key={tipo.id}
                  onClick={() => setTipoReporte(tipo.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    tipoReporte === tipo.id
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tipo.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{tipo.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">{tipo.descripcion}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Tiempo: {tipo.estimado}</span>
                        <div className="flex gap-1">
                          {tipo.formatos.map((formato) => (
                            <span key={formato} className="bg-gray-100 px-1 rounded">
                              {formato.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración avanzada */}
          {tipoReporte && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                3. Configuración
              </h2>
              
              <div className="space-y-4">
                {/* Formato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de salida
                  </label>
                  <select
                    value={parametrosReporte.formato}
                    onChange={(e) => setParametrosReporte({
                      ...parametrosReporte,
                      formato: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {tipoReporteData?.formatos.map((formato) => (
                      <option key={formato} value={formato}>
                        {formato.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtros de fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha desde
                    </label>
                    <input
                      type="date"
                      value={parametrosReporte.filtro_fecha_desde}
                      onChange={(e) => setParametrosReporte({
                        ...parametrosReporte,
                        filtro_fecha_desde: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha hasta
                    </label>
                    <input
                      type="date"
                      value={parametrosReporte.filtro_fecha_hasta}
                      onChange={(e) => setParametrosReporte({
                        ...parametrosReporte,
                        filtro_fecha_hasta: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                {/* Opciones adicionales */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Opciones adicionales
                  </label>
                  
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parametrosReporte.incluir_graficos}
                        onChange={(e) => setParametrosReporte({
                          ...parametrosReporte,
                          incluir_graficos: e.target.checked
                        })}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Incluir gráficos</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parametrosReporte.incluir_estadisticas}
                        onChange={(e) => setParametrosReporte({
                          ...parametrosReporte,
                          incluir_estadisticas: e.target.checked
                        })}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Incluir estadísticas</span>
                    </label>
                  </div>
                </div>

                {/* Nivel de detalle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de detalle
                  </label>
                  <select
                    value={parametrosReporte.nivel_detalle}
                    onChange={(e) => setParametrosReporte({
                      ...parametrosReporte,
                      nivel_detalle: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="resumen">Resumen</option>
                    <option value="completo">Completo</option>
                    <option value="detallado">Detallado</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de vista previa y acciones */}
        <div className="space-y-6">
          {/* Resumen de configuración */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
            
            {proyectoSeleccionado && tipoReporte ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Proyecto:</span>
                  <p className="text-gray-600">{proyectoSeleccionadoData?.nombre}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tipo:</span>
                  <p className="text-gray-600">{tipoReporteData?.nombre}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Formato:</span>
                  <p className="text-gray-600">{parametrosReporte.formato.toUpperCase()}</p>
                </div>
                {parametrosReporte.filtro_fecha_desde && (
                  <div>
                    <span className="font-medium text-gray-700">Período:</span>
                    <p className="text-gray-600">
                      {formatDate(parametrosReporte.filtro_fecha_desde)} - {
                        parametrosReporte.filtro_fecha_hasta ? 
                        formatDate(parametrosReporte.filtro_fecha_hasta) : 
                        'Presente'
                      }
                    </p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Tiempo estimado:</span>
                  <p className="text-gray-600">{tipoReporteData?.estimado}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Selecciona un proyecto y tipo de reporte para ver el resumen
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <button
              onClick={handleGenerarReporte}
              disabled={
                !proyectoSeleccionado || 
                !tipoReporte || 
                exportarMediciones.isLoading || 
                exportarLecturas.isLoading || 
                exportarProyecto.isLoading
              }
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportarMediciones.isLoading || exportarLecturas.isLoading || exportarProyecto.isLoading
                ? 'Generando reporte...'
                : 'Generar Reporte'
              }
            </button>
            
            <div className="mt-4 space-y-2">
              <button className="w-full text-yellow-600 hover:text-yellow-700 text-sm font-medium py-2 transition-colors">
                Vista previa
              </button>
              <button className="w-full text-gray-600 hover:text-gray-700 text-sm font-medium py-2 transition-colors">
                Programar generación
              </button>
            </div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Consejos</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Los reportes PDF son ideales para presentaciones</li>
              <li>• Usa Excel/CSV para análisis posteriores</li>
              <li>• Los formatos KML permiten visualización en Google Earth</li>
              <li>• Los reportes detallados incluyen más información técnica</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
