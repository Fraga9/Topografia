import React, { useState, useMemo } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { useEstaciones } from '../hooks/estaciones/useEstaciones';
import { useMediciones } from '../hooks/mediciones/useMediciones';
import { useLecturas } from '../hooks/lecturas/useLecturas';
import { formatNumber } from '../utils/formatters';

const Analisis = () => {
  const [vistaActiva, setVistaActiva] = useState('estadisticas');

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

  // Consolidar todas las lecturas
  const todasLasLecturas = useMemo(() => {
    return lecturasQueries
      .map(query => query.data || [])
      .flat()
      .filter(lectura => lectura && lectura.elv_base_real !== null);
  }, [lecturasQueries]);

  // Análisis completo de estadísticas
  const analisisCompleto = useMemo(() => {
    if (!proyecto || !mediciones.length || todasLasLecturas.length === 0) {
      return null;
    }

    const lecturas = todasLasLecturas;
    
    // === ESTADÍSTICAS PRINCIPALES DEL PROYECTO ===
    const totalEstacionesPlanificadas = Math.ceil((proyecto.km_final - proyecto.km_inicial) / proyecto.intervalo) + 1;
    const estacionesMedidas = new Set(mediciones.map(m => m.estacion_km)).size;
    const totalDivisiones = (proyecto.divisiones_izquierdas?.length || 0) + (proyecto.divisiones_derechas?.length || 0) + 1;
    const divisionesMedidas = lecturas.length;
    const coberturaTransversal = divisionesMedidas / (estacionesMedidas * totalDivisiones) || 0;
    
    const fechasOrdenadas = mediciones
      .map(m => new Date(m.fecha_medicion))
      .filter(f => !isNaN(f))
      .sort((a, b) => a - b);
    
    const diasTrabajo = fechasOrdenadas.length > 0 
      ? Math.ceil((fechasOrdenadas[fechasOrdenadas.length - 1] - fechasOrdenadas[0]) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    
    const eficienciaDiaria = diasTrabajo > 0 ? estacionesMedidas / diasTrabajo : 0;

    // === ANÁLISIS DE ELEVACIONES Y GEOMETRÍA ===
    const elevacionesReales = lecturas.map(l => l.elv_base_real).filter(e => e !== null);
    const elevacionesProyecto = lecturas.map(l => l.elv_base_proyecto).filter(e => e !== null);
    const diferencias = lecturas
      .filter(l => l.elv_base_real !== null && l.elv_base_proyecto !== null)
      .map(l => l.elv_base_real - l.elv_base_proyecto);
    
    const rangElevacionesReales = elevacionesReales.length > 0 
      ? Math.max(...elevacionesReales) - Math.min(...elevacionesReales) 
      : 0;
    
    const diferenciaPromedio = diferencias.length > 0 
      ? diferencias.reduce((sum, d) => sum + d, 0) / diferencias.length 
      : 0;
    
    const varianza = diferencias.length > 0 
      ? diferencias.reduce((sum, d) => sum + Math.pow(d - diferenciaPromedio, 2), 0) / diferencias.length
      : 0;
    
    const desviacionEstandar = Math.sqrt(varianza);
    
    // Calcular pendiente promedio real
    const lecturasOrdenadas = lecturas
      .filter(l => l.division_transversal !== undefined && l.elv_base_real !== null)
      .sort((a, b) => a.division_transversal - b.division_transversal);
    
    let pendientePromedioReal = 0;
    if (lecturasOrdenadas.length > 1) {
      const pendientes = [];
      for (let i = 1; i < lecturasOrdenadas.length; i++) {
        const deltaElevacion = lecturasOrdenadas[i].elv_base_real - lecturasOrdenadas[i-1].elv_base_real;
        const deltaDistancia = lecturasOrdenadas[i].division_transversal - lecturasOrdenadas[i-1].division_transversal;
        if (deltaDistancia !== 0) {
          pendientes.push(deltaElevacion / deltaDistancia);
        }
      }
      pendientePromedioReal = pendientes.length > 0 
        ? pendientes.reduce((sum, p) => sum + p, 0) / pendientes.length 
        : 0;
    }

    // === ANÁLISIS DE TOLERANCIAS Y CALIDAD ===
    const diferenciasSCT = lecturas
      .filter(l => l.elv_base_real !== null && l.elv_base_proyecto !== null)
      .map(l => Math.abs(l.elv_base_real - l.elv_base_proyecto));
    
    const dentroDeToleranciaSCT = diferenciasSCT.filter(d => d <= proyecto.tolerancia_sct).length;
    const porcentajeDentroToleranciaSCT = diferenciasSCT.length > 0 
      ? (dentroDeToleranciaSCT / diferenciasSCT.length) * 100 
      : 0;
    
    // Distribución de calidades
    const distribucionCalidades = {
      EXCELENTE: lecturas.filter(l => l.calidad === 'EXCELENTE').length,
      BUENA: lecturas.filter(l => l.calidad === 'BUENA').length,
      REGULAR: lecturas.filter(l => l.calidad === 'REGULAR').length,
      REVISAR: lecturas.filter(l => l.calidad === 'REVISAR').length
    };
    
    // Puntos críticos (fuera de 3 veces la tolerancia)
    const puntosCriticos = diferenciasSCT.filter(d => d > proyecto.tolerancia_sct * 3).length;
    
    // Identificar zonas problemáticas (estaciones con >50% de lecturas fuera de tolerancia)
    const estacionesProblematicas = [];
    const lecturasAgrupadas = lecturas.reduce((grupos, lectura) => {
      const estacionKm = mediciones.find(m => m.id === lectura.medicion_id)?.estacion_km;
      if (estacionKm) {
        if (!grupos[estacionKm]) grupos[estacionKm] = [];
        grupos[estacionKm].push(lectura);
      }
      return grupos;
    }, {});
    
    Object.entries(lecturasAgrupadas).forEach(([estacionKm, lecturasEstacion]) => {
      const fueraDeToleranciaSCT = lecturasEstacion.filter(l => 
        l.elv_base_real !== null && l.elv_base_proyecto !== null &&
        Math.abs(l.elv_base_real - l.elv_base_proyecto) > proyecto.tolerancia_sct
      ).length;
      
      if (fueraDeToleranciaSCT / lecturasEstacion.length > 0.5) {
        estacionesProblematicas.push({
          km: parseFloat(estacionKm),
          porcentajeFuera: (fueraDeToleranciaSCT / lecturasEstacion.length) * 100
        });
      }
    });

    // === VOLÚMENES DE TRABAJO POR EJECUTAR ===
    const lecturasCorte = lecturas.filter(l => l.clasificacion === 'CORTE');
    const lecturasTerrапlen = lecturas.filter(l => l.clasificacion === 'TERRAPLEN');
    
    const volumenTotalCorte = lecturasCorte.reduce((sum, l) => {
      const diferencia = Math.abs(l.elv_base_real - l.elv_base_proyecto);
      // Aproximación de volumen: diferencia * área representativa (asumiendo 1m²)
      return sum + diferencia;
    }, 0);
    
    const volumenTotalTerrапlen = lecturasTerrапlen.reduce((sum, l) => {
      const diferencia = Math.abs(l.elv_base_real - l.elv_base_proyecto);
      return sum + diferencia;
    }, 0);
    
    const balanceMateriales = volumenTotalCorte - volumenTotalTerrапlen;
    
    // Costo estimado (valores ejemplo - deberían venir de configuración)
    const costoUnitarioCorte = 150; // pesos por m³
    const costoUnitarioTerrапlen = 120; // pesos por m³
    const costoEstimado = (volumenTotalCorte * costoUnitarioCorte) + (volumenTotalTerrапlen * costoUnitarioTerrапlen);

    // === INDICADORES DE CUMPLIMIENTO ===
    // Índice de calidad general (0-100)
    let puntuacionCalidad = 0;
    puntuacionCalidad += (distribucionCalidades.EXCELENTE / lecturas.length) * 40; // 40% por excelentes
    puntuacionCalidad += (distribucionCalidades.BUENA / lecturas.length) * 30; // 30% por buenas
    puntuacionCalidad += (distribucionCalidades.REGULAR / lecturas.length) * 20; // 20% por regulares
    puntuacionCalidad += (distribucionCalidades.REVISAR / lecturas.length) * 0; // 0% por revisar
    puntuacionCalidad += (porcentajeDentroToleranciaSCT / 100) * 30; // 30% por tolerancia SCT
    
    const indiceCalidadGeneral = Math.min(100, Math.max(0, puntuacionCalidad));
    
    // Eficiencia de campo (lecturas válidas vs total)
    const lecturasValidas = lecturas.filter(l => 
      l.calidad && ['EXCELENTE', 'BUENA'].includes(l.calidad)
    ).length;
    const eficienciaCampo = lecturas.length > 0 ? (lecturasValidas / lecturas.length) * 100 : 0;

    return {
      // Estadísticas principales
      totalEstacionesPlanificadas,
      estacionesMedidas,
      progresoPorcentaje: (estacionesMedidas / totalEstacionesPlanificadas) * 100,
      coberturaTransversal: coberturaTransversal * 100,
      diasTrabajo,
      eficienciaDiaria,
      
      // Elevaciones y geometría
      elevacionMinima: Math.min(...elevacionesReales),
      elevacionMaxima: Math.max(...elevacionesReales),
      rangElevacionesReales,
      diferenciaPromedio,
      desviacionEstandar,
      pendientePromedioReal,
      
      // Tolerancias y calidad
      porcentajeDentroToleranciaSCT,
      distribucionCalidades,
      puntosCriticos,
      estacionesProblematicas,
      
      // Volúmenes
      volumenTotalCorte,
      volumenTotalTerrапlen,
      balanceMateriales,
      costoEstimado,
      
      // Indicadores de cumplimiento
      indiceCalidadGeneral,
      eficienciaCampo,
      
      // Datos generales
      totalLecturas: lecturas.length,
      totalMediciones: mediciones.length,
      totalEstaciones: estaciones.length
    };
  }, [proyecto, mediciones, todasLasLecturas, estaciones]);

  const renderEstadisticasPrincipales = () => (
    <div className="space-y-6">
      {/* Estadísticas Principales del Proyecto */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estadísticas Principales del Proyecto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analisisCompleto ? formatNumber(analisisCompleto.progresoPorcentaje, 1) : 0}%
            </div>
            <div className="text-sm text-blue-600">Progreso de Mediciones</div>
            <div className="text-xs text-gray-500 mt-1">
              {analisisCompleto?.estacionesMedidas || 0} de {analisisCompleto?.totalEstacionesPlanificadas || 0}
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {analisisCompleto ? formatNumber(analisisCompleto.coberturaTransversal, 1) : 0}%
            </div>
            <div className="text-sm text-green-600">Cobertura Transversal</div>
            <div className="text-xs text-gray-500 mt-1">Divisiones medidas</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analisisCompleto?.diasTrabajo || 0}
            </div>
            <div className="text-sm text-purple-600">Días de Trabajo</div>
            <div className="text-xs text-gray-500 mt-1">Tiempo transcurrido</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analisisCompleto ? formatNumber(analisisCompleto.eficienciaDiaria, 2) : 0}
            </div>
            <div className="text-sm text-orange-600">Estaciones/Día</div>
            <div className="text-xs text-gray-500 mt-1">Eficiencia diaria</div>
          </div>
        </div>
      </div>
      
      {/* Análisis de Elevaciones y Geometría */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📏 Análisis de Elevaciones y Geometría</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {analisisCompleto ? formatNumber(analisisCompleto.rangElevacionesReales, 3) : 0} m
            </div>
            <div className="text-sm text-gray-600">Rango de Elevaciones</div>
            <div className="text-xs text-gray-500 mt-1">
              Min: {analisisCompleto ? formatNumber(analisisCompleto.elevacionMinima, 3) : 0} m | 
              Max: {analisisCompleto ? formatNumber(analisisCompleto.elevacionMaxima, 3) : 0} m
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {analisisCompleto ? formatNumber(analisisCompleto.diferenciaPromedio * 1000, 1) : 0} mm
            </div>
            <div className="text-sm text-gray-600">Diferencia Promedio</div>
            <div className="text-xs text-gray-500 mt-1">Proyecto vs Real</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              ±{analisisCompleto ? formatNumber(analisisCompleto.desviacionEstandar * 1000, 2) : 0} mm
            </div>
            <div className="text-sm text-gray-600">Desviación Estándar</div>
            <div className="text-xs text-gray-500 mt-1">Consistencia</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {analisisCompleto ? formatNumber(analisisCompleto.pendientePromedioReal * 100, 3) : 0}%
            </div>
            <div className="text-sm text-gray-600">Pendiente Promedio Real</div>
            <div className="text-xs text-gray-500 mt-1">Calculada de campo</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalisisTolerancia = () => (
    <div className="space-y-6">
      {/* Análisis de Tolerancias y Calidad */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Análisis de Tolerancias y Calidad</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {analisisCompleto ? formatNumber(analisisCompleto.porcentajeDentroToleranciaSCT, 1) : 0}%
            </div>
            <div className="text-sm text-green-600">Dentro de Tolerancia SCT</div>
            <div className="text-xs text-gray-500 mt-1">±{proyecto ? formatNumber(proyecto.tolerancia_sct * 1000, 0) : 0}mm</div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {analisisCompleto?.puntosCriticos || 0}
            </div>
            <div className="text-sm text-red-600">Puntos Críticos</div>
            <div className="text-xs text-gray-500 mt-1">>3x tolerancia</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analisisCompleto?.estacionesProblematicas?.length || 0}
            </div>
            <div className="text-sm text-orange-600">Zonas Problemáticas</div>
            <div className="text-xs text-gray-500 mt-1">>50% fuera tolerancia</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analisisCompleto?.totalLecturas || 0}
            </div>
            <div className="text-sm text-blue-600">Total Lecturas</div>
            <div className="text-xs text-gray-500 mt-1">Procesadas</div>
          </div>
        </div>
        
        {/* Distribución de Calidades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Distribución de Calidades</h4>
            <div className="space-y-3">
              {analisisCompleto && Object.entries(analisisCompleto.distribucionCalidades).map(([calidad, count]) => {
                const percentage = analisisCompleto.totalLecturas > 0 ? (count / analisisCompleto.totalLecturas) * 100 : 0;
                const colors = {
                  EXCELENTE: 'bg-green-500 text-green-800',
                  BUENA: 'bg-blue-500 text-blue-800',
                  REGULAR: 'bg-yellow-500 text-yellow-800',
                  REVISAR: 'bg-red-500 text-red-800'
                };
                
                return (
                  <div key={calidad} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{calidad}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[calidad].split(' ')[0]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {count} ({formatNumber(percentage, 1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Zonas Problemáticas */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Zonas Problemáticas</h4>
            {analisisCompleto?.estacionesProblematicas?.length > 0 ? (
              <div className="space-y-2">
                {analisisCompleto.estacionesProblematicas.slice(0, 5).map((estacion, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium">{formatearKM(estacion.km)}</span>
                    <span className="text-sm text-red-600">
                      {formatNumber(estacion.porcentajeFuera, 1)}% fuera
                    </span>
                  </div>
                ))}
                {analisisCompleto.estacionesProblematicas.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{analisisCompleto.estacionesProblematicas.length - 5} estaciones más
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600">
                <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No hay zonas problemáticas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVolumenes = () => (
    <div className="space-y-6">
      {/* Volúmenes de Trabajo por Ejecutar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ Volúmenes de Trabajo por Ejecutar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {analisisCompleto ? formatNumber(analisisCompleto.volumenTotalCorte, 3) : 0} m³
            </div>
            <div className="text-sm text-red-600">Volumen Total de Corte</div>
            <div className="text-xs text-gray-500 mt-1">Material a remover</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analisisCompleto ? formatNumber(analisisCompleto.volumenTotalTerrапlen, 3) : 0} m³
            </div>
            <div className="text-sm text-orange-600">Volumen Total de Terraplén</div>
            <div className="text-xs text-gray-500 mt-1">Material a colocar</div>
          </div>
          
          <div className={`border rounded-lg p-4 text-center ${
            (analisisCompleto?.balanceMateriales || 0) >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`text-2xl font-bold ${
              (analisisCompleto?.balanceMateriales || 0) >= 0 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {analisisCompleto ? formatNumber(Math.abs(analisisCompleto.balanceMateriales), 3) : 0} m³
            </div>
            <div className={`text-sm ${
              (analisisCompleto?.balanceMateriales || 0) >= 0 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {(analisisCompleto?.balanceMateriales || 0) >= 0 ? 'Exceso' : 'Déficit'} de Material
            </div>
            <div className="text-xs text-gray-500 mt-1">Balance corte-terraplén</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${analisisCompleto ? formatNumber(analisisCompleto.costoEstimado, 0) : 0}
            </div>
            <div className="text-sm text-purple-600">Costo Estimado</div>
            <div className="text-xs text-gray-500 mt-1">Pesos mexicanos</div>
          </div>
        </div>
        
        {/* Desglose detallado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Desglose de Costos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Trabajos de Corte:</span>
                <span className="font-medium">
                  ${analisisCompleto ? formatNumber((analisisCompleto.volumenTotalCorte * 150), 0) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trabajos de Terraplén:</span>
                <span className="font-medium">
                  ${analisisCompleto ? formatNumber((analisisCompleto.volumenTotalTerrапlen * 120), 0) : 0}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>${analisisCompleto ? formatNumber(analisisCompleto.costoEstimado, 0) : 0}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              *Precios unitarios: Corte $150/m³, Terraplén $120/m³
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Recomendaciones</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {analisisCompleto?.balanceMateriales > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Hay exceso de material de corte que puede reutilizarse</span>
                </div>
              )}
              {analisisCompleto?.balanceMateriales < 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">⚠</span>
                  <span>Se requiere material adicional de banco</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-blue-500">ℹ</span>
                <span>Optimizar rutas de acarreo entre cortes y terraplenes</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500">📋</span>
                <span>Planificar secuencia de trabajo por secciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIndicadoresCumplimiento = () => (
    <div className="space-y-6">
      {/* Indicadores de Cumplimiento */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Indicadores de Cumplimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(analisisCompleto?.indiceCalidadGeneral || 0) * 2.51}, 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {analisisCompleto ? Math.round(analisisCompleto.indiceCalidadGeneral) : 0}
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Índice de Calidad General</div>
            <div className="text-xs text-gray-500">Score 0-100</div>
          </div>
          
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(analisisCompleto?.porcentajeDentroToleranciaSCT || 0) * 2.51}, 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">
                  {analisisCompleto ? Math.round(analisisCompleto.porcentajeDentroToleranciaSCT) : 0}%
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">% Cumplimiento SCT</div>
            <div className="text-xs text-gray-500">Dentro de especificaciones</div>
          </div>
          
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(analisisCompleto?.eficienciaCampo || 0) * 2.51}, 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-yellow-600">
                  {analisisCompleto ? Math.round(analisisCompleto.eficienciaCampo) : 0}%
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Eficiencia de Campo</div>
            <div className="text-xs text-gray-500">Lecturas válidas vs total</div>
          </div>
        </div>
        
        {/* Desglose de indicadores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Componentes del Índice de Calidad</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lecturas Excelentes (40%):</span>
                <span className="font-medium">
                  {analisisCompleto ? 
                    formatNumber((analisisCompleto.distribucionCalidades.EXCELENTE / analisisCompleto.totalLecturas) * 40, 1) 
                    : 0} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lecturas Buenas (30%):</span>
                <span className="font-medium">
                  {analisisCompleto ? 
                    formatNumber((analisisCompleto.distribucionCalidades.BUENA / analisisCompleto.totalLecturas) * 30, 1) 
                    : 0} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lecturas Regulares (20%):</span>
                <span className="font-medium">
                  {analisisCompleto ? 
                    formatNumber((analisisCompleto.distribucionCalidades.REGULAR / analisisCompleto.totalLecturas) * 20, 1) 
                    : 0} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tolerancia SCT (30%):</span>
                <span className="font-medium">
                  {analisisCompleto ? 
                    formatNumber((analisisCompleto.porcentajeDentroToleranciaSCT / 100) * 30, 1) 
                    : 0} pts
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Interpretación de Resultados</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {analisisCompleto?.indiceCalidadGeneral >= 90 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500">🏆</span>
                  <span>Excelente calidad, cumple con todos los estándares</span>
                </div>
              )}
              {analisisCompleto?.indiceCalidadGeneral >= 70 && analisisCompleto?.indiceCalidadGeneral < 90 && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">✅</span>
                  <span>Buena calidad, dentro de parámetros aceptables</span>
                </div>
              )}
              {analisisCompleto?.indiceCalidadGeneral >= 50 && analisisCompleto?.indiceCalidadGeneral < 70 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <span>Calidad regular, requiere mejoras</span>
                </div>
              )}
              {analisisCompleto?.indiceCalidadGeneral < 50 && (
                <div className="flex items-start gap-2">
                  <span className="text-red-500">🚨</span>
                  <span>Calidad deficiente, requiere revisión urgente</span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📊</span>
                  <span>
                    Progreso del proyecto: {analisisCompleto ? formatNumber(analisisCompleto.progresoPorcentaje, 1) : 0}% completado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResumenGeneral = () => (
    <div className="space-y-6">
      {/* Resumen ejecutivo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Resumen Ejecutivo del Análisis</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Estado General del Proyecto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span>Progreso de Mediciones:</span>
                <span className="font-medium text-blue-600">
                  {analisisCompleto ? formatNumber(analisisCompleto.progresoPorcentaje, 1) : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span>Cobertura Transversal:</span>
                <span className="font-medium text-green-600">
                  {analisisCompleto ? formatNumber(analisisCompleto.coberturaTransversal, 1) : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span>Índice de Calidad:</span>
                <span className="font-medium text-yellow-600">
                  {analisisCompleto ? Math.round(analisisCompleto.indiceCalidadGeneral) : 0}/100
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                <span>Costo Total Estimado:</span>
                <span className="font-medium text-purple-600">
                  ${analisisCompleto ? formatNumber(analisisCompleto.costoEstimado, 0) : 0}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Puntos Clave de Atención</h4>
            <div className="space-y-2 text-sm">
              {analisisCompleto?.porcentajeDentroToleranciaSCT < 80 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <span>Solo {analisisCompleto ? formatNumber(analisisCompleto.porcentajeDentroToleranciaSCT, 1) : 0}% dentro de tolerancia SCT</span>
                </div>
              )}
              
              {analisisCompleto?.puntosCriticos > 0 && (
                <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                  <span className="text-orange-500 mt-0.5">🚨</span>
                  <span>{analisisCompleto.puntosCriticos} puntos críticos requieren atención inmediata</span>
                </div>
              )}
              
              {analisisCompleto?.estacionesProblematicas?.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-500 mt-0.5">📍</span>
                  <span>{analisisCompleto.estacionesProblematicas.length} estaciones requieren revisión detallada</span>
                </div>
              )}
              
              {analisisCompleto?.balanceMateriales < 0 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <span className="text-blue-500 mt-0.5">🏗️</span>
                  <span>Déficit de {formatNumber(Math.abs(analisisCompleto.balanceMateriales), 1)} m³ de material</span>
                </div>
              )}
              
              {(!analisisCompleto?.porcentajeDentroToleranciaSCT || analisisCompleto?.porcentajeDentroToleranciaSCT >= 95) &&
               (!analisisCompleto?.puntosCriticos || analisisCompleto?.puntosCriticos === 0) &&
               (!analisisCompleto?.estacionesProblematicas?.length || analisisCompleto?.estacionesProblematicas.length === 0) && (
                <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                  <span className="text-green-500 mt-0.5">✅</span>
                  <span>Proyecto dentro de parámetros óptimos de calidad</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla consolidada de todas las mediciones */}
      {analisisCompleto && mediciones.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-3">Detalle por Estación</h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dentro Tolerancia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calidad Promedio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trabajo Requerido
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mediciones.map((medicion, index) => {
                  const lecturasEstacion = lecturasQueries[index]?.data || [];
                  const dentroToleranciaSCT = lecturasEstacion.filter(l => 
                    l.elv_base_real !== null && l.elv_base_proyecto !== null &&
                    Math.abs(l.elv_base_real - l.elv_base_proyecto) <= proyecto.tolerancia_sct
                  ).length;
                  const porcentajeToleranciaSCT = lecturasEstacion.length > 0 
                    ? (dentroToleranciaSCT / lecturasEstacion.length) * 100 
                    : 0;
                  
                  const lecturasValidas = lecturasEstacion.filter(l => 
                    ['EXCELENTE', 'BUENA'].includes(l.calidad)
                  ).length;
                  const calidadPromedio = lecturasEstacion.length > 0 
                    ? (lecturasValidas / lecturasEstacion.length) * 100 
                    : 0;
                  
                  const tiposDetrabajo = new Set(lecturasEstacion.map(l => l.clasificacion)).size;
                  
                  return (
                    <tr key={medicion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatearKM(medicion.estacion_km)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lecturasEstacion.length}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          porcentajeToleranciaSCT >= 95 
                            ? 'bg-green-100 text-green-800'
                            : porcentajeToleranciaSCT >= 80
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatNumber(porcentajeToleranciaSCT, 1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          calidadPromedio >= 90 
                            ? 'bg-green-100 text-green-800'
                            : calidadPromedio >= 70
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatNumber(calidadPromedio, 1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tiposDetrabajo > 1 ? 'Mixto' : lecturasEstacion[0]?.clasificacion || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análisis Topográfico</h1>
            <p className="text-gray-600 mt-1">
              Estadísticas concretas y análisis de calidad para la toma de decisiones
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Sistema de Análisis</div>
            <div className="text-lg font-medium text-gray-900">v2.0</div>
          </div>
        </div>
      </div>

      {tieneProyecto ? (
        <>
          {/* Header del proyecto */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{proyecto.nombre}</h2>
                <p className="text-gray-600">{proyecto.tramo}</p>
                <p className="text-sm text-gray-500">
                  {formatearKM(proyecto.km_inicial)} → {formatearKM(proyecto.km_final)}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Última actualización</div>
                <div className="text-lg font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Navegación de pestañas */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'estadisticas', label: 'Estadísticas Principales', icon: '📊' },
                { id: 'tolerancia', label: 'Tolerancias y Calidad', icon: '⚠️' },
                { id: 'volumenes', label: 'Volúmenes de Trabajo', icon: '🏗️' },
                { id: 'cumplimiento', label: 'Indicadores de Cumplimiento', icon: '🎯' },
                { id: 'resumen', label: 'Resumen Ejecutivo', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVistaActiva(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    vistaActiva === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Loading */}
          {(loadingEstaciones || loadingMediciones) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando datos del proyecto...</p>
            </div>
          )}

          {/* Contenido según pestaña activa */}
          {!loadingEstaciones && !loadingMediciones && (
            <div>
              {vistaActiva === 'estadisticas' && renderEstadisticasPrincipales()}
              {vistaActiva === 'tolerancia' && renderAnalisisTolerancia()}
              {vistaActiva === 'volumenes' && renderVolumenes()}
              {vistaActiva === 'cumplimiento' && renderIndicadoresCumplimiento()}
              {vistaActiva === 'resumen' && renderResumenGeneral()}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona un proyecto para comenzar el análisis
          </h3>
          <p className="text-gray-600 mb-4">
            Para ver estadísticas y análisis detallados, primero selecciona un proyecto.
          </p>
          <button 
            onClick={() => window.location.href = '/proyectos'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg"
          >
            Ir a Proyectos
          </button>
        </div>
      )}
    </div>
  );
};

export default Analisis;
