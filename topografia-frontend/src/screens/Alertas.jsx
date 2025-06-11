import React, { useState, useMemo } from 'react';
import { useProyectos, useMediciones, useLecturas } from '../hooks';
import { formatDate, formatTime } from '../utils/formatters';

const Alertas = () => {
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Hooks para obtener datos
  const { data: proyectos } = useProyectos();
  const { data: mediciones } = useMediciones();
  const { data: lecturas } = useLecturas();

  // Generar alertas basadas en los datos
  const alertas = useMemo(() => {
    const alertasGeneradas = [];

    // Alertas de calidad de datos
    if (lecturas) {
      const lecturasMalasCalidad = lecturas.filter(l => l.calidad === 'malo');
      if (lecturasMalasCalidad.length > 0) {
        alertasGeneradas.push({
          id: 'calidad-datos',
          tipo: 'calidad',
          severidad: 'alta',
          titulo: 'Datos de baja calidad detectados',
          descripcion: `${lecturasMalasCalidad.length} lecturas con calidad deficiente requieren revisión`,
          fecha: new Date(),
          estado: 'activa',
          accion: 'Revisar lecturas',
          proyecto: 'Multiple'
        });
      }

      // Alertas de precisión
      const lecturasImprecisas = lecturas.filter(l => l.precision && l.precision > 0.05);
      if (lecturasImprecisas.length > 0) {
        alertasGeneradas.push({
          id: 'precision-baja',
          tipo: 'precision',
          severidad: 'media',
          titulo: 'Precisión por debajo del estándar',
          descripcion: `${lecturasImprecisas.length} lecturas con precisión > 5cm`,
          fecha: new Date(),
          estado: 'activa',
          accion: 'Verificar equipos',
          proyecto: 'Multiple'
        });
      }
    }

    // Alertas de proyecto
    if (proyectos) {
      const proyectosSinActividad = proyectos.filter(p => {
        const fechaCreacion = new Date(p.fecha_creacion);
        const diasSinActividad = (Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
        return diasSinActividad > 30 && p.estado === 'activo';
      });

      proyectosSinActividad.forEach(proyecto => {
        alertasGeneradas.push({
          id: `proyecto-inactivo-${proyecto.id}`,
          tipo: 'proyecto',
          severidad: 'baja',
          titulo: 'Proyecto sin actividad reciente',
          descripcion: `El proyecto "${proyecto.nombre}" no ha tenido actividad en más de 30 días`,
          fecha: new Date(),
          estado: 'activa',
          accion: 'Revisar estado',
          proyecto: proyecto.nombre
        });
      });
    }

    // Alertas de sistema simuladas
    alertasGeneradas.push(
      {
        id: 'calibracion-pendiente',
        tipo: 'mantenimiento',
        severidad: 'media',
        titulo: 'Calibración de equipos pendiente',
        descripcion: 'Es recomendable calibrar los equipos de medición cada 6 meses',
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
        estado: 'activa',
        accion: 'Programar calibración',
        proyecto: 'Sistema'
      },
      {
        id: 'backup-completado',
        tipo: 'sistema',
        severidad: 'baja',
        titulo: 'Respaldo automático completado',
        descripcion: 'El respaldo automático de datos se completó exitosamente',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estado: 'resuelta',
        accion: 'Ver detalles',
        proyecto: 'Sistema'
      },
      {
        id: 'actualizacion-disponible',
        tipo: 'sistema',
        severidad: 'baja',
        titulo: 'Actualización de software disponible',
        descripcion: 'Hay una nueva versión del software con mejoras de rendimiento',
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estado: 'pendiente',
        accion: 'Actualizar',
        proyecto: 'Sistema'
      }
    );

    return alertasGeneradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [proyectos, mediciones, lecturas]);

  // Filtrar alertas
  const alertasFiltradas = useMemo(() => {
    return alertas.filter(alerta => {
      const cumpleTipo = filtroTipo === 'todas' || alerta.tipo === filtroTipo;
      const cumpleEstado = filtroEstado === 'todas' || alerta.estado === filtroEstado;
      return cumpleTipo && cumpleEstado;
    });
  }, [alertas, filtroTipo, filtroEstado]);

  const getSeveridadColor = (severidad) => {
    const colores = {
      alta: 'bg-red-100 text-red-800 border-red-200',
      media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      baja: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colores[severidad] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeveridadIcon = (severidad) => {
    const iconos = {
      alta: '🚨',
      media: '⚠️',
      baja: 'ℹ️'
    };
    return iconos[severidad] || 'ℹ️';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      activa: 'bg-red-100 text-red-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      resuelta: 'bg-green-100 text-green-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const estadisticasAlertas = useMemo(() => {
    return {
      total: alertas.length,
      activas: alertas.filter(a => a.estado === 'activa').length,
      alta_severidad: alertas.filter(a => a.severidad === 'alta').length,
      pendientes: alertas.filter(a => a.estado === 'pendiente').length
    };
  }, [alertas]);

  const handleMarcarComoResuelta = (alertaId) => {
    // En una implementación real, esto haría una llamada a la API
    console.log(`Marcando alerta ${alertaId} como resuelta`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas</h1>
        <p className="text-gray-600 mt-1">
          Monitorea alertas del sistema, calidad de datos y estado de proyectos
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total de Alertas', 
            valor: estadisticasAlertas.total, 
            color: 'blue',
            icon: '📋'
          },
          { 
            label: 'Alertas Activas', 
            valor: estadisticasAlertas.activas, 
            color: 'red',
            icon: '🚨'
          },
          { 
            label: 'Alta Prioridad', 
            valor: estadisticasAlertas.alta_severidad, 
            color: 'orange',
            icon: '⚠️'
          },
          { 
            label: 'Pendientes', 
            valor: estadisticasAlertas.pendientes, 
            color: 'yellow',
            icon: '⏳'
          }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-md bg-${stat.color}-100 text-${stat.color}-600`}>
                <span className="text-xl">{stat.icon}</span>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="calidad">Calidad</option>
              <option value="precision">Precisión</option>
              <option value="proyecto">Proyecto</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="activa">Activas</option>
              <option value="pendiente">Pendientes</option>
              <option value="resuelta">Resueltas</option>
            </select>
          </div>
          
          <div className="ml-auto">
            <span className="text-sm text-gray-600">
              Mostrando {alertasFiltradas.length} de {alertas.length} alertas
            </span>
          </div>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {alertasFiltradas.length > 0 ? (
          alertasFiltradas.map((alerta) => (
            <div
              key={alerta.id}
              className={`bg-white rounded-lg border-l-4 border shadow-sm hover:shadow-md transition-shadow ${
                alerta.severidad === 'alta' ? 'border-l-red-500' :
                alerta.severidad === 'media' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{getSeveridadIcon(alerta.severidad)}</span>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alerta.titulo}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeveridadColor(alerta.severidad)}`}>
                          {alerta.severidad.charAt(0).toUpperCase() + alerta.severidad.slice(1)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(alerta.estado)}`}>
                          {alerta.estado.charAt(0).toUpperCase() + alerta.estado.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{alerta.descripcion}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(alerta.fecha)} {formatTime(alerta.fecha)}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {alerta.proyecto}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarcarComoResuelta(alerta.id)}
                      disabled={alerta.estado === 'resuelta'}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {alerta.accion}
                    </button>
                    
                    {alerta.estado !== 'resuelta' && (
                      <button
                        onClick={() => handleMarcarComoResuelta(alerta.id)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Marcar como resuelta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay alertas que mostrar
            </h3>
            <p className="text-gray-600">
              {filtroTipo !== 'todas' || filtroEstado !== 'todas'
                ? 'No se encontraron alertas con los filtros aplicados.'
                : 'Todo está funcionando correctamente. No hay alertas activas.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
