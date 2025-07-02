import React, { useState, useEffect, useCallback } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { 
  useEstaciones, 
  useMediciones, 
  useCreateMedicion,
} from '../hooks';
import { useLecturas, useCreateLectura, useUpdateLectura } from '../hooks/lecturas';
import { useRealTimeProject } from '../hooks/useRealTimeProject';
import { useRefreshProject } from '../hooks/useRefreshProject';

const Campo = () => {
  const { proyecto, tieneProyecto, formatearKM, informacionProyecto } = useProyecto();
  
  // Activar tiempo real para sincronización automática
  const { isConnected, forceRefresh } = useRealTimeProject();
  
  // Hook para actualización manual más potente
  const { refreshCurrentProject } = useRefreshProject();
  
  // Estados principales
  const [estacionActual, setEstacionActual] = useState(0);
  const [medicionActiva, setMedicionActiva] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('captura'); // 'captura', 'graficas' o 'resultados'
  
  // Estado local para los valores de input (mejora la UX)
  const [valoresLocales, setValoresLocales] = useState({});
  
  // Estado para controlar timeouts de guardado automático
  const [timeoutsGuardado, setTimeoutsGuardado] = useState({});
  
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

  // ✅ CORREGIDO: Divisiones transversales del proyecto sin 0 forzado
  const divisiones = React.useMemo(() => {
    if (!informacionProyecto) return [];
    
    const izquierdas = [...(informacionProyecto.divisionesIzquierdas || [])].reverse();
    const derechas = informacionProyecto.divisionesDerechas || [];
    
    // Solo incluir 0 si está explícitamente en las divisiones
    const todasLasDivisiones = [...izquierdas, ...derechas];
    
    // Verificar si 0 está ya incluido en alguna de las divisiones
    const tieneEjeEnDivisiones = todasLasDivisiones.includes(0);
    
    // Si no tiene 0 explícito, no lo añadimos automáticamente
    return tieneEjeEnDivisiones 
      ? todasLasDivisiones.sort((a, b) => a - b)
      : todasLasDivisiones.sort((a, b) => a - b);
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
  const updateLectura = useUpdateLectura();

  // Estación actual seleccionada
  const estacionSeleccionada = estaciones[estacionActual];

  // ✅ CORREGIDO: Guardar valores pendientes antes de cambiar de medición
  const guardarValoresPendientes = async () => {
    const valoresPendientes = Object.entries(valoresLocales);
    if (valoresPendientes.length === 0) return;

    // Guardar todos los valores pendientes
    const promesasGuardado = valoresPendientes.map(async ([clave, valor]) => {
      const [medicionId, division] = clave.split('-');
      if (medicionId && division && valor) {
        try {
          await handleGuardarLectura(parseFloat(division), valor);
        } catch (error) {
          console.error(`Error guardando división ${division}:`, error);
        }
      }
    });

    await Promise.all(promesasGuardado);
    setValoresLocales({});
  };

  // ✅ NUEVO: Resetear estado cuando cambia el proyecto
  useEffect(() => {
    console.log('🔄 Campo.jsx - Proyecto cambió, reseteando estado local');
    
    // Limpiar timeouts pendientes
    Object.values(timeoutsGuardado).forEach(timeout => clearTimeout(timeout));
    
    // Resetear estado local cuando cambia el proyecto
    setEstacionActual(0);
    setMedicionActiva(null);
    setValoresLocales({});
    setTimeoutsGuardado({});
    setDatoBN({ altura: '', lectura: '' });
    setVistaActiva('captura');
    
    console.log('✅ Campo.jsx - Estado local reseteado para nuevo proyecto:', proyecto?.id);
  }, [proyecto?.id]); // Solo reaccionar al cambio de proyecto ID

  // ✅ NUEVO: Refrescar lecturas cuando cambia la medición activa
  useEffect(() => {
    if (medicionActiva?.id && refetchLecturas) {
      console.log('🔄 Campo.jsx - Refrescando lecturas para medición:', medicionActiva.id);
      refetchLecturas();
    }
  }, [medicionActiva?.id, refetchLecturas]);

  // ✅ CORREGIDO: Medición activa para la estación actual
  useEffect(() => {
    const cambiarMedicion = async () => {
      // Guardar valores pendientes antes de cambiar
      await guardarValoresPendientes();
      
      if (estacionSeleccionada && mediciones.length > 0) {
        // Buscar medición que coincida con el KM de la estación
        const medicion = mediciones.find(m => {
          // Convertir ambos a número para comparación precisa
          const kmEstacion = parseFloat(estacionSeleccionada.km);
          const kmMedicion = parseFloat(m.estacion_km);
          return Math.abs(kmEstacion - kmMedicion) < 0.001; // Tolerancia para decimales
        });
        
        setMedicionActiva(medicion || null);
        console.log('🎯 Campo.jsx - Medición activa establecida:', medicion?.id);
      } else {
        setMedicionActiva(null);
        console.log('⚪ Campo.jsx - No hay mediciones disponibles, medicionActiva = null');
      }
    };

    cambiarMedicion();
  }, [estacionSeleccionada, mediciones]);

  // ✅ NUEVO: Guardar valores pendientes al cambiar de vista o salir
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      const valoresPendientes = Object.keys(valoresLocales).length;
      if (valoresPendientes > 0) {
        e.preventDefault();
        e.returnValue = '';
        await guardarValoresPendientes();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Intentar guardar al desmontar el componente
      guardarValoresPendientes();
    };
  }, [valoresLocales]);


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

      const resultado = await createMedicion.mutateAsync(nuevaMedicion);
      
      setMedicionActiva(resultado);
      
      // Limpiar formulario
      setDatoBN({ altura: '', lectura: '' });
      
    } catch (error) {
      console.error('Error creando medición:', error);
      alert('Error al crear medición: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ✅ SIMPLIFICADO: Usar solo CREATE que hace UPSERT automático
  const handleGuardarLectura = useCallback(async (division, valor) => {
    if (!medicionActiva || !valor || valor.trim() === '') return;

    try {
      // El backend ahora maneja automáticamente create vs update (UPSERT)
      const lecturaData = {
        medicion_id: medicionActiva.id,
        division_transversal: parseFloat(division),
        lectura_mira: parseFloat(valor)
      };

      await createLectura.mutateAsync(lecturaData);
      
      // Limpiar el valor local después de guardar exitosamente
      const claveLocal = `${medicionActiva.id}-${division}`;
      setValoresLocales(prev => {
        const nuevos = { ...prev };
        delete nuevos[claveLocal];
        return nuevos;
      });
      
      // Limpiar timeout de esta división
      setTimeoutsGuardado(prev => {
        const nuevos = { ...prev };
        delete nuevos[claveLocal];
        return nuevos;
      });
      
    } catch (error) {
      console.error('Error guardando lectura:', error);
      alert('Error al guardar lectura: ' + (error.response?.data?.detail || error.message));
    }
  }, [medicionActiva, createLectura]);

  // ✅ NUEVO: Función para programar guardado con debounce
  const programarGuardado = useCallback((division, valor) => {
    const claveLocal = `${medicionActiva?.id}-${division}`;
    
    // Cancelar timeout anterior si existe
    if (timeoutsGuardado[claveLocal]) {
      clearTimeout(timeoutsGuardado[claveLocal]);
    }
    
    // Programar nuevo guardado después de 1 segundo de inactividad
    const nuevoTimeout = setTimeout(() => {
      if (valor && valor.trim() !== '') {
        handleGuardarLectura(division, valor);
      }
    }, 1000); // 1 segundo de debounce
    
    setTimeoutsGuardado(prev => ({
      ...prev,
      [claveLocal]: nuevoTimeout
    }));
  }, [medicionActiva?.id, timeoutsGuardado, handleGuardarLectura]);

  // ✅ NUEVO: Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      Object.values(timeoutsGuardado).forEach(timeout => clearTimeout(timeout));
    };
  }, [timeoutsGuardado]);

  // Navegar entre estaciones
  const irAEstacion = async (direccion) => {
    // Guardar valores pendientes antes de cambiar de estación
    await guardarValoresPendientes();
    
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
    // Primero verificar si hay un valor local para esta división
    const claveLocal = `${medicionActiva?.id}-${division}`;
    if (valoresLocales[claveLocal] !== undefined) {
      return valoresLocales[claveLocal];
    }
    
    if (!lecturas || lecturas.length === 0) return '';
    
    // Buscar la lectura exacta con tolerancia para decimales
    const lectura = lecturas.find(l => 
      Math.abs(parseFloat(l.division_transversal) - parseFloat(division)) < 0.01
    );
    
    const resultado = lectura?.lectura_mira || '';
    
    return resultado;
  };

  // ✅ CORREGIDO: Calcular datos para gráficas usando campos del backend
  const datosGrafica = React.useMemo(() => {
    if (!lecturas.length) return [];
    
    // Debug: analizar qué datos faltan
    console.group('🔍 Debug Gráficas - Análisis de Datos');
    console.log('Total lecturas:', lecturas.length);
    
    const analisis = lecturas.map(lectura => {
      const tiene_elv_real = lectura.elv_base_real !== null && lectura.elv_base_real !== undefined;
      const tiene_elv_proyecto = lectura.elv_base_proyecto !== null && lectura.elv_base_proyecto !== undefined;
      const tiene_elv_concreto = lectura.elv_concreto_proyecto !== null && lectura.elv_concreto_proyecto !== undefined;
      
      console.log(`División ${lectura.division_transversal}:`, {
        lectura_mira: lectura.lectura_mira,
        elv_base_real: lectura.elv_base_real,
        elv_base_proyecto: lectura.elv_base_proyecto,
        elv_concreto_proyecto: lectura.elv_concreto_proyecto,
        clasificacion: lectura.clasificacion,
        tiene_elv_real,
        tiene_elv_proyecto,
        tiene_elv_concreto
      });
      
      return {
        division: parseFloat(lectura.division_transversal),
        elevacionReal: tiene_elv_real ? parseFloat(lectura.elv_base_real) : null,
        elevacionTeorica: tiene_elv_proyecto ? parseFloat(lectura.elv_base_proyecto) : null,
        elevacionConcreto: tiene_elv_concreto ? parseFloat(lectura.elv_concreto_proyecto) : null,
        diferencia: tiene_elv_real && tiene_elv_proyecto ? 
          parseFloat(lectura.elv_base_real) - parseFloat(lectura.elv_base_proyecto) : 0,
        clasificacion: lectura.clasificacion,
        datosCompletos: tiene_elv_real && tiene_elv_proyecto
      };
    });
    
    const lecturasCompletas = analisis.filter(d => d.datosCompletos).length;
    console.log(`📊 Lecturas con datos completos: ${lecturasCompletas} de ${lecturas.length}`);
    
    if (lecturasCompletas === 0) {
      console.error('❌ PROBLEMA: No hay lecturas con elv_base_proyecto calculado');
      console.log('💡 CAUSA PROBABLE: Falta estación teórica para KM', estacionSeleccionada?.km);
      console.log('💡 SOLUCIÓN: Verificar que existe registro en estaciones_teoricas con:');
      console.log('   - proyecto_id:', proyecto?.id);
      console.log('   - km:', estacionSeleccionada?.km);
      console.log('   - pendiente_derecha: (valor diferente de 0)');
      console.log('   - base_cl: (elevación base)');
    }
    
    console.groupEnd();
    
    return analisis.sort((a, b) => a.division - b.division);
  }, [lecturas, estacionSeleccionada?.km, proyecto?.id]);

  // ✅ CORREGIDO: Renderizar gráfica simple
  const renderGrafica = () => {
    if (!datosGrafica.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
          <div className="text-center py-6 lg:py-8">
            <p className="text-gray-500 text-sm lg:text-base">No hay datos para mostrar gráfica</p>
            <p className="text-xs lg:text-sm text-gray-400 mt-2">
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
      const tieneElevacionReal = datosGrafica.some(d => d.elevacionReal !== null);
      const tieneElevacionTeorica = datosGrafica.some(d => d.elevacionTeorica !== null);
      
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
          <div className="text-center py-6 lg:py-8">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 text-sm lg:text-base font-medium mb-2">Datos de elevación incompletos</p>
            
            <div className="text-xs lg:text-sm text-gray-500 space-y-1">
              <p>Estado de los datos:</p>
              <p>• Elevaciones reales: {tieneElevacionReal ? '✅ Calculadas' : '❌ Faltantes'}</p>
              <p>• Elevaciones teóricas: {tieneElevacionTeorica ? '✅ Calculadas' : '❌ Faltantes'}</p>
              
              {!tieneElevacionTeorica && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-left">
                  <p className="font-medium text-orange-800 mb-2">🔧 Solución requerida:</p>
                  <p className="text-orange-700 text-xs">
                    Falta configurar la estación teórica para KM {formatearKM(estacionSeleccionada?.km)}
                    <br />En Supabase, tabla "estaciones_teoricas":
                    <br />• proyecto_id: {proyecto?.id}
                    <br />• km: {estacionSeleccionada?.km}
                    <br />• pendiente_derecha: (ej: -0.045)
                    <br />• base_cl: (ej: 1886.14)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const maxElev = Math.max(...datosValidos.map(d => Math.max(d.elevacionReal, d.elevacionTeorica, d.elevacionConcreto || d.elevacionTeorica)));
    const minElev = Math.min(...datosValidos.map(d => Math.min(d.elevacionReal, d.elevacionTeorica, d.elevacionConcreto || d.elevacionTeorica)));
    const rango = maxElev - minElev || 1; // Evitar división por cero

    return (
      <div className="bg-white p-3 lg:p-6 rounded-lg">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Perfil de Terreno - KM {formatearKM(estacionSeleccionada?.km)}</h3>
        
        <div className="relative h-48 lg:h-64 rounded bg-gray-50">
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Grid de referencia */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
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
        <div className="flex flex-wrap justify-center gap-3 lg:gap-6 mt-3 lg:mt-4 text-xs lg:text-sm">
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
        <div className="mt-4 lg:mt-6">
          <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Análisis de Diferencias</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 text-xs lg:text-sm">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-green-800 font-medium">Cumple Tolerancia</div>
              <div className="text-xl lg:text-2xl font-bold text-green-600">
                {datosGrafica.filter(d => d.clasificacion === 'CUMPLE').length}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-red-800 font-medium">Requiere Corte</div>
              <div className="text-xl lg:text-2xl font-bold text-red-600">
                {datosGrafica.filter(d => d.clasificacion === 'CORTE').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-yellow-800 font-medium">Requiere Terraplén</div>
              <div className="text-xl lg:text-2xl font-bold text-yellow-600">
                {datosGrafica.filter(d => d.clasificacion === 'TERRAPLEN').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ NUEVA VISTA: Resultados detallados con todos los cálculos
  const renderResultados = () => {
    if (!medicionActiva) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Configure el Banco de Nivel</h3>
            <p className="text-gray-600">
              Para ver los resultados detallados, primero configure el banco de nivel en la vista de Captura.
            </p>
          </div>
        </div>
      );
    }

    if (!lecturas || lecturas.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-blue-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin Lecturas Registradas</h3>
            <p className="text-gray-600 mb-4">
              No hay lecturas registradas para esta estación. Vaya a la vista de Captura para ingresar datos.
            </p>
            <button
              onClick={() => setVistaActiva('captura')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Ir a Captura
            </button>
          </div>
        </div>
      );
    }

    // Calcular estadísticas de calidad
    const estadisticasCalidad = {
      total: lecturas.length,
      excelente: lecturas.filter(l => l.calidad === 'EXCELENTE').length,
      buena: lecturas.filter(l => l.calidad === 'BUENA').length,
      regular: lecturas.filter(l => l.calidad === 'REGULAR').length,
      revisar: lecturas.filter(l => l.calidad === 'REVISAR').length,
      cumple: lecturas.filter(l => l.cumple_tolerancia === true).length,
      corte: lecturas.filter(l => l.clasificacion === 'CORTE').length,
      terraplen: lecturas.filter(l => l.clasificacion === 'TERRAPLEN').length
    };

    const porcentajeCumplimiento = (estadisticasCalidad.cumple / estadisticasCalidad.total) * 100;

    // Función para exportar a CSV
    const exportarCSV = () => {
      const headers = [
        'División (m)',
        'Lectura Mira (m)',
        'Elv. Base Real (m)',
        'Elv. Base Proyecto (m)',
        'Elv. Concreto Proyecto (m)',
        'Esp. Concreto (m)',
        'Diferencia (m)',
        'Clasificación',
        'Cumple Tolerancia',
        'Calidad'
      ];

      const rows = lecturas.map(l => [
        l.division_transversal,
        l.lectura_mira,
        l.elv_base_real,
        l.elv_base_proyecto,
        l.elv_concreto_proyecto,
        l.esp_concreto_proyecto,
        l.elv_base_real && l.elv_base_proyecto ? (l.elv_base_real - l.elv_base_proyecto).toFixed(6) : '',
        l.clasificacion || '',
        l.cumple_tolerancia ? 'SÍ' : 'NO',
        l.calidad || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resultados_km_${formatearKM(estacionSeleccionada?.km)}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    };

    return (
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Resultados Detallados - KM {formatearKM(estacionSeleccionada?.km)}
              </h2>
              <p className="text-blue-100">
                Análisis completo de elevaciones y tolerancias para {estadisticasCalidad.total} divisiones transversales
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0 flex flex-col lg:flex-row gap-3">
              <button
                onClick={exportarCSV}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
              <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg text-sm shadow-md">
                <div className="font-semibold text-blue-800">{porcentajeCumplimiento.toFixed(1)}% Cumplimiento</div>
                <div className="text-xs text-blue-600">Tolerancia SCT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard de calidad */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{estadisticasCalidad.excelente}</div>
            <div className="text-xs text-gray-600">Excelente</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-green-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.excelente/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{estadisticasCalidad.buena}</div>
            <div className="text-xs text-gray-600">Buena</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-blue-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.buena/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{estadisticasCalidad.regular}</div>
            <div className="text-xs text-gray-600">Regular</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-yellow-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.regular/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{estadisticasCalidad.revisar}</div>
            <div className="text-xs text-gray-600">Revisar</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.revisar/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{estadisticasCalidad.corte}</div>
            <div className="text-xs text-gray-600">Corte</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-orange-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.corte/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{estadisticasCalidad.terraplen}</div>
            <div className="text-xs text-gray-600">Terraplén</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-purple-500 h-1 rounded-full" style={{width: `${(estadisticasCalidad.terraplen/estadisticasCalidad.total)*100}%`}}></div>
            </div>
          </div>
        </div>

        {/* Tabla detallada de resultados */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Tabla Detallada de Cálculos
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Resultados completos de elevaciones y análisis de tolerancias
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                    División (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Lectura Mira (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Elv. Base Real (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Elv. Base Proyecto (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Elv. Concreto Proy. (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Esp. Concreto (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Diferencia (m)
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Clasificación
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Tolerancia
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Calidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lecturas
                  .sort((a, b) => parseFloat(a.division_transversal) - parseFloat(b.division_transversal))
                  .map((lectura, index) => {
                    const diferencia = lectura.elv_base_real && lectura.elv_base_proyecto 
                      ? parseFloat(lectura.elv_base_real) - parseFloat(lectura.elv_base_proyecto)
                      : null;
                    
                    return (
                      <tr 
                        key={lectura.id} 
                        className={`hover:bg-gray-50 ${
                          lectura.calidad === 'REVISAR' ? 'bg-red-50' :
                          lectura.calidad === 'REGULAR' ? 'bg-yellow-50' :
                          lectura.calidad === 'EXCELENTE' ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parseFloat(lectura.division_transversal) === 0 ? '0.00 (EJE)' : 
                           parseFloat(lectura.division_transversal) < 0 ? 
                           `${Math.abs(parseFloat(lectura.division_transversal)).toFixed(2)} (I)` :
                           `${parseFloat(lectura.division_transversal).toFixed(2)} (D)`}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {formatNumber(lectura.lectura_mira, 3)}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                          {lectura.elv_base_real ? formatNumber(lectura.elv_base_real, 3) : '-'}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {lectura.elv_base_proyecto ? formatNumber(lectura.elv_base_proyecto, 3) : '-'}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center text-purple-600">
                          {lectura.elv_concreto_proyecto ? formatNumber(lectura.elv_concreto_proyecto, 3) : '-'}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-indigo-600">
                          {lectura.esp_concreto_proyecto ? formatNumber(lectura.esp_concreto_proyecto, 3) : '-'}
                        </td>
                        <td className={`px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${
                          diferencia === null ? 'text-gray-400' :
                          Math.abs(diferencia) <= (proyecto?.tolerancia_sct || 0.005) ? 'text-green-600' :
                          diferencia > 0 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {diferencia !== null ? 
                            `${diferencia >= 0 ? '+' : ''}${diferencia.toFixed(6)}` : 
                            '-'
                          }
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
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
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lectura.cumple_tolerancia ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {lectura.cumple_tolerancia ? 'SÍ' : 'NO'}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                          {lectura.calidad && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lectura.calidad === 'EXCELENTE' ? 'bg-green-100 text-green-800' :
                              lectura.calidad === 'BUENA' ? 'bg-blue-100 text-blue-800' :
                              lectura.calidad === 'REGULAR' ? 'bg-yellow-100 text-yellow-800' :
                              lectura.calidad === 'REVISAR' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lectura.calidad}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas y recomendaciones */}
        {(estadisticasCalidad.revisar > 0 || estadisticasCalidad.regular > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Alertas de Calidad
            </h3>
            
            <div className="space-y-3">
              {estadisticasCalidad.revisar > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        {estadisticasCalidad.revisar} divisiones requieren revisión inmediata
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Estas mediciones exceden significativamente las tolerancias establecidas y deben ser verificadas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {estadisticasCalidad.regular > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        {estadisticasCalidad.regular} divisiones con calidad regular
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Estas mediciones están fuera de tolerancia pero dentro de rangos aceptables. Considere repetir la medición.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    <div className="max-w-6xl mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header con navegación de estaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-3 lg:space-y-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Registro de Campo</h1>
            <p className="text-sm lg:text-base text-gray-600">{proyecto.nombre} - {proyecto.tramo}</p>
          </div>
          
          {/* Navegación de vistas y controles */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Indicador de tiempo real */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Tiempo real activo' : 'Sin conexión TR'}</span>
            </div>
            
            {/* Botón de actualización manual mejorado */}
            <button
              onClick={refreshCurrentProject}
              className="px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded text-blue-700 font-medium"
              title="Actualizar proyecto completo desde base de datos"
            >
              🔄 Refrescar Proyecto
            </button>
            
            {/* Navegación de vistas */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={async () => {
                  await guardarValoresPendientes();
                  setVistaActiva('captura');
                }}
                className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium ${
                  vistaActiva === 'captura' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Captura
              </button>
              <button
                onClick={async () => {
                  await guardarValoresPendientes();
                  setVistaActiva('graficas');
                }}
                className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium ${
                  vistaActiva === 'graficas' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gráficas
              </button>
              <button
                onClick={async () => {
                  await guardarValoresPendientes();
                  setVistaActiva('resultados');
                }}
                className={`px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium ${
                  vistaActiva === 'resultados' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Resultados
              </button>
            </div>
          </div>
        </div>

        {/* Navegación entre estaciones */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 lg:p-4">
          <button
            onClick={() => irAEstacion('anterior')}
            disabled={estacionActual === 0}
            className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:text-gray-500 text-sm lg:text-base"
          >
            <span className="hidden sm:inline">←</span> Anterior
          </button>
          
          <div className="text-center">
            <div className="text-xs lg:text-sm text-gray-600">Estación</div>
            <div className="text-lg lg:text-2xl font-bold text-gray-900">
              KM {formatearKM(estacionSeleccionada?.km)}
            </div>
            <div className="text-xs lg:text-sm text-gray-500">
              {estacionActual + 1} de {estaciones.length}
            </div>
          </div>
          
          <button
            onClick={() => irAEstacion('siguiente')}
            disabled={estacionActual === estaciones.length - 1}
            className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:text-gray-500 text-sm lg:text-base"
          >
            Siguiente <span className="hidden sm:inline">→</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {vistaActiva === 'captura' ? (
        <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-6">
          {/* Información de la estación */}
          <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm lg:text-base">Información de la Estación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 text-xs lg:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-blue-700 font-medium">Pendiente Derecha:</span>
                <span className="sm:ml-2 font-medium">{formatNumber(estacionSeleccionada.pendiente_derecha, 4)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-blue-700 font-medium">Base CL:</span>
                <span className="sm:ml-2 font-medium">{formatNumber(estacionSeleccionada.base_cl, 3)}m</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-blue-700 font-medium">Tolerancia SCT:</span>
                <span className="sm:ml-2 font-medium">±{formatNumber(informacionProyecto?.toleranciaSct * 1000, 1)}mm</span>
              </div>
            </div>
          </div>

          {/* Banco de Nivel */}
          {!medicionActiva ? (
            <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-3 lg:mb-4 text-sm lg:text-base">Configurar Banco de Nivel</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-yellow-800 mb-1">
                    Altura BN (m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={datoBN.altura}
                    onChange={(e) => setDatoBN({...datoBN, altura: e.target.value})}
                    className="w-full px-2 lg:px-3 py-2 border border-yellow-300 rounded text-base lg:text-lg text-center"
                    placeholder="1883.021"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-yellow-800 mb-1">
                    Lectura BN (m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={datoBN.lectura}
                    onChange={(e) => setDatoBN({...datoBN, lectura: e.target.value})}
                    className="w-full px-2 lg:px-3 py-2 border border-yellow-300 rounded text-base lg:text-lg text-center"
                    placeholder="3.289"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCrearMedicion}
                    disabled={!datoBN.altura || !datoBN.lectura || createMedicion.isLoading}
                    className="w-full px-3 lg:px-4 py-2 bg-yellow-600 text-white rounded text-sm lg:text-base font-medium hover:bg-yellow-700 disabled:bg-gray-300"
                  >
                    {createMedicion.isLoading ? 'Configurando...' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2 text-sm lg:text-base">Banco de Nivel Configurado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 text-xs lg:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-green-700 font-medium">Altura BN:</span>
                  <span className="sm:ml-2 font-medium">{formatNumber(medicionActiva.bn_altura, 3)}m</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-green-700 font-medium">Lectura BN:</span>
                  <span className="sm:ml-2 font-medium">{formatNumber(medicionActiva.bn_lectura, 3)}m</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-green-700 font-medium">Altura Aparato:</span>
                  <span className="sm:ml-2 font-medium text-base lg:text-lg">{formatNumber(medicionActiva.altura_aparato, 3)}m</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de lecturas estilo Excel */}
          {medicionActiva && (
            <div className="border border-gray-300 rounded-lg overflow-x-auto overflow-y-hidden">
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
              
              <table className="w-full min-w-[1000px]">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-left font-semibold text-xs lg:text-sm">ESTACION</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm">+</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm">Altura de Aparato</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm">Lectura Mira</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm bg-blue-500">Elv. Real</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm bg-blue-500">Elv. Teórica</th>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center font-semibold text-xs lg:text-sm bg-blue-500">Elv. Concreto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="px-2 lg:px-4 py-2 font-medium text-xs lg:text-sm">BN</td>
                    <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">{formatNumber(medicionActiva.bn_lectura, 3)}</td>
                    <td className="px-2 lg:px-4 py-2 text-center font-bold text-sm lg:text-lg">
                      {formatNumber(medicionActiva.altura_aparato, 3)}
                    </td>
                    <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">-</td>
                    <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm font-medium text-green-600">{formatNumber(medicionActiva.bn_altura, 3)}</td>
                    <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">-</td>
                    <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">-</td>
                  </tr>
                  <tr>
                    <td className="px-2 lg:px-4 py-2 font-medium text-xs lg:text-sm">{formatearKM(estacionSeleccionada.km)}</td>
                    <td className="px-2 lg:px-4 py-2"></td>
                    <td className="px-2 lg:px-4 py-2"></td>
                    <td className="px-2 lg:px-4 py-2"></td>
                    <td className="px-2 lg:px-4 py-2"></td>
                    <td className="px-2 lg:px-4 py-2"></td>
                    <td className="px-2 lg:px-4 py-2"></td>
                  </tr>
                  
                  {/* Filas para cada división transversal */}
                  {divisiones.map((division, index) => {
                    const lectura = getLectura(division);
                    const lecturaObj = lecturas.find(l => Math.abs(parseFloat(l.division_transversal) - parseFloat(division)) < 0.01);
                    
                    return (
                      <tr key={`division-${index}-${division}`} className="hover:bg-gray-50">
                        <td className="px-2 lg:px-4 py-2 text-center font-medium text-xs lg:text-sm">
                          {division === 0 ? '0.00' : formatNumber(Math.abs(division), 2)}
                          {division < 0 ? ' (I)' : division > 0 ? ' (D)' : ''}
                        </td>
                        <td className="px-2 lg:px-4 py-2"></td>
                        <td className="px-2 lg:px-4 py-2"></td>
                        <td className="px-2 lg:px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={lectura}
                            onChange={(e) => {
                              const nuevoValor = e.target.value;
                              const claveLocal = `${medicionActiva.id}-${division}`;
                              
                              // Actualizar valor local inmediatamente para mejor UX
                              setValoresLocales(prev => ({
                                ...prev,
                                [claveLocal]: nuevoValor
                              }));
                              
                              // Programar guardado automático con debounce
                              programarGuardado(division, nuevoValor);
                            }}
                            onBlur={(e) => {
                              const valor = e.target.value;
                              const claveLocal = `${medicionActiva.id}-${division}`;
                              
                              // Cancelar timeout pendiente y guardar inmediatamente
                              if (timeoutsGuardado[claveLocal]) {
                                clearTimeout(timeoutsGuardado[claveLocal]);
                                setTimeoutsGuardado(prev => {
                                  const nuevos = { ...prev };
                                  delete nuevos[claveLocal];
                                  return nuevos;
                                });
                              }
                              
                              if (valor && valor.trim() !== '' && valor !== getLectura(division)) {
                                handleGuardarLectura(division, valor);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const valor = e.target.value;
                                const claveLocal = `${medicionActiva.id}-${division}`;
                                
                                // Cancelar timeout pendiente y guardar inmediatamente
                                if (timeoutsGuardado[claveLocal]) {
                                  clearTimeout(timeoutsGuardado[claveLocal]);
                                  setTimeoutsGuardado(prev => {
                                    const nuevos = { ...prev };
                                    delete nuevos[claveLocal];
                                    return nuevos;
                                  });
                                }
                                
                                if (valor && valor.trim() !== '' && valor !== getLectura(division)) {
                                  handleGuardarLectura(division, valor);
                                }
                                e.target.blur(); // Quitar foco para activar onBlur
                              }
                            }}
                            className={`w-full px-2 py-2 text-center border rounded text-sm lg:text-base min-w-[100px] ${
                              lecturaObj?.clasificacion === 'CUMPLE' ? 'bg-green-50 border-green-300' :
                              lecturaObj?.clasificacion === 'CORTE' ? 'bg-red-50 border-red-300' :
                              lecturaObj?.clasificacion === 'TERRAPLEN' ? 'bg-yellow-50 border-yellow-300' :
                              'border-gray-300'
                            }`}
                            placeholder="0.000"
                          />
                        </td>
                        {/* Columnas de elevaciones calculadas */}
                        <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">
                          <span className={`font-medium ${
                            lecturaObj?.elv_base_real ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {lecturaObj?.elv_base_real ? formatNumber(lecturaObj.elv_base_real, 3) : '-'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">
                          <span className={`font-medium ${
                            lecturaObj?.elv_base_proyecto ? 'text-indigo-600' : 'text-gray-400'
                          }`}>
                            {lecturaObj?.elv_base_proyecto ? formatNumber(lecturaObj.elv_base_proyecto, 3) : '-'}
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-2 text-center text-xs lg:text-sm">
                          <span className={`font-medium ${
                            lecturaObj?.elv_concreto_proyecto ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {lecturaObj?.elv_concreto_proyecto ? formatNumber(lecturaObj.elv_concreto_proyecto, 3) : '-'}
                          </span>
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
            <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                <span className="text-xs lg:text-sm font-medium text-gray-700">Progreso de Lecturas</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs lg:text-sm text-gray-500">
                    {lecturas.length} de {divisiones.length} completadas
                  </span>
                  {Object.keys(valoresLocales).length > 0 && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      {Object.keys(valoresLocales).length} pendiente(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(lecturas.length / divisiones.length) * 100}%` }}
                ></div>
              </div>
              
            </div>
          )}
        </div>
      ) : vistaActiva === 'graficas' ? (
        /* Vista de gráficas */
        renderGrafica()
      ) : (
        /* Vista de resultados */
        renderResultados()
      )}

      {/* Estado de guardado */}
      {(createLectura.isLoading || updateLectura.isLoading) && (
        <div className="fixed bottom-3 right-3 lg:bottom-4 lg:right-4 bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg text-sm lg:text-base">
          {createLectura.isLoading ? 'Guardando nueva lectura...' : 'Actualizando lectura...'}
        </div>
      )}
      
      {createMedicion.isLoading && (
        <div className="fixed bottom-3 right-3 lg:bottom-4 lg:right-4 bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg text-sm lg:text-base">
          Creando medición...
        </div>
      )}
    </div>
  );
};

export default Campo;