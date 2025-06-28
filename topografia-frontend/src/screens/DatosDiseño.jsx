import React, { useState, useEffect } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { 
  useEstaciones, 
  useCreateEstacion, 
  useUpdateEstacion, 
  useDeleteEstacion 
} from '../hooks/estaciones/useEstaciones';
import { 
  useMediciones, 
  useCreateMedicion, 
  useUpdateMedicion, 
  useDeleteMedicion 
} from '../hooks/mediciones/useMediciones';
import { formatNumber } from '../utils/formatters';

const DatosDiseño = () => {
  const [vistaActiva, setVistaActiva] = useState('estaciones');
  const [editandoEstacion, setEditandoEstacion] = useState(null);
  const [editandoMedicion, setEditandoMedicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Hook para proyecto actual
  const { proyecto, tieneProyecto, informacionProyecto } = useProyecto();

  // Hooks para estaciones teóricas
  const { 
    data: estaciones = [], 
    isLoading: loadingEstaciones, 
    error: errorEstaciones 
  } = useEstaciones(proyecto?.id, { enabled: !!proyecto?.id });

  // Hooks para mediciones de estación
  const { 
    data: mediciones = [], 
    isLoading: loadingMediciones, 
    error: errorMediciones 
  } = useMediciones({ proyecto_id: proyecto?.id, enabled: !!proyecto?.id });

  // Mutations para estaciones
  const createEstacion = useCreateEstacion();
  const updateEstacion = useUpdateEstacion();
  const deleteEstacion = useDeleteEstacion();

  // Mutations para mediciones
  const createMedicion = useCreateMedicion();
  const updateMedicion = useUpdateMedicion();
  const deleteMedicion = useDeleteMedicion();

  // Estados para formularios
  const [nuevaEstacion, setNuevaEstacion] = useState({
    km: '',
    pendiente_derecha: '',
    base_cl: ''
  });

  const [nuevaMedicion, setNuevaMedicion] = useState({
    estacion_km: '',
    bn_altura: '',
    bn_lectura: '',
    operador: '',
    observaciones: ''
  });

  // Generar estaciones automáticamente para el proyecto
  const generarEstacionesAutomaticas = () => {
    if (!proyecto) return;

    const estacionesGeneradas = [];
    let kmActual = proyecto.km_inicial;

    while (kmActual <= proyecto.km_final) {
      // Solo crear si no existe ya
      const existeEstacion = estaciones.some(e => 
        Math.abs(parseFloat(e.km) - kmActual) < 0.001
      );

      if (!existeEstacion) {
        estacionesGeneradas.push({
          km: kmActual,
          pendiente_derecha: 0.02, // Valor por defecto 2%
          base_cl: 1886.14 // Valor por defecto
        });
      }

      kmActual += proyecto.intervalo;
    }

    // Crear todas las estaciones en paralelo
    estacionesGeneradas.forEach(estacion => {
      createEstacion.mutate({
        proyecto_id: proyecto.id,
        ...estacion
      });
    });
  };

  // Guardar estación (crear o actualizar)
  const handleGuardarEstacion = async (datos) => {
    if (!proyecto) return;

    try {
      if (editandoEstacion) {
        // Actualizar estación existente
        await updateEstacion.mutateAsync({
          estacionId: editandoEstacion.id,
          datosActualizados: datos
        });
        setEditandoEstacion(null);
      } else {
        // Crear nueva estación
        await createEstacion.mutateAsync({
          proyecto_id: proyecto.id,
          ...datos
        });
        setNuevaEstacion({ km: '', pendiente_derecha: '', base_cl: '' });
      }
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error guardando estación:', error);
      alert('Error al guardar estación: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Guardar medición (crear o actualizar)
  const handleGuardarMedicion = async (datos) => {
    if (!proyecto) return;

    try {
      if (editandoMedicion) {
        // Actualizar medición existente
        await updateMedicion.mutateAsync({
          medicionId: editandoMedicion.id,
          datosActualizados: datos
        });
        setEditandoMedicion(null);
      } else {
        // Crear nueva medición
        await createMedicion.mutateAsync({
          proyecto_id: proyecto.id,
          ...datos
        });
        setNuevaMedicion({
          estacion_km: '',
          bn_altura: '',
          bn_lectura: '',
          operador: '',
          observaciones: ''
        });
      }
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error guardando medición:', error);
      alert('Error al guardar medición: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Editar estación
  const handleEditarEstacion = (estacion) => {
    setEditandoEstacion(estacion);
    setNuevaEstacion({
      km: estacion.km,
      pendiente_derecha: estacion.pendiente_derecha * 100, // Convertir a porcentaje para edición
      base_cl: estacion.base_cl
    });
    setMostrarFormulario(true);
  };

  // Editar medición
  const handleEditarMedicion = (medicion) => {
    setEditandoMedicion(medicion);
    setNuevaMedicion({
      estacion_km: medicion.estacion_km,
      bn_altura: medicion.bn_altura,
      bn_lectura: medicion.bn_lectura,
      operador: medicion.operador || '',
      observaciones: medicion.observaciones || ''
    });
    setMostrarFormulario(true);
  };

  // Formatear KM para mostrar
  const formatearKM = (km) => {
    const kmNum = parseFloat(km);
    const kmMiles = Math.floor(kmNum / 1000);
    const metros = kmNum % 1000;
    return `${kmMiles}+${metros.toFixed(0).padStart(3, '0')}`;
  };

  // Renderizar tabla de estaciones teóricas
  const renderEstaciones = () => (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Estaciones Teóricas ({estaciones.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={generarEstacionesAutomaticas}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Generar Automático
          </button>
          <button
            onClick={() => {
              setEditandoEstacion(null);
              setNuevaEstacion({ km: '', pendiente_derecha: '', base_cl: '' });
              setMostrarFormulario(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Nueva Estación
          </button>
        </div>
      </div>

      {/* Loading/Error */}
      {loadingEstaciones && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando estaciones...</p>
        </div>
      )}

      {errorEstaciones && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {errorEstaciones.message}</p>
        </div>
      )}

      {/* Tabla de estaciones */}
      {!loadingEstaciones && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendiente Derecha (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base CL (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendiente Izquierda (%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estaciones.map((estacion) => (
                  <tr key={estacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearKM(estacion.km)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(estacion.pendiente_derecha * 100, 3)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(estacion.base_cl, 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(estacion.pendiente_derecha * -100, 3)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditarEstacion(estacion)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta estación?')) {
                            deleteEstacion.mutate(estacion.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {estaciones.length === 0 && !loadingEstaciones && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay estaciones configuradas</p>
              <p className="text-sm text-gray-400 mt-1">
                Usa "Generar Automático" o crea estaciones manualmente
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Renderizar tabla de mediciones
  const renderMediciones = () => (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Mediciones de Estación ({mediciones.length})
        </h3>
        <button
          onClick={() => {
            setEditandoMedicion(null);
            setNuevaMedicion({
              estacion_km: '',
              bn_altura: '',
              bn_lectura: '',
              operador: '',
              observaciones: ''
            });
            setMostrarFormulario(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nueva Medición
        </button>
      </div>

      {/* Loading/Error */}
      {loadingMediciones && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando mediciones...</p>
        </div>
      )}

      {errorMediciones && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {errorMediciones.message}</p>
        </div>
      )}

      {/* Tabla de mediciones */}
      {!loadingMediciones && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estación KM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BN Altura (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BN Lectura (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Altura Aparato (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mediciones.map((medicion) => (
                  <tr key={medicion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearKM(medicion.estacion_km)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(medicion.bn_altura, 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(medicion.bn_lectura, 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatNumber(medicion.altura_aparato, 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medicion.operador || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditarMedicion(medicion)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta medición?')) {
                            deleteMedicion.mutate(medicion.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mediciones.length === 0 && !loadingMediciones && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay mediciones configuradas</p>
              <p className="text-sm text-gray-400 mt-1">
                Agrega mediciones para las estaciones del proyecto
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Formulario para estaciones
  const renderFormularioEstacion = () => (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/20 overflow-y-auto h-full w-full z-50"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editandoEstacion ? 'Editar Estación' : 'Nueva Estación'}
        </h3>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleGuardarEstacion({
            km: parseFloat(nuevaEstacion.km),
            pendiente_derecha: parseFloat(nuevaEstacion.pendiente_derecha) / 100, // Convertir % a decimal
            base_cl: parseFloat(nuevaEstacion.base_cl)
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">KM</label>
              <input
                type="number"
                step="0.001"
                value={nuevaEstacion.km}
                onChange={(e) => setNuevaEstacion({...nuevaEstacion, km: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="15025.000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Pendiente Derecha (%)</label>
              <input
                type="number"
                step="0.001"
                value={nuevaEstacion.pendiente_derecha}
                onChange={(e) => setNuevaEstacion({...nuevaEstacion, pendiente_derecha: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="2.000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Base CL (m)</label>
              <input
                type="number"
                step="0.001"
                value={nuevaEstacion.base_cl}
                onChange={(e) => setNuevaEstacion({...nuevaEstacion, base_cl: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="1886.140"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEstacion.isLoading || updateEstacion.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {createEstacion.isLoading || updateEstacion.isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Formulario para mediciones
  const renderFormularioMedicion = () => (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/20 overflow-y-auto h-full w-full z-50"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editandoMedicion ? 'Editar Medición' : 'Nueva Medición'}
        </h3>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleGuardarMedicion({
            estacion_km: parseFloat(nuevaMedicion.estacion_km),
            bn_altura: parseFloat(nuevaMedicion.bn_altura),
            bn_lectura: parseFloat(nuevaMedicion.bn_lectura),
            operador: nuevaMedicion.operador,
            observaciones: nuevaMedicion.observaciones
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Estación KM</label>
              <input
                type="number"
                step="0.001"
                value={nuevaMedicion.estacion_km}
                onChange={(e) => setNuevaMedicion({...nuevaMedicion, estacion_km: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="15025.000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">BN Altura (m)</label>
              <input
                type="number"
                step="0.001"
                value={nuevaMedicion.bn_altura}
                onChange={(e) => setNuevaMedicion({...nuevaMedicion, bn_altura: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="1883.021"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">BN Lectura (m)</label>
              <input
                type="number"
                step="0.001"
                value={nuevaMedicion.bn_lectura}
                onChange={(e) => setNuevaMedicion({...nuevaMedicion, bn_lectura: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="3.289"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Operador</label>
              <input
                type="text"
                value={nuevaMedicion.operador}
                onChange={(e) => setNuevaMedicion({...nuevaMedicion, operador: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Nombre del operador"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                value={nuevaMedicion.observaciones}
                onChange={(e) => setNuevaMedicion({...nuevaMedicion, observaciones: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Observaciones adicionales"
                rows="3"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMedicion.isLoading || updateMedicion.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {createMedicion.isLoading || updateMedicion.isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
            Para configurar datos de diseño, primero seleccione un proyecto.
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Datos de Diseño</h1>
            <p className="text-gray-600 mt-1">
              Configuración de estaciones teóricas y mediciones de estación
            </p>
          </div>
          
          <div className="text-right">
            <h3 className="font-medium text-gray-900">{proyecto.nombre}</h3>
            <p className="text-sm text-gray-500">{proyecto.tramo}</p>
            <p className="text-xs text-gray-400">
              {formatearKM(proyecto.km_inicial)} → {formatearKM(proyecto.km_final)}
            </p>
          </div>
        </div>

        {/* Información del proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estaciones.length}</div>
            <div className="text-sm text-gray-600">Estaciones Teóricas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{mediciones.length}</div>
            <div className="text-sm text-gray-600">Mediciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatNumber(proyecto.intervalo, 1)}m
            </div>
            <div className="text-sm text-gray-600">Intervalo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-800">
              {formatNumber(proyecto.espesor * 1000, 0)}mm
            </div>
            <div className="text-sm text-gray-600">Espesor</div>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'estaciones', label: 'Estaciones Teóricas' },
            { id: 'mediciones', label: 'Mediciones de Estación' }
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido según pestaña activa */}
      <div>
        {vistaActiva === 'estaciones' && renderEstaciones()}
        {vistaActiva === 'mediciones' && renderMediciones()}
      </div>

      {/* Formularios modales */}
      {mostrarFormulario && vistaActiva === 'estaciones' && renderFormularioEstacion()}
      {mostrarFormulario && vistaActiva === 'mediciones' && renderFormularioMedicion()}
    </div>
  );
};

export default DatosDiseño;