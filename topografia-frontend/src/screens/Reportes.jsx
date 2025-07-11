import React, { useState, useMemo } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { useEstaciones, useMediciones } from '../hooks';
import { useLecturas } from '../hooks/lecturas';
import { ReporteLiberacionTopografia } from '../components/reportes';
import PDFService from '../services/pdfService';
import PDFMakeComplete from '../services/pdfMakeComplete';

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState('liberacion');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Obtener datos del proyecto seleccionado
  const { proyecto, tieneProyecto, descripcionCompleta, rangoKM } = useProyecto();
  
  // Obtener datos necesarios para los reportes
  const { 
    data: estaciones = [], 
    isLoading: loadingEstaciones 
  } = useEstaciones(proyecto?.id, { enabled: !!proyecto?.id });

  const { 
    data: mediciones = [], 
    isLoading: loadingMediciones 
  } = useMediciones({ proyecto_id: proyecto?.id, enabled: !!proyecto?.id });

  // Crear array fijo para mantener orden de hooks - mismo patrón que Analisis.jsx
  const medicionesSeguras = Array.isArray(mediciones) ? mediciones : [];
  
  // Obtener todas las lecturas de todas las mediciones - SIEMPRE ejecutar con array fijo
  const lecturasQueries = [
    // Máximo 20 consultas simultáneas para evitar problemas de rendimiento
    ...Array.from({ length: Math.max(20, medicionesSeguras.length) }, (_, index) => {
      const medicion = medicionesSeguras[index];
      return useLecturas(
        medicion?.id || null, 
        {}, 
        { enabled: !!medicion?.id }
      );
    })
  ];

  // Consolidar todas las lecturas - mismo patrón que Analisis.jsx
  const lecturas = useMemo(() => {
    return lecturasQueries
      .slice(0, medicionesSeguras.length) // Solo usar las queries que corresponden a mediciones reales
      .map(query => query?.data || [])
      .flat()
      .filter(lectura => lectura && lectura.elv_base_real !== null);
  }, [lecturasQueries, medicionesSeguras.length]);

  // Calcular estado de carga
  const loadingLecturas = lecturasQueries
    .slice(0, medicionesSeguras.length)
    .some(query => query.isLoading);

  const tiposReporte = [
    {
      id: 'liberacion',
      nombre: 'Liberación de Pavimentación por Topografía',
      descripcion: 'Reporte oficial TOP-FM-05 con análisis volumétrico, estadísticas de espesores y verificación de especificaciones SCT',
      icon: '📋',
      color: 'red',
      requerimientos: ['estaciones_configuradas', 'mediciones_registradas', 'lecturas_capturadas']
    }
  ];

  // Función para manejar la generación de reportes con PDF nativo
  const handleGenerarReporte = async (reporteData) => {
    setIsGenerating(true);
    
    try {
      console.log('Generando reporte PDF:', reporteData);
      
      // Crear instancia del servicio PDF completo con pdfMake
      const pdfService = new PDFMakeComplete();
      
      // Generar PDF según el tipo de reporte
      let pdfDoc;
      const fechaHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      let nombreArchivo;
      
      switch (reporteData.tipo) {
        case 'liberacion_topografia':
          pdfDoc = await pdfService.generateLiberacionTopografiaReport(
            proyecto, 
            reporteData.datosReporte
          );
          nombreArchivo = `Liberacion_Topografia_TOP-FM-05_${proyecto.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${fechaHora}.pdf`;
          break;
          
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      // Descargar el PDF
      pdfService.lastGeneratedPdf = pdfDoc;
      pdfService.downloadPDF(nombreArchivo);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(`Reporte "${nombreArchivo}" generado y descargado exitosamente.`);
      }, 500);
      
    } catch (error) {
      console.error('Error generando reporte PDF:', error);
      alert('Error al generar el reporte PDF. Por favor intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Verificar si se cumplen los requerimientos para cada tipo de reporte
  const verificarRequerimientos = (requerimientos) => {
    const checks = {
      estaciones_configuradas: estaciones.length > 0, // EstacionTeorica - estaciones con diseño definido
      mediciones_registradas: mediciones.length > 0,  // MedicionEstacion - mediciones de campo
      lecturas_capturadas: lecturas.length > 0        // LecturaDivision - lecturas de divisiones transversales
    };
    
    return requerimientos.every(req => checks[req]);
  };

  const tipoReporteSeleccionado = tiposReporte.find(t => t.id === tipoReporte);

  // Estado de carga
  if (loadingEstaciones || loadingMediciones || loadingLecturas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando datos del proyecto</h2>
            <p className="text-gray-600">Preparando información para los reportes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista cuando no hay proyecto seleccionado
  if (!tieneProyecto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="text-center max-w-md">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
                <div className="bg-slate-100 rounded-2xl p-4 w-fit mx-auto mb-6">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  Generar Reportes
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Para generar reportes del proyecto, primero debes seleccionar un proyecto activo desde el banco de proyectos.
                </p>
                <button
                  onClick={() => window.location.href = '/proyectos'}
                  className="bg-slate-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-700 transition-all duration-300 transform hover:scale-[1.02] inline-flex items-center space-x-3 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Seleccionar Proyecto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Reportes</h1>
              <p className="text-slate-600">{descripcionCompleta}</p>
              <p className="text-sm text-slate-500">Rango: KM {rangoKM}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm text-slate-600">Proyecto Activo</span>
            </div>
          </div>
        </div>

        {/* Selector de tipo de reporte */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Reporte de Liberación de Pavimentación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiposReporte.map((tipo) => {
              const cumpleRequerimientos = verificarRequerimientos(tipo.requerimientos);
              const isSelected = tipoReporte === tipo.id;
              
              return (
                <div
                  key={tipo.id}
                  onClick={() => cumpleRequerimientos && setTipoReporte(tipo.id)}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected
                      ? `border-${tipo.color}-500 bg-${tipo.color}-50 shadow-lg`
                      : cumpleRequerimientos
                        ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {!cumpleRequerimientos && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{tipo.icon}</div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-2 ${
                        isSelected ? `text-${tipo.color}-900` : 'text-gray-900'
                      }`}>
                        {tipo.nombre}
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        isSelected ? `text-${tipo.color}-700` : 'text-gray-600'
                      }`}>
                        {tipo.descripcion}
                      </p>
                      
                      {!cumpleRequerimientos && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <span className="font-medium">Requerimientos faltantes:</span>
                          <ul className="mt-1 space-y-1">
                            {tipo.requerimientos.map(req => {
                              const checks = {
                                estaciones_configuradas: estaciones.length > 0,
                                mediciones_registradas: mediciones.length > 0,
                                lecturas_capturadas: lecturas.length > 0
                              };
                              if (!checks[req]) {
                                const nombres = {
                                  estaciones_configuradas: 'Estaciones configuradas (diseño definido)',
                                  mediciones_registradas: 'Mediciones registradas (campo)',
                                  lecturas_capturadas: 'Lecturas capturadas (divisiones transversales)'
                                };
                                return <li key={req}>• {nombres[req]}</li>;
                              }
                              return null;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Componente de reporte seleccionado */}
        {tipoReporte && verificarRequerimientos(tipoReporteSeleccionado.requerimientos) && (
          <div className="transition-all duration-500 ease-in-out">
            {tipoReporte === 'liberacion' && (
              <ReporteLiberacionTopografia
                proyecto={proyecto}
                estaciones={estaciones}
                mediciones={mediciones}
                lecturas={lecturas}
                onGenerar={handleGenerarReporte}
                isGenerating={isGenerating}
              />
            )}
          </div>
        )}

        {/* Estadísticas rápidas del proyecto */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado Actual del Proyecto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{estaciones.length}</div>
              <div className="text-sm text-blue-800">Estaciones Configuradas</div>
              <div className="text-xs text-blue-600">Diseño definido</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mediciones.length}</div>
              <div className="text-sm text-green-800">Mediciones Registradas</div>
              <div className="text-xs text-green-600">Campo</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{lecturas.length}</div>
              <div className="text-sm text-purple-800">Lecturas Capturadas</div>
              <div className="text-xs text-purple-600">Divisiones transversales</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {estaciones.length > 0 ? Math.round((mediciones.length / estaciones.length) * 100) : 0}%
              </div>
              <div className="text-sm text-amber-800">Progreso General</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;