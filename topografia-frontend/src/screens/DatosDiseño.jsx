import React, { useState } from 'react';
import { useProyectos } from '../hooks';
import { 
  useEstaciones, 
  useEstacionesDiagnostic 
} from '../hooks/estaciones/useEstaciones';
import { 
  useMediciones, 
  useMedicionesDiagnostic 
} from '../hooks/mediciones/useMediciones';
import { formatNumber, formatDate } from '../utils/formatters';

const DatosDiseno = () => {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('parametros');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // 🔧 DEBUGGING: Añadir diagnósticos automáticos en desarrollo
  useEstacionesDiagnostic();
  useMedicionesDiagnostic();

  // 🔍 DEBUGGING: Monitorear cambios en proyectoSeleccionado
  React.useEffect(() => {
    console.group('📊 DatosDiseno Debug - Proyecto Seleccionado');
    console.log('🔢 proyectoSeleccionado:', proyectoSeleccionado);
    console.log('🔢 tipo:', typeof proyectoSeleccionado);
    console.log('🔢 valor parsed:', proyectoSeleccionado ? parseInt(proyectoSeleccionado) : null);
    console.groupEnd();
  }, [proyectoSeleccionado]);

  // Hooks para datos con debugging mejorado
  const { data: proyectos, isLoading: proyectosLoading, error: proyectosError } = useProyectos();
  
  // CORREGIDO: Usar la signature correcta para estaciones
  const { 
    data: estaciones, 
    isLoading: estacionesLoading, 
    error: estacionesError 
  } = useEstaciones(proyectoSeleccionado); // Pasamos directamente el ID
  
  // CORREGIDO: Usar la signature correcta para mediciones
  const { 
    data: mediciones, 
    isLoading: medicionesLoading, 
    error: medicionesError 
  } = useMediciones({ proyecto_id: proyectoSeleccionado }); // Objeto con proyecto_id

  // 🔍 DEBUGGING: Monitorear el estado de los hooks
  React.useEffect(() => {
    console.group('📊 Estado de Hooks en DatosDiseno');
    console.log('👥 Proyectos:', {
      loading: proyectosLoading,
      error: !!proyectosError,
      cantidad: proyectos?.length || 0
    });
    console.log('📍 Estaciones:', {
      loading: estacionesLoading,
      error: !!estacionesError,
      cantidad: estaciones?.length || 0,
      proyectoId: proyectoSeleccionado
    });
    console.log('📏 Mediciones:', {
      loading: medicionesLoading,
      error: !!medicionesError,
      cantidad: mediciones?.length || 0,
      proyectoId: proyectoSeleccionado
    });
    
    if (estacionesError) {
      console.error('❌ Error en estaciones:', estacionesError);
    }
    if (medicionesError) {
      console.error('❌ Error en mediciones:', medicionesError);
    }
    
    console.groupEnd();
  }, [
    proyectosLoading, proyectosError, proyectos?.length,
    estacionesLoading, estacionesError, estaciones?.length,
    medicionesLoading, medicionesError, mediciones?.length,
    proyectoSeleccionado
  ]);

  const [parametrosDiseno, setParametrosDiseno] = useState({
    velocidad_diseno: 80,
    radio_minimo: 150,
    pendiente_maxima: 8,
    ancho_calzada: 7.0,
    ancho_acotamiento: 2.5,
    altura_libre: 5.5,
    sobreelevacion_maxima: 8,
    longitud_curva_vertical: 100,
    distancia_visibilidad: 110
  });

  const [tolerancias, setTolerancia] = useState({
    elevacion: 0.02,
    horizontal: 0.05,
    angular: 30, // segundos
    distancia: 0.01
  });

  const proyectoSeleccionadoData = proyectos?.find(p => p.id === parseInt(proyectoSeleccionado));

  // 🔍 DEBUGGING: Función de validación mejorada con logging
  const validarParametros = () => {
    console.group('🔍 Ejecutando validación de parámetros');
    console.log('📊 Datos disponibles:', {
      tieneEstaciones: !!estaciones?.length,
      cantidadEstaciones: estaciones?.length || 0,
      tieneParametros: !!parametrosDiseno,
      proyectoSeleccionado
    });

    const validaciones = [];
    
    // Validaciones de estaciones vs parámetros de diseño
    if (estaciones && estaciones.length > 1) {
      console.log('🔄 Iniciando validaciones entre estaciones...');
      
      for (let i = 0; i < estaciones.length - 1; i++) {
        const estacion1 = estaciones[i];
        const estacion2 = estaciones[i + 1];
        
        console.log(`🔍 Validando entre estación ${i} y ${i + 1}:`, {
          estacion1: estacion1.nombre || estacion1.id,
          estacion2: estacion2.nombre || estacion2.id
        });
        
        try {
          // Calcular distancia horizontal
          const dx = parseFloat(estacion2.coordenada_x) - parseFloat(estacion1.coordenada_x);
          const dy = parseFloat(estacion2.coordenada_y) - parseFloat(estacion1.coordenada_y);
          const distanciaHorizontal = Math.sqrt(dx * dx + dy * dy);
          
          // Calcular pendiente
          const dz = parseFloat(estacion2.elevacion) - parseFloat(estacion1.elevacion);
          const pendiente = Math.abs((dz / distanciaHorizontal) * 100);
          
          console.log(`📐 Cálculos para estaciones ${i}-${i+1}:`, {
            distanciaHorizontal: distanciaHorizontal.toFixed(3),
            diferenciaNivel: dz.toFixed(3),
            pendiente: pendiente.toFixed(2) + '%'
          });
          
          if (pendiente > parametrosDiseno.pendiente_maxima) {
            const validacion = {
              tipo: 'pendiente',
              severidad: 'alta',
              descripcion: `Pendiente ${pendiente.toFixed(2)}% excede el máximo (${parametrosDiseno.pendiente_maxima}%) entre estaciones ${estacion1.nombre || estacion1.id} y ${estacion2.nombre || estacion2.id}`,
              estaciones: [estacion1.nombre || estacion1.id, estacion2.nombre || estacion2.id],
              valor_actual: pendiente,
              valor_limite: parametrosDiseno.pendiente_maxima
            };
            
            validaciones.push(validacion);
            console.warn('⚠️ Pendiente excesiva detectada:', validacion);
          }
          
          // Validar radio mínimo (simplificado)
          if (i > 0 && i < estaciones.length - 2) {
            const estacion0 = estaciones[i - 1];
            const estacion3 = estaciones[i + 2];
            
            try {
              // Calcular ángulo (simplificado)
              const v1x = parseFloat(estacion1.coordenada_x) - parseFloat(estacion0.coordenada_x);
              const v1y = parseFloat(estacion1.coordenada_y) - parseFloat(estacion0.coordenada_y);
              const v2x = parseFloat(estacion3.coordenada_x) - parseFloat(estacion2.coordenada_x);
              const v2y = parseFloat(estacion3.coordenada_y) - parseFloat(estacion2.coordenada_y);
              
              const dotProduct = v1x * v2x + v1y * v2y;
              const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
              const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
              
              if (mag1 > 0 && mag2 > 0) {
                const cosAngulo = dotProduct / (mag1 * mag2);
                const angulo = Math.acos(Math.max(-1, Math.min(1, cosAngulo))); // Clamp para evitar NaN
                
                if (angulo < Math.PI * 0.8) { // Si hay curvatura significativa
                  const radioAproximado = distanciaHorizontal / (Math.PI - angulo);
                  
                  console.log(`🔄 Radio calculado para zona ${i}:`, {
                    angulo: (angulo * 180 / Math.PI).toFixed(2) + '°',
                    radioAproximado: radioAproximado.toFixed(1) + 'm'
                  });
                  
                  if (radioAproximado < parametrosDiseno.radio_minimo) {
                    const validacion = {
                      tipo: 'radio',
                      severidad: 'media',
                      descripcion: `Radio de curvatura ${radioAproximado.toFixed(0)}m menor al mínimo (${parametrosDiseno.radio_minimo}m) en zona de estación ${estacion1.nombre || estacion1.id}`,
                      estaciones: [estacion1.nombre || estacion1.id],
                      valor_actual: radioAproximado,
                      valor_limite: parametrosDiseno.radio_minimo
                    };
                    
                    validaciones.push(validacion);
                    console.warn('⚠️ Radio insuficiente detectado:', validacion);
                  }
                }
              }
            } catch (radioError) {
              console.warn('⚠️ Error calculando radio en zona', i, ':', radioError.message);
            }
          }
        } catch (validacionError) {
          console.error('❌ Error en validación entre estaciones', i, 'y', i+1, ':', validacionError);
        }
      }
    } else {
      console.log('ℹ️ No hay suficientes estaciones para validar (mínimo 2 requeridas)');
    }

    console.log('✅ Validación completada:', {
      totalValidaciones: validaciones.length,
      erroresCriticos: validaciones.filter(v => v.severidad === 'alta').length,
      advertencias: validaciones.filter(v => v.severidad === 'media').length
    });
    console.groupEnd();

    return validaciones;
  };

  const validacionesResultado = validarParametros();

  const renderParametros = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Parámetros Geométricos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'velocidad_diseno', label: 'Velocidad de Diseño', unidad: 'km/h', min: 40, max: 120 },
            { key: 'radio_minimo', label: 'Radio Mínimo', unidad: 'm', min: 50, max: 500 },
            { key: 'pendiente_maxima', label: 'Pendiente Máxima', unidad: '%', min: 3, max: 12 },
            { key: 'ancho_calzada', label: 'Ancho de Calzada', unidad: 'm', min: 3.0, max: 14.0, step: 0.5 },
            { key: 'ancho_acotamiento', label: 'Ancho de Acotamiento', unidad: 'm', min: 0.5, max: 4.0, step: 0.5 },
            { key: 'altura_libre', label: 'Altura Libre', unidad: 'm', min: 4.5, max: 7.0, step: 0.1 },
            { key: 'sobreelevacion_maxima', label: 'Sobreelevación Máxima', unidad: '%', min: 4, max: 12 },
            { key: 'longitud_curva_vertical', label: 'Longitud Curva Vertical', unidad: 'm', min: 50, max: 300 },
            { key: 'distancia_visibilidad', label: 'Distancia de Visibilidad', unidad: 'm', min: 60, max: 200 }
          ].map((param) => (
            <div key={param.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {param.label} ({param.unidad})
              </label>
              <input
                type="number"
                min={param.min}
                max={param.max}
                step={param.step || 1}
                value={parametrosDiseno[param.key]}
                onChange={(e) => setParametrosDiseno({
                  ...parametrosDiseno,
                  [param.key]: parseFloat(e.target.value)
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
            Restaurar valores por defecto
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
            Guardar parámetros
          </button>
        </div>
      </div>

      {/* Tolerancias */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tolerancias de Medición
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'elevacion', label: 'Elevación', unidad: 'm', step: 0.001 },
            { key: 'horizontal', label: 'Posición Horizontal', unidad: 'm', step: 0.001 },
            { key: 'angular', label: 'Angular', unidad: '"', step: 1 },
            { key: 'distancia', label: 'Distancia', unidad: 'm', step: 0.001 }
          ].map((tol) => (
            <div key={tol.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {tol.label} (±{tol.unidad})
              </label>
              <input
                type="number"
                step={tol.step}
                value={tolerancias[tol.key]}
                onChange={(e) => setTolerancia({
                  ...tolerancias,
                  [tol.key]: parseFloat(e.target.value)
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderValidacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Validación de Diseño
          </h3>
          <button 
            onClick={() => {
              console.log('🔄 Ejecutando validación manual...');
              validarParametros();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Ejecutar validación
          </button>
        </div>
        
        {/* Estado de carga */}
        {(estacionesLoading || medicionesLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Cargando datos para validación...</span>
            </div>
          </div>
        )}

        {/* Errores de carga */}
        {(estacionesError || medicionesError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-red-800 font-medium">Error cargando datos:</h4>
            {estacionesError && <p className="text-red-700 text-sm">Estaciones: {estacionesError.message}</p>}
            {medicionesError && <p className="text-red-700 text-sm">Mediciones: {medicionesError.message}</p>}
          </div>
        )}
        
        {proyectoSeleccionado ? (
          <div className="space-y-4">
            {/* Información de datos cargados */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Datos Disponibles</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Estaciones:</span>
                  <span className="ml-2 font-medium">{estaciones?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Mediciones:</span>
                  <span className="ml-2 font-medium">{mediciones?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className="ml-2 font-medium">{proyectoSeleccionadoData?.estado || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Resumen de validación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 font-medium">Errores Críticos</div>
                <div className="text-2xl font-bold text-red-700">
                  {validacionesResultado.filter(v => v.severidad === 'alta').length}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-600 font-medium">Advertencias</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {validacionesResultado.filter(v => v.severidad === 'media').length}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-600 font-medium">Validaciones Pasadas</div>
                <div className="text-2xl font-bold text-green-700">
                  {Math.max(0, (estaciones?.length || 0) - validacionesResultado.length)}
                </div>
              </div>
            </div>

            {/* Lista de validaciones */}
            {validacionesResultado.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Problemas Detectados</h4>
                {validacionesResultado.map((validacion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      validacion.severidad === 'alta' 
                        ? 'bg-red-50 border-l-red-500' 
                        : 'bg-yellow-50 border-l-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className={`font-medium ${
                          validacion.severidad === 'alta' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {validacion.tipo.charAt(0).toUpperCase() + validacion.tipo.slice(1)} fuera de especificación
                        </h5>
                        <p className={`text-sm mt-1 ${
                          validacion.severidad === 'alta' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {validacion.descripcion}
                        </p>
                        <div className="text-xs mt-2 space-x-4">
                          <span>Valor actual: {formatNumber(validacion.valor_actual, 2)}</span>
                          <span>Límite: {formatNumber(validacion.valor_limite, 2)}</span>
                        </div>
                      </div>
                      <span className={`text-2xl ${
                        validacion.severidad === 'alta' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {validacion.severidad === 'alta' ? '🚨' : '⚠️'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-500 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ✅ Validación Exitosa
                </h3>
                <p className="text-gray-600">
                  Todos los parámetros cumplen con las especificaciones de diseño.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Selecciona un proyecto para ejecutar la validación de diseño</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderImportacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Importar Datos de Diseño
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Área de carga de archivos */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Cargar Archivos</h4>
            
            {[
              { tipo: 'CAD (DWG/DXF)', formatos: '.dwg, .dxf', descripcion: 'Archivos de AutoCAD' },
              { tipo: 'CSV/Excel', formatos: '.csv, .xlsx', descripcion: 'Datos tabulares' },
              { tipo: 'LandXML', formatos: '.xml', descripcion: 'Estándar de intercambio' },
              { tipo: 'Shape Files', formatos: '.shp, .dbf', descripcion: 'Archivos de ArcGIS' }
            ].map((formato) => (
              <div key={formato.tipo} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <div className="space-y-2">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formato.tipo}</p>
                    <p className="text-xs text-gray-500">{formato.descripcion}</p>
                    <p className="text-xs text-gray-400">{formato.formatos}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Opciones de importación */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Opciones de Importación</h4>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Validar coordenadas automáticamente</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Aplicar tolerancias de diseño</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600" />
                <span className="ml-2 text-sm text-gray-700">Sobrescribir datos existentes</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Generar reporte de importación</span>
              </label>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistema de coordenadas
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>UTM Zona 14N (EPSG:32614)</option>
                <option>WGS84 Geographic (EPSG:4326)</option>
                <option>NAD83 / UTM zone 14N (EPSG:26914)</option>
                <option>Personalizado...</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
            Procesar archivos
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Datos de Diseño</h1>
          <p className="text-gray-600 mt-1">
            Gestiona parámetros de diseño, validaciones y importación de datos
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={proyectoSeleccionado || ''}
            onChange={(e) => {
              const valor = e.target.value || null;
              console.log('🔄 Cambiando proyecto seleccionado:', valor);
              setProyectoSeleccionado(valor);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Estado de carga global */}
      {proyectosLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Cargando proyectos...</span>
          </div>
        </div>
      )}

      {/* Errores globales */}
      {proyectosError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error cargando proyectos</h3>
              <p className="mt-1 text-sm text-red-700">{proyectosError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información del proyecto seleccionado */}
      {proyectoSeleccionadoData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-medium text-indigo-900">{proyectoSeleccionadoData.nombre}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2 text-sm text-indigo-700">
            <div className="flex items-center">
              <span className="font-medium">Estaciones:</span>
              <span className="ml-2">
                {estacionesLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                ) : estacionesError ? (
                  <span className="text-red-600">Error</span>
                ) : (
                  estaciones?.length || 0
                )}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Mediciones:</span>
              <span className="ml-2">
                {medicionesLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                ) : medicionesError ? (
                  <span className="text-red-600">Error</span>
                ) : (
                  mediciones?.length || 0
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <span className="ml-2">{proyectoSeleccionadoData.estado}</span>
            </div>
            <div>
              <span className="font-medium">ID:</span>
              <span className="ml-2">{proyectoSeleccionadoData.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'parametros', label: 'Parámetros de Diseño', icon: '⚙️' },
            { id: 'validacion', label: 'Validación', icon: '✅' },
            { id: 'importacion', label: 'Importar Datos', icon: '📁' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActiva(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                vistaActiva === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido según pestaña activa */}
      <div>
        {vistaActiva === 'parametros' && renderParametros()}
        {vistaActiva === 'validacion' && renderValidacion()}
        {vistaActiva === 'importacion' && renderImportacion()}
      </div>

      {/* Panel de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
          <h3 className="text-green-300 font-bold mb-2">🔧 Panel de Debug - DatosDiseno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>Proyecto seleccionado: {proyectoSeleccionado || 'null'}</p>
              <p>Proyectos cargados: {proyectos?.length || 0}</p>
              <p>Vista activa: {vistaActiva}</p>
            </div>
            <div>
              <p>Estaciones: {estaciones?.length || 0} (loading: {estacionesLoading ? 'sí' : 'no'})</p>
              <p>Mediciones: {mediciones?.length || 0} (loading: {medicionesLoading ? 'sí' : 'no'})</p>
              <p>Validaciones: {validacionesResultado.length}</p>
            </div>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-green-300">Ver estado completo</summary>
            <pre className="mt-1 text-xs overflow-auto max-h-32 text-white">
{JSON.stringify({
  proyectoSeleccionado,
  estacionesState: {
    loading: estacionesLoading,
    error: estacionesError?.message,
    count: estaciones?.length
  },
  medicionesState: {
    loading: medicionesLoading,
    error: medicionesError?.message,
    count: mediciones?.length
  },
  validaciones: validacionesResultado.length
}, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default DatosDiseno;