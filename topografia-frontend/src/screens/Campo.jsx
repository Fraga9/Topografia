import React, { useState } from 'react';
import { 
  useEstaciones, 
  useCreateEstacion, 
  useMediciones, 
  useCreateMedicion,
  useLecturas,
  useCreateLectura 
} from '../hooks';
import { formatDate, formatNumber } from '../utils/formatters';

const Campo = () => {
  const [vistaActiva, setVistaActiva] = useState('estaciones');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Hooks para gestión de datos de campo
  const { 
    data: estaciones, 
    isLoading: loadingEstaciones 
  } = useEstaciones({ proyecto_id: proyectoSeleccionado });
  
  const { 
    data: mediciones, 
    isLoading: loadingMediciones 
  } = useMediciones({ proyecto_id: proyectoSeleccionado });
  
  const createEstacion = useCreateEstacion();
  const createMedicion = useCreateMedicion();

  const [formDataEstacion, setFormDataEstacion] = useState({
    nombre: '',
    coordenada_x: '',
    coordenada_y: '',
    elevacion: '',
    descripcion: ''
  });

  const [formDataMedicion, setFormDataMedicion] = useState({
    estacion_id: '',
    fecha_medicion: new Date().toISOString().split('T')[0],
    temperatura: '',
    humedad: '',
    observaciones: ''
  });

  const handleSubmitEstacion = async (e) => {
    e.preventDefault();
    
    try {
      await createEstacion.mutateAsync({
        ...formDataEstacion,
        proyecto_id: proyectoSeleccionado,
        coordenada_x: parseFloat(formDataEstacion.coordenada_x),
        coordenada_y: parseFloat(formDataEstacion.coordenada_y),
        elevacion: parseFloat(formDataEstacion.elevacion)
      });
      
      setFormDataEstacion({
        nombre: '',
        coordenada_x: '',
        coordenada_y: '',
        elevacion: '',
        descripcion: ''
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear estación:', error);
    }
  };

  const handleSubmitMedicion = async (e) => {
    e.preventDefault();
    
    try {
      await createMedicion.mutateAsync({
        ...formDataMedicion,
        proyecto_id: proyectoSeleccionado,
        temperatura: parseFloat(formDataMedicion.temperatura),
        humedad: parseFloat(formDataMedicion.humedad)
      });
      
      setFormDataMedicion({
        estacion_id: '',
        fecha_medicion: new Date().toISOString().split('T')[0],
        temperatura: '',
        humedad: '',
        observaciones: ''
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear medición:', error);
    }
  };

  const renderEstaciones = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Estaciones de Campo</h3>
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setVistaActiva('nueva-estacion');
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Nueva Estación
        </button>
      </div>

      {loadingEstaciones ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
          ))}
        </div>
      ) : estaciones && estaciones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estaciones.map((estacion) => (
            <div
              key={estacion.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900">{estacion.nombre}</h4>
                <span className="text-xs text-gray-500">
                  Est. {estacion.id}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">X:</span> {formatNumber(estacion.coordenada_x, 3)}
                  </div>
                  <div>
                    <span className="font-medium">Y:</span> {formatNumber(estacion.coordenada_y, 3)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Elevación:</span> {formatNumber(estacion.elevacion, 3)} m
                </div>
                {estacion.descripcion && (
                  <p className="text-xs text-gray-500 mt-2">{estacion.descripcion}</p>
                )}
              </div>
              
              <div className="mt-3 flex gap-2">
                <button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  Ver Lecturas
                </button>
                <button className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                  Nueva Medición
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No hay estaciones registradas</p>
        </div>
      )}
    </div>
  );

  const renderMediciones = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Mediciones Recientes</h3>
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setVistaActiva('nueva-medicion');
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Nueva Medición
        </button>
      </div>

      {loadingMediciones ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
          ))}
        </div>
      ) : mediciones && mediciones.length > 0 ? (
        <div className="space-y-3">
          {mediciones.map((medicion) => (
            <div
              key={medicion.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Medición #{medicion.id}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Fecha: {formatDate(medicion.fecha_medicion)}
                  </p>
                </div>
                
                <div className="text-right text-sm text-gray-500">
                  <div>T: {medicion.temperatura}°C</div>
                  <div>H: {medicion.humedad}%</div>
                </div>
              </div>
              
              {medicion.observaciones && (
                <p className="text-sm text-gray-600 mt-2">{medicion.observaciones}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No hay mediciones registradas</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trabajo de Campo</h1>
        <p className="text-gray-600 mt-1">
          Gestión de actividades y registros realizados en campo
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Estaciones', 
            valor: estaciones?.length || 0, 
            color: 'blue',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            )
          },
          { 
            label: 'Mediciones', 
            valor: mediciones?.length || 0, 
            color: 'green',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            )
          },
          { 
            label: 'Hoy', 
            valor: mediciones?.filter(m => 
              new Date(m.fecha_medicion).toDateString() === new Date().toDateString()
            ).length || 0, 
            color: 'yellow',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            )
          },
          { 
            label: 'Esta Semana', 
            valor: mediciones?.filter(m => {
              const medicionDate = new Date(m.fecha_medicion);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return medicionDate >= weekAgo;
            }).length || 0, 
            color: 'purple',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )
          }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-md bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">{stat.label}</dt>
                <dd className={`text-2xl font-semibold text-${stat.color}-600`}>
                  {stat.valor}
                </dd>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'estaciones', label: 'Estaciones', icon: '🎯' },
            { id: 'mediciones', label: 'Mediciones', icon: '📏' },
            { id: 'lecturas', label: 'Lecturas', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActiva(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                vistaActiva === tab.id
                  ? 'border-green-500 text-green-600'
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {vistaActiva === 'estaciones' && renderEstaciones()}
        {vistaActiva === 'mediciones' && renderMediciones()}
        {vistaActiva === 'lecturas' && (
          <div className="text-center py-8">
            <p className="text-gray-500">Vista de lecturas en desarrollo...</p>
          </div>
        )}
      </div>

      {/* Modal para formularios */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {vistaActiva === 'nueva-estacion' ? 'Nueva Estación' : 'Nueva Medición'}
              </h3>
            </div>
            
            {vistaActiva === 'nueva-estacion' ? (
              <form onSubmit={handleSubmitEstacion} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formDataEstacion.nombre}
                    onChange={(e) => setFormDataEstacion({...formDataEstacion, nombre: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Coordenada X</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={formDataEstacion.coordenada_x}
                      onChange={(e) => setFormDataEstacion({...formDataEstacion, coordenada_x: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Coordenada Y</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={formDataEstacion.coordenada_y}
                      onChange={(e) => setFormDataEstacion({...formDataEstacion, coordenada_y: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Elevación (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formDataEstacion.elevacion}
                    onChange={(e) => setFormDataEstacion({...formDataEstacion, elevacion: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={formDataEstacion.descripcion}
                    onChange={(e) => setFormDataEstacion({...formDataEstacion, descripcion: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createEstacion.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                  >
                    {createEstacion.isLoading ? 'Creando...' : 'Crear Estación'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitMedicion} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estación</label>
                  <select
                    required
                    value={formDataMedicion.estacion_id}
                    onChange={(e) => setFormDataMedicion({...formDataMedicion, estacion_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar estación</option>
                    {estaciones?.map((estacion) => (
                      <option key={estacion.id} value={estacion.id}>
                        {estacion.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formDataMedicion.fecha_medicion}
                    onChange={(e) => setFormDataMedicion({...formDataMedicion, fecha_medicion: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formDataMedicion.temperatura}
                      onChange={(e) => setFormDataMedicion({...formDataMedicion, temperatura: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Humedad (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formDataMedicion.humedad}
                      onChange={(e) => setFormDataMedicion({...formDataMedicion, humedad: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    value={formDataMedicion.observaciones}
                    onChange={(e) => setFormDataMedicion({...formDataMedicion, observaciones: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMedicion.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                  >
                    {createMedicion.isLoading ? 'Creando...' : 'Crear Medición'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Campo;
