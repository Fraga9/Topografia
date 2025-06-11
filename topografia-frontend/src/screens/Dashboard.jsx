import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProyectos, useAuth } from '../hooks';
import { useProyecto } from '../hooks/useProyecto';
import { useEstaciones } from '../hooks/estaciones/useEstaciones';
import { useMediciones } from '../hooks/mediciones/useMediciones';
import { formatDate } from '../utils/formatters';
import { TrendingUp, AlertCircle, CheckCircle, Clock, FolderPlus, BarChart3, Settings, MapPin, FileText, Play } from "lucide-react";

const Dashboard = () => {
  const { usuario } = useAuth();
  const { data: proyectos, isLoading, error } = useProyectos();
  const navigate = useNavigate();
  
  // Usar el hook del context para obtener el proyecto seleccionado
  const { proyecto: proyectoSeleccionado, tieneProyecto, descripcionCompleta, rangoKM } = useProyecto();

  // Encontrar el proyecto completo desde la lista (para tener todos los datos)
  const proyecto = proyectos?.find(p => p.id === proyectoSeleccionado?.id) || proyectoSeleccionado;

  // 🔍 OBTENER DATOS REALES DEL PROYECTO
  const { 
    data: estaciones, 
    isLoading: isLoadingEstaciones, 
    error: errorEstaciones 
  } = useEstaciones(proyecto?.id);

  const { 
    data: mediciones, 
    isLoading: isLoadingMediciones, 
    error: errorMediciones 
  } = useMediciones({ proyecto_id: proyecto?.id });

  // 🔧 DEBUGGING COMPLETO - Ver toda la información disponible
  React.useEffect(() => {
    if (proyecto) {
      console.group('🔍 DEBUGGING COMPLETO - Dashboard con Datos Reales');
      
      // 1. Información del proyecto
      console.log('📋 PROYECTO COMPLETO:', proyecto);
      console.log('- ID:', proyecto.id);
      console.log('- Nombre:', proyecto.nombre);
      console.log('- Tramo:', proyecto.tramo);
      console.log('- Cuerpo:', proyecto.cuerpo);
      console.log('- KM Inicial:', proyecto.km_inicial);
      console.log('- KM Final:', proyecto.km_final);
      console.log('- Intervalo:', proyecto.intervalo);
      console.log('- Espesor:', proyecto.espesor);
      console.log('- Tolerancia SCT:', proyecto.tolerancia_sct);
      console.log('- Estado:', proyecto.estado);
      console.log('- Fecha creación:', proyecto.fecha_creacion);
      console.log('- Usuario ID:', proyecto.usuario_id);
      
      // Verificar si hay campos adicionales
      const camposConocidos = ['id', 'nombre', 'tramo', 'cuerpo', 'km_inicial', 'km_final', 'intervalo', 'espesor', 'tolerancia_sct', 'estado', 'fecha_creacion', 'usuario_id'];
      const camposAdicionales = Object.keys(proyecto).filter(key => !camposConocidos.includes(key));
      if (camposAdicionales.length > 0) {
        console.log('- Campos adicionales encontrados:', camposAdicionales);
        camposAdicionales.forEach(campo => {
          console.log(`  * ${campo}:`, proyecto[campo]);
        });
      }

      // 2. Información de estaciones
      console.log('🏭 ESTACIONES:');
      console.log('- Loading:', isLoadingEstaciones);
      console.log('- Error:', errorEstaciones);
      console.log('- Cantidad total:', estaciones?.length || 0);
      console.log('- Datos completos:', estaciones);
      
      if (estaciones?.length > 0) {
        console.log('- Primera estación (muestra):', estaciones[0]);
        const camposEstacion = Object.keys(estaciones[0]);
        console.log('- Campos disponibles en estaciones:', camposEstacion);
      }

      // 3. Información de mediciones
      console.log('📏 MEDICIONES:');
      console.log('- Loading:', isLoadingMediciones);
      console.log('- Error:', errorMediciones);
      console.log('- Cantidad total:', mediciones?.length || 0);
      console.log('- Datos completos:', mediciones);
      
      if (mediciones?.length > 0) {
        console.log('- Primera medición (muestra):', mediciones[0]);
        const camposMedicion = Object.keys(mediciones[0]);
        console.log('- Campos disponibles en mediciones:', camposMedicion);
      }

      // 4. Cálculos basados en datos reales
      const estacionesTotales = Math.ceil((proyecto.km_final - proyecto.km_inicial) / proyecto.intervalo);
      const estacionesConMediciones = mediciones?.length || 0;
      const progresoReal = estacionesTotales > 0 ? Math.round((estacionesConMediciones / estacionesTotales) * 100) : 0;
      
      console.log('📊 CÁLCULOS BASADOS EN DATOS REALES:');
      console.log('- Estaciones totales (calculadas):', estacionesTotales);
      console.log('- Estaciones con mediciones:', estacionesConMediciones);
      console.log('- Progreso real:', `${progresoReal}%`);
      console.log('- Estaciones pendientes:', estacionesTotales - estacionesConMediciones);

      // 5. Análisis de estructura de datos
      console.log('🔬 ANÁLISIS DE ESTRUCTURA:');
      console.log('- Context proyecto seleccionado:', proyectoSeleccionado);
      console.log('- Proyecto desde lista:', proyectos?.find(p => p.id === proyectoSeleccionado?.id));
      console.log('- Proyecto final usado:', proyecto);
      console.log('- Tiene proyecto:', tieneProyecto);
      console.log('- Descripción completa:', descripcionCompleta);
      console.log('- Rango KM:', rangoKM);

      console.groupEnd();
    }
  }, [proyecto, estaciones, mediciones, isLoadingEstaciones, isLoadingMediciones, errorEstaciones, errorMediciones, proyectoSeleccionado, proyectos, tieneProyecto, descripcionCompleta, rangoKM]);

  // 📊 DATOS CALCULADOS BASADOS EN INFORMACIÓN REAL
  const stats = React.useMemo(() => {
    if (!proyecto) return null;

    console.log('🧮 Calculando estadísticas reales...');

    // Calcular estaciones totales basado en parámetros reales del proyecto
    const estacionesTotales = Math.ceil((proyecto.km_final - proyecto.km_inicial) / proyecto.intervalo);
    const estacionesConMediciones = mediciones?.length || 0;
    const estacionesDefinidas = estaciones?.length || 0;
    
    // Progreso real basado en mediciones existentes
    const progresoReal = estacionesDefinidas > 0 ? Math.round((estacionesConMediciones / estacionesDefinidas) * 100) : 0;
    const completadasReal = estacionesConMediciones;
    const restantes = estacionesDefinidas - completadasReal;
    
    // Tiempo estimado basado en productividad real
    const tiempoEstimadoPorEstacion = 0.5; // horas por estación (configurable)
    const tiempoRestante = restantes * tiempoEstimadoPorEstacion;

    // Análisis de mediciones para obtener desviaciones y volúmenes reales
    let desviacionPromedio = "Sin datos";
    let volumenTotal = "Sin datos";
    let alertasCriticas = 0;
    let alertasWarning = 0;

    if (mediciones && mediciones.length > 0) {
      console.log('📊 Analizando mediciones para calcular métricas reales...');
      
      // Ejemplo de análisis básico (adaptar según estructura real de datos)
      const medicionesConDatos = mediciones.filter(m => m.elevacion !== undefined);
      if (medicionesConDatos.length > 0) {
        console.log('- Mediciones con elevación:', medicionesConDatos.length);
        // Aquí podrías calcular estadísticas reales de elevación, desviaciones, etc.
      }
    }

    const resultado = {
      progreso: `${progresoReal}%`,
      progresoNumerico: progresoReal,
      completadas: completadasReal,
      total: estacionesTotales,
      definidas: estacionesDefinidas,
      desviacion: desviacionPromedio,
      volumen: volumenTotal,
      tiempo: `${tiempoRestante.toFixed(1)}h`,
      alertasCriticas,
      alertasWarning,
      // Datos adicionales para debugging
      raw: {
        estacionesTotales,
        estacionesConMediciones,
        estacionesDefinidas,
        tiempoEstimadoPorEstacion,
        kmInicial: proyecto.km_inicial,
        kmFinal: proyecto.km_final,
        intervalo: proyecto.intervalo
      }
    };

    console.log('✅ Estadísticas calculadas:', resultado);
    return resultado;
  }, [proyecto, estaciones, mediciones]);

  // 🚨 ALERTAS REALES BASADAS EN DATOS DEL PROYECTO
  const alerts = React.useMemo(() => {
    if (!proyecto || !mediciones) return [];

    console.log('🚨 Generando alertas basadas en datos reales...');
    
    const alertasReales = [];
    
    if (mediciones.length === 0) {
      alertasReales.push({
        id: 'no-mediciones',
        station: `Proyecto ${proyecto.nombre}`,
        message: "No hay mediciones registradas",
        type: "warning",
        time: "N/A",
      });
    }

    if (estaciones && mediciones && estaciones.length > mediciones.length) {
      const estacionesPendientes = estaciones.length - mediciones.length;
      alertasReales.push({
        id: 'pendientes',
        station: `${estacionesPendientes} estaciones`,
        message: "Mediciones pendientes",
        type: "info",
        time: "Continuo",
      });
    }

    console.log('✅ Alertas generadas:', alertasReales);
    return alertasReales;
  }, [proyecto, mediciones, estaciones]);

  // Manejadores de navegación para acciones rápidas
  const handleVerAnalisis = () => navigate('/analisis');
  const handleTrabajoCampo = () => navigate('/campo');
  const handleGenerarReporte = () => navigate('/reportes');
  const handleVerTodasAlertas = () => navigate('/alertas');
  const handleSeleccionarProyecto = () => navigate('/proyectos');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 bg-slate-200 h-64 rounded-2xl"></div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-200 h-64 rounded-2xl"></div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-200 h-64 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-red-800 font-semibold mb-2">Error al cargar datos</h3>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista cuando no hay proyecto seleccionado
  if (!tieneProyecto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
              <div className="bg-slate-100 rounded-2xl p-4 w-fit mx-auto mb-6">
                <BarChart3 className="w-12 h-12 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Bienvenido al Dashboard
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Para comenzar a ver las métricas y análisis de tu proyecto, 
                primero debes seleccionar un proyecto activo desde el banco de proyectos.
              </p>
              <button
                onClick={handleSeleccionarProyecto}
                className="bg-slate-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-700 transition-all duration-300 transform hover:scale-[1.02] inline-flex items-center space-x-3 shadow-lg"
              >
                <FolderPlus className="w-5 h-5" />
                <span>Seleccionar Proyecto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header elegante */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h1>
            <p className="text-slate-600">{descripcionCompleta}</p>
            <p className="text-sm text-slate-500">Rango: KM {rangoKM}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm text-slate-600">Sistema Activo</span>
          </div>
        </div>
        
        {/* Debug info en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl text-xs">
            <p><strong>Debug:</strong> Proyecto ID: {proyecto?.id} | Estaciones: {estaciones?.length || 0} | Mediciones: {mediciones?.length || 0}</p>
          </div>
        )}
      </div>

      {/* Grid principal con tarjetas elegantes */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        
        {/* Tarjeta Principal - Progreso (Cemex Blue) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-xl border border-blue-500/20 transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-right">
                {isLoadingMediciones ? (
                  <div className="w-24 h-12 bg-white/10 rounded-lg animate-pulse"></div>
                ) : (
                  <div className="text-5xl font-bold mb-1">{stats?.progresoNumerico || 0}%</div>
                )}
                <div className="text-blue-100 text-sm">Completado</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold mb-3">Progreso del Proyecto</h3>
            <p className="text-blue-100 mb-6 text-lg">
              {stats?.completadas || 0} de {stats?.definidas || 0} estaciones medidas
            </p>
            
            {!isLoadingMediciones && (
              <div className="space-y-4">
                <div className="flex justify-between text-blue-100">
                  <span>Mediciones registradas</span>
                  <span className="font-semibold">{stats?.completadas || 0}/{stats?.definidas || 0}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-white to-blue-100 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                    style={{ width: `${stats?.progresoNumerico || 0}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.completadas || 0}</div>
                    <div className="text-xs text-blue-100">Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.definidas || 0}</div>
                    <div className="text-xs text-blue-100">Configuradas</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de Tiempo */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 transform hover:scale-[1.01] transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                {isLoadingMediciones ? (
                  <div className="w-16 h-10 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-bold text-slate-800">{stats?.tiempo || '0h'}</div>
                )}
                <div className="text-slate-600 text-sm">Estimado</div>
              </div>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2 text-lg">Tiempo Restante</h4>
            <p className="text-slate-600 text-sm mb-6">
              Para completar todas las mediciones pendientes
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Productividad:</span>
                <span className="font-medium text-slate-800">0.5h/estación</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Restantes:</span>
                <span className="font-medium text-slate-800">{(stats?.total || 0) - (stats?.completadas || 0)} estaciones</span>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-xs text-slate-600">Estimación automática</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Estaciones y Mediciones - Grid 2x2 */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 transform hover:scale-[1.01] transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                {isLoadingEstaciones ? (
                  <div className="w-12 h-8 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-2xl font-bold text-slate-800">{stats?.definidas || 0}</div>
                )}
                <div className="text-slate-600 text-sm">Estaciones</div>
              </div>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Configuradas</h4>
            <p className="text-slate-600 text-sm mb-4">
              Listas para medición en campo
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${stats?.definidas > 0 ? (stats.definidas / stats.definidas) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span className="text-xs text-slate-600">
                {stats?.definidas > 0 ? 'Configuradas' : 'Sin configurar'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 transform hover:scale-[1.01] transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                {isLoadingMediciones ? (
                  <div className="w-12 h-8 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-2xl font-bold text-slate-800">{stats?.completadas || 0}</div>
                )}
                <div className="text-slate-600 text-sm">Mediciones</div>
              </div>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Registradas</h4>
            <p className="text-slate-600 text-sm mb-4">
              Datos capturados y validados
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${stats?.progresoNumerico || 0}%` }}
              ></div>
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${(stats?.completadas || 0) > 0 ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
              <span className="text-xs text-slate-600">
                {(stats?.completadas || 0) > 0 ? 'En progreso' : 'Sin datos'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 h-full">
            <div className="bg-slate-100 rounded-xl p-3 w-fit mb-4">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-4">Especificaciones</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Intervalo:</span>
                <span className="font-medium text-slate-800">{proyecto?.intervalo || 0}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Longitud:</span>
                <span className="font-medium text-slate-800">{((proyecto?.km_final - proyecto?.km_inicial) || 0)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Espesor:</span>
                <span className="font-medium text-slate-800">{proyecto?.espesor || 0}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tolerancia SCT:</span>
                <span className="font-medium text-slate-800">±{((proyecto?.tolerancia_sct || 0) * 1000).toFixed(0)}mm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40 h-full">
            <div className="bg-slate-100 rounded-xl p-3 w-fit mb-4">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-4">Detalles del Proyecto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Tramo:</span>
                <span className="font-medium text-slate-800">{proyecto?.tramo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cuerpo:</span>
                <span className="font-medium text-slate-800">{proyecto?.cuerpo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">KM Inicial:</span>
                <span className="font-medium text-slate-800">
                  {proyecto?.km_inicial ? `${Math.floor(proyecto.km_inicial/1000)}+${String(proyecto.km_inicial%1000).padStart(3,'0')}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">KM Final:</span>
                <span className="font-medium text-slate-800">
                  {proyecto?.km_final ? `${Math.floor(proyecto.km_final/1000)}+${String(proyecto.km_final%1000).padStart(3,'0')}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estado:</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                  {proyecto?.estado || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Creado:</span>
                <span className="font-medium text-slate-800">
                  {proyecto?.fecha_creacion ? formatDate(proyecto.fecha_creacion) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas del Sistema */}
        <div className="col-span-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Alertas del Sistema</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                <span className="text-sm text-slate-600">{alerts.length} activas</span>
              </div>
            </div>
            
            {alerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-xl ${
                      alert.type === "critical"
                        ? "border-l-red-500 bg-red-50/80"
                        : alert.type === "warning"
                          ? "border-l-amber-500 bg-amber-50/80"
                          : "border-l-blue-500 bg-blue-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{alert.station}</p>
                        <p className="text-sm text-slate-600">{alert.message}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">{alert.time}</span>
                        <div className={`w-2 h-2 rounded-full mt-1 ml-auto ${
                          alert.type === "critical" ? "bg-red-500" : 
                          alert.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-emerald-100 rounded-full p-4 w-fit mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-slate-600 text-lg font-medium">No hay alertas activas</p>
                <p className="text-sm text-slate-500 mt-1">Sistema funcionando correctamente</p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button 
                onClick={handleVerTodasAlertas}
                className="bg-slate-800 text-white py-3 px-6 rounded-xl font-medium hover:bg-slate-700 transition-all duration-300 transform hover:scale-[1.01]"
              >
                Ver Todas las Alertas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={handleVerAnalisis}
            className="group p-6 text-left border-2 border-slate-200/60 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Ver Análisis</h4>
            <p className="text-sm text-slate-600">Revisar datos y generar reportes detallados</p>
          </button>
          
          <button 
            onClick={handleTrabajoCampo}
            className="group p-6 text-left border-2 border-slate-200/60 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Trabajo de Campo</h4>
            <p className="text-sm text-slate-600">Registrar nuevas mediciones en terreno</p>
          </button>
          
          <button 
            onClick={handleGenerarReporte}
            className="group p-6 text-left border-2 border-slate-200/60 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Generar Reporte</h4>
            <p className="text-sm text-slate-600">Exportar datos y análisis completos</p>
          </button>
          
          <button 
            onClick={() => navigate('/estaciones')}
            className="group p-6 text-left border-2 border-slate-200/60 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <Play className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">Gestionar Estaciones</h4>
            <p className="text-sm text-slate-600">Configurar y administrar puntos de medición</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;