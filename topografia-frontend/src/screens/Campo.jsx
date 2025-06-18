import React, { useState, useEffect } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { 
  useEstaciones, 
  useMediciones, 
  useCreateMedicion,
} from '../hooks';
import { useLecturas, useCreateLectura } from '../hooks/lecturas';

const Campo = () => {
  const { proyecto, tieneProyecto, formatearKM, informacionProyecto } = useProyecto();
  
  // Estados principales
  const [estacionActual, setEstacionActual] = useState(0);
  const [medicionActiva, setMedicionActiva] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('captura'); // 'captura' o 'graficas'
  
  // Datos del banco de nivel para nueva medición
  const [datoBN, setDatoBN] = useState({
    altura: '',
    lectura: ''
  });

  // ✅ CORREGIDO: Hooks para datos con mejor manejo de errores
  const { 
    data: estaciones = [], 
    isLoading: loadingEstaciones,
    error: errorEstaciones 
  } = useEstaciones(proyecto?.id, { enabled: !!proyecto?.id });

  const { 
    data: mediciones = [], 
    isLoading: loadingMediciones,
    error: errorMediciones 
  } = useMediciones({ proyecto_id: proyecto?.id, enabled: !!proyecto?.id });

  // ✅ CORREGIDO: Divisiones transversales estándar del proyecto
  const divisiones = React.useMemo(() => {
    if (!informacionProyecto) return [];
    
    const izquierdas = [...(informacionProyecto.divisionesIzquierdas || [])].reverse();
    const derechas = informacionProyecto.divisionesDerechas || [];
    
    return [...izquierdas, 0, ...derechas];
  }, [informacionProyecto]);

  // ✅ CORREGIDO: Hook de lecturas con mejor manejo
  const { 
    data: lecturas = [], 
    isLoading: loadingLecturas,
    error: errorLecturas,
    refetch: refetchLecturas
  } = useLecturas(medicionActiva?.id);

  // Mutations
  const createMedicion = useCreateMedicion();
  const createLectura = useCreateLectura();

  // Estación actual seleccionada
  const estacionSeleccionada = estaciones[estacionActual];

  // ✅ CORREGIDO: Medición activa para la estación actual
  useEffect(() => {
    if (estacionSeleccionada && mediciones.length > 0) {
      // Buscar medición que coincida con el KM de la estación
      const medicion = mediciones.find(m => {
        // Convertir ambos a número para comparación precisa
        const kmEstacion = parseFloat(estacionSeleccionada.km);
        const kmMedicion = parseFloat(m.estacion_km);
        return Math.abs(kmEstacion - kmMedicion) < 0.001; // Tolerancia para decimales
      });
      
      console.log('🔍 Buscando medición para estación:', {
        estacionKm: estacionSeleccionada.km,
        medicionesDisponibles: mediciones.map(m => ({ id: m.id, km: m.estacion_km })),
        medicionEncontrada: medicion
      });
      
      setMedicionActiva(medicion || null);
    }
  }, [estacionSeleccionada, mediciones]);

  // ✅ MEJORADO: Debug de datos recibidos
  React.useEffect(() => {
    console.group('📊 Debug Campo - Datos del Backend');
    console.log('🏗️ Proyecto:', { id: proyecto?.id, nombre: proyecto?.nombre });
    console.log('📍 Estaciones:', { 
      cantidad: estaciones.length, 
      loading: loadingEstaciones,
      error: errorEstaciones?.message,
      muestra: estaciones[0] 
    });
    console.log('📏 Mediciones:', { 
      cantidad: mediciones.length,
      loading: loadingMediciones, 
      error: errorMediciones?.message,
      muestra: mediciones[0]
    });
    console.log('🎯 Medición Activa:', medicionActiva);
    console.log('📖 Lecturas:', {
      cantidad: lecturas.length,
      loading: loadingLecturas,
      error: errorLecturas?.message,
      estructura: lecturas[0] ? Object.keys(lecturas[0]) : [],
      muestra: lecturas[0]
    });
    console.log('🎛️ Configuración:', {
      informacionProyecto,
      divisiones: divisiones.length ? divisiones : 'No configuradas'
    });
    
    // Debug específico de lecturas si hay datos
    if (lecturas.length > 0) {
      console.log('🔍 Análisis de lecturas:');
      lecturas.forEach(lectura => {
        console.log(`  📐 División: ${lectura.division_transversal}m, Lectura: ${lectura.lectura_mira}m, Clasificación: ${lectura.clasificacion || 'Sin clasificar'}`);
      });
    }
    
    console.groupEnd();
  }, [
    proyecto?.id, estaciones, mediciones, medicionActiva, lecturas, 
    loadingEstaciones, loadingMediciones, loadingLecturas,
    errorEstaciones, errorMediciones, errorLecturas,
    divisiones, informacionProyecto
  ]);

  // ✅ CORREGIDO: Crear nueva medición
  const handleCrearMedicion = async () => {
    if (!estacionSeleccionada || !datoBN.altura || !datoBN.lectura) {
      alert('Complete los datos del Banco de Nivel');
      return;
    }

    try {
      const nuevaMedicion = {
        proyecto_id: proyecto.id,
        estacion_km: parseFloat(estacionSeleccionada.km), // Asegurar que sea número
        bn_altura: parseFloat(datoBN.altura),
        bn_lectura: parseFloat(datoBN.lectura),
        operador: 'Operador Campo',
        fecha_medicion: new Date().toISOString().split('T')[0]
      };

      console.log('🔄 Creando medición:', nuevaMedicion);
      const resultado = await createMedicion.mutateAsync(nuevaMedicion);
      console.log('✅ Medición creada:', resultado);
      
      setMedicionActiva(resultado);
      
      // Limpiar formulario
      setDatoBN({ altura: '', lectura: '' });
      
    } catch (error) {
      console.error('❌ Error creando medición:', error);
      alert('Error al crear medición: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ✅ CORREGIDO: Guardar lectura
  const handleGuardarLectura = async (division, valor) => {
    if (!medicionActiva || !valor) return;

    try {
      console.log('🔄 Guardando lectura:', { 
        medicion_id: medicionActiva.id, 
        division_transversal: division, 
        lectura_mira: valor 
      });

      const nuevaLectura = {
        medicion_id: medicionActiva.id,
        division_transversal: parseFloat(division),
        lectura_mira: parseFloat(valor)
      };

      const resultado = await createLectura.mutateAsync(nuevaLectura);
      console.log('✅ Lectura guardada:', resultado);
      
      // Refrescar lecturas para mostrar la nueva
      setTimeout(() => {
        refetchLecturas();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error guardando lectura:', error);
      alert('Error al guardar lectura: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Navegar entre estaciones
  const irAEstacion = (direccion) => {
    if (direccion === 'anterior' && estacionActual > 0) {
      setEstacionActual(estacionActual - 1);
    } else if (direccion === 'siguiente' && estacionActual < estaciones.length - 1) {
      setEstacionActual(estacionActual + 1);
    }
  };

  // Formatear números
  const formatNumber = (num, decimales = 3) => {
    if (num === null || num === undefined || num === '') return '';
    return parseFloat(num).toFixed(decimales);
  };

  // ✅ CORREGIDO: Obtener lectura para una división específica
  const getLectura = (division) => {
    if (!lecturas || lecturas.length === 0) return '';
    
    // Buscar la lectura exacta con tolerancia para decimales
    const lectura = lecturas.find(l => 
      Math.abs(parseFloat(l.division_transversal) - parseFloat(division)) < 0.01
    );
    
    const resultado = lectura?.lectura_mira || '';
    
    // Debug para diagnosticar (solo para división 1.3)
    if (division === 1.3 && import.meta.env.DEV) {
      console.log(`🔍 getLectura Debug para división ${division}:`, {
        division,
        lecturas: lecturas.map(l => ({ 
          id: l.id, 
          division: l.division_transversal, 
          lectura: l.lectura_mira 
        })),
        lecturaEncontrada: lectura,
        resultado
      });
    }
    
    return resultado;
  };

  // ✅ CORREGIDO: Calcular datos para gráficas usando campos del backend
  const datosGrafica = React.useMemo(() => {
    if (!lecturas.length) return [];
    
    return lecturas.map(lectura => ({
      division: parseFloat(lectura.division_transversal),
      elevacionReal: lectura.elv_base_real ? parseFloat(lectura.elv_base_real) : null,
      elevacionTeorica: lectura.elv_base_proyecto ? parseFloat(lectura.elv_base_proyecto) : null,
      elevacionConcreto: lectura.elv_concreto_proyecto ? parseFloat(lectura.elv_concreto_proyecto) : null,
      diferencia: lectura.elv_base_real && lectura.elv_base_proyecto ? 
        parseFloat(lectura.elv_base_real) - parseFloat(lectura.elv_base_proyecto) : 0,
      clasificacion: lectura.clasificacion
    })).sort((a, b) => a.division - b.division);
  }, [lecturas]);

  // ✅ CORREGIDO: Renderizar gráfica simple
  const renderGrafica = () => {
    if (!datosGrafica.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">No hay datos para mostrar gráfica</p>
            <p className="text-sm text-gray-400 mt-2">
              Complete algunas lecturas en la vista de captura para ver el perfil.
            </p>
          </div>
        </div>
      );
    }

    // Filtrar datos válidos para la gráfica
    const datosValidos = datosGrafica.filter(d => 
      d.elevacionReal !== null && d.elevacionTeorica !== null
    );

    if (!datosValidos.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Datos de elevación incompletos</p>
            <p className="text-sm text-gray-400 mt-2">
              Las elevaciones se calculan automáticamente al guardar lecturas con un Banco de Nivel configurado.
            </p>
          </div>
        </div>
      );
    }

    const maxElev = Math.max(...datosValidos.map(d => Math.max(d.elevacionReal, d.elevacionTeorica, d.elevacionConcreto || d.elevacionTeorica)));
    const minElev = Math.min(...datosValidos.map(d => Math.min(d.elevacionReal, d.elevacionTeorica, d.elevacionConcreto || d.elevacionTeorica)));
    const rango = maxElev - minElev || 1; // Evitar división por cero

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
        
        <div className="relative h-64 border border-gray-200 rounded bg-gray-50">
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Líneas de elevación */}
            {datosValidos.map((punto, index) => {
              const x = (index / (datosValidos.length - 1)) * 90 + 5; // 5% margen
              const yReal = ((maxElev - punto.elevacionReal) / rango) * 80 + 10; // 10% margen
              const yTeorica = ((maxElev - punto.elevacionTeorica) / rango) * 80 + 10;
              const yConcreto = punto.elevacionConcreto ? 
                ((maxElev - punto.elevacionConcreto) / rango) * 80 + 10 : yTeorica;
              
              return (
                <g key={index}>
                  {/* Líneas conectoras */}
                  {index > 0 && (
                    <>
                      {/* Línea teórica (azul) */}
                      <line
                        x1={`${((index - 1) / (datosValidos.length - 1)) * 90 + 5}%`}
                        y1={`${((maxElev - datosValidos[index - 1].elevacionTeorica) / rango) * 80 + 10}%`}
                        x2={`${x}%`}
                        y2={`${yTeorica}%`}
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                      
                      {/* Línea real (rojo) */}
                      <line
                        x1={`${((index - 1) / (datosValidos.length - 1)) * 90 + 5}%`}
                        y1={`${((maxElev - datosValidos[index - 1].elevacionReal) / rango) * 80 + 10}%`}
                        x2={`${x}%`}
                        y2={`${yReal}%`}
                        stroke="#EF4444"
                        strokeWidth="2"
                      />
                      
                      {/* Línea concreto (verde) */}
                      {punto.elevacionConcreto && datosValidos[index - 1].elevacionConcreto && (
                        <line
                          x1={`${((index - 1) / (datosValidos.length - 1)) * 90 + 5}%`}
                          y1={`${((maxElev - datosValidos[index - 1].elevacionConcreto) / rango) * 80 + 10}%`}
                          x2={`${x}%`}
                          y2={`${yConcreto}%`}
                          stroke="#10B981"
                          strokeWidth="2"
                        />
                      )}
                    </>
                  )}
                  
                  {/* Puntos */}
                  <circle cx={`${x}%`} cy={`${yTeorica}%`} r="3" fill="#3B82F6" />
                  <circle cx={`${x}%`} cy={`${yReal}%`} r="3" fill="#EF4444" />
                  {punto.elevacionConcreto && (
                    <circle cx={`${x}%`} cy={`${yConcreto}%`} r="3" fill="#10B981" />
                  )}
                  
                  {/* Etiquetas de división */}
                  <text x={`${x}%`} y="95%" textAnchor="middle" className="text-xs fill-gray-600">
                    {punto.division}m
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Leyenda */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Teórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span>Real</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span>Concreto</span>
          </div>
        </div>
        
        {/* Tabla de diferencias */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-2">Análisis de Diferencias</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-green-800 font-medium">Cumple Tolerancia</div>
              <div className="text-2xl font-bold text-green-600">
                {datosGrafica.filter(d => d.clasificacion === 'CUMPLE').length}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-red-800 font-medium">Requiere Corte</div>
              <div className="text-2xl font-bold text-red-600">
                {datosGrafica.filter(d => d.clasificacion === 'CORTE').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-yellow-800 font-medium">Requiere Terraplén</div>
              <div className="text-2xl font-bold text-yellow-600">
                {datosGrafica.filter(d => d.clasificacion === 'TERRAPLEN').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Si no hay proyecto seleccionado
  if (!tieneProyecto) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Seleccione un Proyecto</h2>
          <p className="text-gray-600 mb-4">
            Para iniciar el trabajo de campo, primero seleccione un proyecto.
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

  // ✅ MEJORADO: Estados de carga con información específica
  if (loadingEstaciones || loadingMediciones) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando datos del proyecto</h2>
          <p className="text-gray-600">
            {loadingEstaciones && 'Cargando estaciones...'}
            {loadingMediciones && 'Cargando mediciones...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ MEJORADO: Manejo de errores específicos
  if (errorEstaciones || errorMediciones) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error cargando datos</h2>
          <p className="text-gray-600 mb-4">
            {errorEstaciones?.message || errorMediciones?.message || 'Error desconocido'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay estaciones
  if (!estaciones.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay estaciones configuradas</h2>
          <p className="text-gray-600">El proyecto seleccionado no tiene estaciones teóricas configuradas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header con navegación de estaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Campo</h1>
            <p className="text-gray-600">{proyecto.nombre} - {proyecto.tramo}</p>
          </div>
          
          {/* Navegación de vistas */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActiva('captura')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                vistaActiva === 'captura' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Captura
            </button>
            <button
              onClick={() => setVistaActiva('graficas')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                vistaActiva === 'graficas' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Gráficas
            </button>
          </div>
        </div>

        {/* Navegación entre estaciones */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <button
            onClick={() => irAEstacion('anterior')}
            disabled={estacionActual === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:text-gray-500 text-lg"
          >
            ← Anterior
          </button>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Estación</div>
            <div className="text-2xl font-bold text-gray-900">
              KM {formatearKM(estacionSeleccionada?.km)}
            </div>
            <div className="text-sm text-gray-500">
              {estacionActual + 1} de {estaciones.length}
            </div>
          </div>
          
          <button
            onClick={() => irAEstacion('siguiente')}
            disabled={estacionActual === estaciones.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:text-gray-500 text-lg"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {vistaActiva === 'captura' ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Información de la estación */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Estación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Pendiente Derecha:</span>
                <span className="ml-2 font-medium">{formatNumber(estacionSeleccionada.pendiente_derecha, 4)}</span>
              </div>
              <div>
                <span className="text-blue-700">Base CL:</span>
                <span className="ml-2 font-medium">{formatNumber(estacionSeleccionada.base_cl, 3)}m</span>
              </div>
              <div>
                <span className="text-blue-700">Tolerancia SCT:</span>
                <span className="ml-2 font-medium">±{formatNumber(informacionProyecto?.toleranciaSct * 1000, 1)}mm</span>
              </div>
            </div>
          </div>

          {/* Banco de Nivel */}
          {!medicionActiva ? (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-4">Configurar Banco de Nivel</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-1">
                    Altura BN (m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={datoBN.altura}
                    onChange={(e) => setDatoBN({...datoBN, altura: e.target.value})}
                    className="w-full px-3 py-2 border border-yellow-300 rounded text-lg text-center"
                    placeholder="1883.021"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-1">
                    Lectura BN (m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={datoBN.lectura}
                    onChange={(e) => setDatoBN({...datoBN, lectura: e.target.value})}
                    className="w-full px-3 py-2 border border-yellow-300 rounded text-lg text-center"
                    placeholder="3.289"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCrearMedicion}
                    disabled={!datoBN.altura || !datoBN.lectura || createMedicion.isLoading}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded text-lg font-medium hover:bg-yellow-700 disabled:bg-gray-300"
                  >
                    {createMedicion.isLoading ? 'Configurando...' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Banco de Nivel Configurado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Altura BN:</span>
                  <span className="ml-2 font-medium">{formatNumber(medicionActiva.bn_altura, 3)}m</span>
                </div>
                <div>
                  <span className="text-green-700">Lectura BN:</span>
                  <span className="ml-2 font-medium">{formatNumber(medicionActiva.bn_lectura, 3)}m</span>
                </div>
                <div>
                  <span className="text-green-700">Altura Aparato:</span>
                  <span className="ml-2 font-medium text-lg">{formatNumber(medicionActiva.altura_aparato, 3)}m</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de lecturas estilo Excel */}
          {medicionActiva && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Indicador de carga */}
              {loadingLecturas && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Cargando lecturas de la medición {medicionActiva.id}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error de carga */}
              {errorLecturas && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        Error cargando lecturas: {errorLecturas.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ESTACION</th>
                    <th className="px-4 py-3 text-center font-semibold">+</th>
                    <th className="px-4 py-3 text-center font-semibold">Altura de Aparato</th>
                    <th className="px-4 py-3 text-center font-semibold">-</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-medium">BN</td>
                    <td className="px-4 py-2 text-center">{formatNumber(medicionActiva.bn_lectura, 3)}</td>
                    <td className="px-4 py-2 text-center font-bold text-lg">
                      {formatNumber(medicionActiva.altura_aparato, 3)}
                    </td>
                    <td className="px-4 py-2 text-center">-</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">{formatearKM(estacionSeleccionada.km)}</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                  </tr>
                  
                  {/* Filas para cada división transversal */}
                  {divisiones.map((division, index) => {
                    const lectura = getLectura(division);
                    const lecturaObj = lecturas.find(l => Math.abs(parseFloat(l.division_transversal) - parseFloat(division)) < 0.01);
                    
                    return (
                      <tr key={`division-${index}-${division}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center font-medium">
                          {division === 0 ? '0.00' : formatNumber(Math.abs(division), 2)}
                          {division < 0 ? ' (I)' : division > 0 ? ' (D)' : ''}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={lectura}
                            onChange={(e) => {
                              if (e.target.value && e.target.value !== lectura) {
                                handleGuardarLectura(division, e.target.value);
                              }
                            }}
                            className={`w-full px-2 py-1 text-center border rounded text-lg ${
                              lecturaObj?.clasificacion === 'CUMPLE' ? 'bg-green-50 border-green-300' :
                              lecturaObj?.clasificacion === 'CORTE' ? 'bg-red-50 border-red-300' :
                              lecturaObj?.clasificacion === 'TERRAPLEN' ? 'bg-yellow-50 border-yellow-300' :
                              'border-gray-300'
                            }`}
                            placeholder="0.000"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Indicador de progreso */}
          {medicionActiva && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso de Lecturas</span>
                <span className="text-sm text-gray-500">
                  {lecturas.length} de {divisiones.length} completadas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(lecturas.length / divisiones.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Debug info en desarrollo */}
              {import.meta.env.DEV && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                  <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                    <div><strong>Medición ID:</strong> {medicionActiva?.id}</div>
                    <div><strong>Loading:</strong> {String(loadingLecturas)}</div>
                    <div><strong>Error:</strong> {errorLecturas?.message || 'Ninguno'}</div>
                    <div><strong>Lecturas en estado:</strong> {lecturas.length}</div>
                    <div><strong>Divisiones esperadas:</strong> {JSON.stringify(divisiones)}</div>
                    {lecturas.length > 0 && (
                      <>
                        <div><strong>Divisiones en lecturas:</strong> {JSON.stringify(lecturas.map(l => l.division_transversal))}</div>
                        <div><strong>Clasificaciones:</strong> {JSON.stringify(lecturas.map(l => l.clasificacion))}</div>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Vista de gráficas */
        renderGrafica()
      )}

      {/* Estado de guardado */}
      {createLectura.isLoading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Guardando lectura...
        </div>
      )}
      
      {createMedicion.isLoading && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Creando medición...
        </div>
      )}
    </div>
  );
};

export default Campo;