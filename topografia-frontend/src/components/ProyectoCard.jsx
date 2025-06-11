import React from 'react';
import {
  Construction, // MapPin, AlertCircle, Clock, ChevronRight, Zap removed as they are no longer used directly or conditionally
  TrendingUp, // Kept for the header icon, though status icons are removed
  CheckCircle2 // Kept for potential future use, though status icons are removed
} from 'lucide-react';

const ProyectoCard = ({
  proyecto,
  esSeleccionado,
  onSeleccionar,
  onEliminar // onEliminar is passed but not used in this component's JSX
}) => {
  // Datos desde la vista mis_proyectos
  const {
    nombre,
    tramo,
    cuerpo,
    km_inicial,
    km_final,
    estado,
    estaciones_configuradas,
    estaciones_medidas,
    // total_lecturas, // Not directly used in the simplified display
  } = proyecto;

  // Calcular métricas esenciales
  const progreso = estaciones_configuradas > 0
    ? Math.round((estaciones_medidas / estaciones_configuradas) * 100)
    : 0;

  const longitudProyecto = km_final - km_inicial;

  // Formatear kilometraje
  const formatearKM = (km) => {
    if (!km) return 'N/A';
    const kmNumero = typeof km === 'string' ? parseFloat(km) : km;
    return `${Math.floor(kmNumero/1000)}+${String(kmNumero%1000).padStart(3,'0')}`;
  };

  // Estado visual - icons removed
  const getEstadoConfig = (isSelected) => {
    switch (estado) {
      case "EN_PROGRESO":
        return {
          bgClass: isSelected ? "bg-blue-100/80 backdrop-blur-sm" : "bg-blue-50 border border-blue-200",
          textClass: "text-blue-700",
          icon: null, // Icon removed
          label: "En Progreso"
        };
      case "COMPLETADO":
        return {
          bgClass: isSelected ? "bg-emerald-100/80 backdrop-blur-sm" : "bg-emerald-50 border border-emerald-200",
          textClass: "text-emerald-700",
          icon: null, // Icon removed
          label: "Completado"
        };
      case "PAUSADO":
        return {
          bgClass: isSelected ? "bg-amber-100/80 backdrop-blur-sm" : "bg-amber-50 border border-amber-200",
          textClass: "text-amber-700",
          icon: null, // Icon removed
          label: "Pausado"
        };
      default: // CONFIGURACIÓN
        if (isSelected) {
          return {
            bgClass: "backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg",
            textClass: "text-blue-100",
            icon: null, // Icon removed
            label: "Configuración"
          };
        } else { // Inactive (white card)
          return {
            bgClass: "bg-slate-100 border border-slate-200",
            textClass: "text-slate-700",
            icon: null, // Icon removed
            label: "Configuración"
          };
        }
    }
  };

  const estadoConfig = getEstadoConfig(esSeleccionado);

  return (
    <div
      className={`
        relative rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.015] hover:-translate-y-1
        ${esSeleccionado
          ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white border border-blue-500/30 ring-2 ring-blue-400'
          : 'bg-white text-slate-800 border border-slate-200 hover:shadow-2xl'
        }
      `}
    >
      {/* Header y estado */}
      <div className="flex items-center justify-between mb-6 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className={`
            rounded-xl p-3
            ${esSeleccionado ? 'bg-white/20 backdrop-blur-sm' : 'bg-slate-100 border border-slate-200'}
          `}
        >
          <TrendingUp className={`w-7 h-7 ${esSeleccionado ? 'text-white' : 'text-blue-600'}`} />
        </div>
        <div
          className={`
            flex items-center px-3 py-1 rounded-full
            ${estadoConfig.bgClass}
          `}
        >
          {/* Icon removed from here */}
          <span className={`text-xs font-semibold ${estadoConfig.textClass}`}>{estadoConfig.label}</span>
        </div>
      </div>

      {/* Título y tramo */}
      <div className="px-5 sm:px-6">
        <h3 className={`text-xl sm:text-2xl font-bold mb-1 truncate ${esSeleccionado ? 'text-white' : 'text-slate-900'}`}>{nombre}</h3>
        <p className={`
            text-sm flex items-center mb-2
            ${esSeleccionado ? 'text-blue-100' : 'text-slate-600'}
          `}
        >
          <Construction className="w-4 h-4 mr-1.5" />
          {tramo} • Cuerpo {cuerpo}
        </p>
      </div>

      {/* Progreso y datos principales */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between my-4">
          <div className="mb-2 md:mb-0">
            <p className={`text-sm ${esSeleccionado ? 'text-blue-100' : 'text-slate-700 font-medium'}`}>
              KM {formatearKM(km_inicial)} - {formatearKM(km_final)}
            </p>
            <p className={`text-xs ${esSeleccionado ? 'text-blue-100' : 'text-slate-500'}`}>
              Longitud: {longitudProyecto.toLocaleString()}m
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className={`text-3xl sm:text-4xl font-bold mb-0.5 ${esSeleccionado ? 'text-white' : 'text-blue-600'}`}>{progreso}%</div>
            <div className={`text-xs sm:text-sm ${esSeleccionado ? 'text-blue-100' : 'text-slate-500'}`}>
              Completado
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`text-xs sm:text-sm ${esSeleccionado ? 'text-blue-100' : 'text-slate-600'}`}>
              Mediciones registradas
            </span>
            <span className={`text-xs sm:text-sm font-semibold ${esSeleccionado ? 'text-white' : 'text-slate-700'}`}>
              {estaciones_medidas || 0} / {estaciones_configuradas || 0}
            </span>
          </div>
          <div className={`w-full rounded-full h-2.5 sm:h-3 ${esSeleccionado ? 'bg-white/25' : 'bg-slate-200'}`}>
            <div
              className={`
                h-full rounded-full transition-all duration-1000 ease-out
                ${esSeleccionado ? 'bg-gradient-to-r from-white/90 to-blue-100/90 shadow-sm' : 'bg-gradient-to-r from-blue-500 to-blue-700'}
              `}
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
          <div className={`
              grid grid-cols-2 gap-3 pt-3 mt-3 border-t
              ${esSeleccionado ? 'border-white/25' : 'border-slate-200'}
            `}
          >
            <div className="text-center">
              <div className={`text-xl sm:text-2xl font-bold ${esSeleccionado ? 'text-white' : 'text-blue-600'}`}>{estaciones_medidas || 0}</div>
              <div className={`text-xs ${esSeleccionado ? 'text-blue-100' : 'text-slate-500'}`}>
                Completadas
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xl sm:text-2xl font-bold ${esSeleccionado ? 'text-white' : 'text-blue-600'}`}>{estaciones_configuradas || 0}</div>
              <div className={`text-xs ${esSeleccionado ? 'text-blue-100' : 'text-slate-500'}`}>
                Configuradas
              </div>
            </div>
          </div>
        </div>

        {/* Acción */}
        <button
          onClick={() => onSeleccionar(proyecto)}
          className={`
            w-full mt-6 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300
            flex items-center justify-center
            ${esSeleccionado
              ? 'bg-white/25 text-white hover:bg-white/35 backdrop-blur-sm'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }
          `}
        >
          {/* Icons removed */}
          <span>{esSeleccionado ? 'Proyecto Activo' : 'Activar Proyecto'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProyectoCard;