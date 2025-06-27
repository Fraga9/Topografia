import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../hooks/auth';
import { useProyectoSeleccionado } from '../context/ProyectoContext';
import { useEstaciones } from '../hooks/estaciones/useEstaciones';
import { useMediciones } from '../hooks/mediciones/useMediciones';
import { useLecturas } from '../hooks/lecturas/useLecturas';
import { formatNumber } from '../utils/formatters';
import { 
  Menu, 
  X, 
  Home, 
  FolderPlus, 
  LogOut,
  User,
  AlertCircle,
  FileBarChart2,
  Map,
  SlidersHorizontal,
  FileText,
  Activity,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar el context del proyecto
  const { proyectoSeleccionado, limpiarProyecto } = useProyectoSeleccionado();
  
  // Hooks para datos del proyecto activo - SIEMPRE ejecutar para mantener orden
  const { data: estaciones = [] } = useEstaciones(proyectoSeleccionado?.id, { enabled: !!proyectoSeleccionado?.id });
  const { data: mediciones = [] } = useMediciones({ proyecto_id: proyectoSeleccionado?.id, enabled: !!proyectoSeleccionado?.id });
  
  // Crear array fijo para mantener orden de hooks
  const medicionesSeguras = Array.isArray(mediciones) ? mediciones : [];
  
  // Obtener todas las lecturas para calcular alertas - SIEMPRE ejecutar con array fijo
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
  
  // Consolidar todas las lecturas y calcular alertas
  const todasLasLecturas = useMemo(() => {
    return lecturasQueries
      .slice(0, medicionesSeguras.length) // Solo usar las queries que corresponden a mediciones reales
      .map(query => query?.data || [])
      .flat()
      .filter(lectura => lectura && lectura.elv_base_real !== null);
  }, [lecturasQueries, medicionesSeguras.length]);
  
  // Calcular alertas dinámicamente
  const alertasInfo = useMemo(() => {
    if (!proyectoSeleccionado || todasLasLecturas.length === 0) {
      return { total: 0, criticas: 0, advertencias: 0 };
    }
    
    let alertasGeneradas = [];
    
    // Analizar cada lectura para generar alertas
    todasLasLecturas.forEach(lectura => {
      const diferencia = Math.abs(lectura.elv_base_real - lectura.elv_base_proyecto);
      
      // Alertas por tolerancia SCT
      if (diferencia > proyectoSeleccionado.tolerancia_sct) {
        let severidad = 'advertencia';
        if (diferencia > proyectoSeleccionado.tolerancia_sct * 3) {
          severidad = 'critica';
        }
        alertasGeneradas.push({ severidad, tipo: 'tolerancia' });
      }
      
      // Alertas por calidad
      if (lectura.calidad === 'REVISAR') {
        alertasGeneradas.push({ severidad: 'critica', tipo: 'calidad' });
      } else if (lectura.calidad === 'REGULAR') {
        alertasGeneradas.push({ severidad: 'advertencia', tipo: 'calidad' });
      }
    });
    
    // Verificar mediciones sin lecturas
    medicionesSeguras.forEach((medicion, index) => {
      const lecturasEstacion = lecturasQueries[index]?.data || [];
      if (lecturasEstacion.length === 0) {
        alertasGeneradas.push({ severidad: 'critica', tipo: 'sin_lecturas' });
      }
    });
    
    return {
      total: alertasGeneradas.length,
      criticas: alertasGeneradas.filter(a => a.severidad === 'critica').length,
      advertencias: alertasGeneradas.filter(a => a.severidad === 'advertencia').length
    };
  }, [proyectoSeleccionado, todasLasLecturas, medicionesSeguras, lecturasQueries]);
  
  // Calcular información contextual del proyecto
  const proyectoInfo = useMemo(() => {
    if (!proyectoSeleccionado || !estaciones.length) {
      return null;
    }
    
    const totalEstacionesReales = estaciones.length; // Usar estaciones reales como las otras pantallas
    const estacionesMedidas = new Set(medicionesSeguras.map(m => m.estacion_km)).size;
    const progresoPorcentaje = (estacionesMedidas / totalEstacionesReales) * 100;
    
    // Calcular tolerancia SCT
    const lecturasConTolerancia = todasLasLecturas.filter(l => 
      l.elv_base_real !== null && l.elv_base_proyecto !== null
    );
    const dentroToleranciaSCT = lecturasConTolerancia.filter(l => 
      Math.abs(l.elv_base_real - l.elv_base_proyecto) <= proyectoSeleccionado.tolerancia_sct
    ).length;
    const porcentajeTolerancia = lecturasConTolerancia.length > 0 
      ? (dentroToleranciaSCT / lecturasConTolerancia.length) * 100 
      : 0;
    
    // Calcular calidad general
    const lecturasExcelentes = todasLasLecturas.filter(l => l.calidad === 'EXCELENTE').length;
    const lecturasBuenas = todasLasLecturas.filter(l => l.calidad === 'BUENA').length;
    const calidadGeneral = todasLasLecturas.length > 0 
      ? ((lecturasExcelentes + lecturasBuenas) / todasLasLecturas.length) * 100 
      : 0;
    
    return {
      progresoPorcentaje,
      estacionesMedidas,
      totalEstacionesReales,
      porcentajeTolerancia,
      calidadGeneral,
      totalLecturas: todasLasLecturas.length
    };
  }, [proyectoSeleccionado, estaciones, medicionesSeguras, todasLasLecturas]);

  const menuItems = [
    { id: "proyectos", name: "Proyectos", icon: FolderPlus, href: '/proyectos' },
    { id: "dashboard", name: "Dashboard", icon: Home, href: '/', requiresProject: true },
    { id: "diseño", name: "Datos Diseño", icon: FileText, href: '/datos-diseno', requiresProject: true },
    { id: "campo", name: "Campo", icon: Map, href: '/campo', requiresProject: true },
    { id: "configuracion", name: "Configuración", icon: SlidersHorizontal, href: '/configuracion', requiresProject: true },
    { id: "alertas", name: "Alertas", icon: AlertCircle, href: '/alertas', requiresProject: true },
    { id: "analisis", name: "Análisis", icon: FileBarChart2, href: '/analisis', requiresProject: true },
    { id: "reportes", name: "Reportes", icon: FileText, href: '/reportes', requiresProject: true },
  ];

  const handleLogout = () => {
    logout.mutate();
  };

  const handleCambiarProyecto = () => {
    // Navegar a la página de proyectos
    navigate('/proyectos');
  };

  const isCurrentPage = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-50 flex relative overflow-hidden">
      {/* Mobile/Tablet Overlay con Glass Blur */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 md:hidden backdrop-blur-sm bg-black/20" 
          onClick={toggleSidebar}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        />
      )}

      {/* Sidebar - Optimizado para tablets */}
      <div
        className={`${
          sidebarCollapsed ? "w-0 md:w-16" : "w-64 md:w-72"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-50 h-screen overflow-hidden ${
          sidebarCollapsed ? "fixed md:relative -translate-x-full md:translate-x-0" : "fixed md:relative translate-x-0"
        }`}
      >
        {/* Toggle Button - Siempre visible en tablets */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-10 top-4 md:hidden bg-white border border-gray-200 rounded-full p-2 shadow-lg z-50"
          aria-label={sidebarCollapsed ? "Abrir menú" : "Cerrar menú"}
        >
          {sidebarCollapsed ? <Menu className="w-5 h-5 text-gray-700" /> : <X className="w-5 h-5 text-gray-700" />}
        </button>

        {/* Header - Logo CEMEX cuando expandido, solo toggle cuando colapsado */}
        <div className="p-3 md:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Logo CEMEX Real */}
              <div className="flex flex-col items-start w-full">
                <img 
                  src="/CemexLogo.webp" 
                  alt="CEMEX Logo" 
                  className="w-24 md:w-28 h-6 md:h-8 rounded-lg bg-white object-contain" 
                />
                <p className="text-xs text-gray-500 mt-1">Sistema de topografía avanzado</p>
              </div>
            </div>
          )}

          {/* Cuando está colapsado, solo mostrar el botón toggle */}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              {/* Espacio vacío - no mostramos logo cuando está colapsado */}
            </div>
          )}

          {/* Toggle Button for Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden md:block p-1 rounded hover:bg-gray-100 flex-shrink-0"
            aria-label={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Project Info Expandida - Optimizado para tablets */}
        {proyectoSeleccionado && !sidebarCollapsed && (
          <div className="border-b border-gray-200 flex-shrink-0">
            {/* Header del proyecto */}
            <div className="p-3 md:p-4 bg-gray-50">
              <div className="flex items-start justify-between min-w-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">Proyecto Activo</h3>
                  <p className="text-xs text-gray-600 mt-1 truncate">{proyectoSeleccionado.nombre}</p>
                  <p className="text-xs text-gray-600 truncate">
                    KM {Math.floor(proyectoSeleccionado.km_inicial/1000)}+{String(proyectoSeleccionado.km_inicial%1000).padStart(3,'0')} - {Math.floor(proyectoSeleccionado.km_final/1000)}+{String(proyectoSeleccionado.km_final%1000).padStart(3,'0')}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {proyectoSeleccionado.tramo}, Cuerpo {proyectoSeleccionado.cuerpo}
                  </p>
                </div>
                <button
                  onClick={handleCambiarProyecto}
                  className="text-xs text-[#0404b8] hover:text-blue-800 underline flex-shrink-0 ml-2"
                >
                  Cambiar
                </button>
              </div>
            </div>
            
            {/* Información contextual del proyecto */}
            {proyectoInfo && (
              <div className="p-3 md:p-4 bg-white space-y-3">
                {/* Progreso del proyecto */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Progreso
                    </span>
                    <span className="text-xs text-gray-600">
                      {proyectoInfo.estacionesMedidas}/{proyectoInfo.totalEstacionesReales}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(proyectoInfo.progresoPorcentaje, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">
                    {formatNumber(proyectoInfo.progresoPorcentaje, 1)}% completado
                  </span>
                </div>
                
                {/* Indicadores de calidad */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span className="text-green-800 font-medium">Tolerancia SCT</span>
                    </div>
                    <div className="text-green-600 font-bold">
                      {formatNumber(proyectoInfo.porcentajeTolerancia, 1)}%
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-800 font-medium">Calidad</span>
                    </div>
                    <div className="text-blue-600 font-bold">
                      {formatNumber(proyectoInfo.calidadGeneral, 1)}%
                    </div>
                  </div>
                </div>
                
                {/* Resumen de lecturas */}
                <div className="text-xs text-gray-600 text-center pt-1 border-t border-gray-100">
                  {formatNumber(proyectoInfo.totalLecturas, 0)} lecturas procesadas
                </div>
              </div>
            )}
          </div>
        )}

        {proyectoSeleccionado && sidebarCollapsed && (
          <div className="p-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="w-8 h-8 bg-[#0404b8] rounded flex items-center justify-center mx-auto relative">
              <span className="text-xs font-bold text-white">P</span>
              {/* Indicador de progreso en modo colapsado */}
              {proyectoInfo && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white">
                  <div 
                    className={`w-full h-full rounded-full ${
                      proyectoInfo.progresoPorcentaje >= 80 ? 'bg-green-500' :
                      proyectoInfo.progresoPorcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}

        {!proyectoSeleccionado && !sidebarCollapsed && (
          <div className="p-3 md:p-4 bg-yellow-50 border-b border-gray-200 flex-shrink-0">
            <p className="text-sm text-yellow-800">Selecciona un proyecto para continuar</p>
          </div>
        )}

        {!proyectoSeleccionado && sidebarCollapsed && (
          <div className="p-2 bg-yellow-50 border-b border-gray-200 flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-white">!</span>
            </div>
          </div>
        )}

        {/* Navigation - Optimizado para tablets */}
        <nav className="flex-1 p-2 overflow-hidden">
          <ul className="space-y-1 h-full flex flex-col">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isCurrentPage(item.href);
              const isDisabled = item.requiresProject && !proyectoSeleccionado;

              return (
                <li key={item.id} className="flex-shrink-0">
                  {isDisabled ? (
                    <div
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                      } py-2.5 rounded-lg text-gray-400 cursor-not-allowed relative`}
                      title={sidebarCollapsed ? `${item.name} (Requiere proyecto)` : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                      } py-2.5 rounded-lg text-left transition-colors relative ${
                        isActive
                          ? "bg-[#0404b8] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setSidebarCollapsed(true);
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          {item.id === "alertas" && proyectoSeleccionado && alertasInfo.total > 0 && (
                            <span className={`ml-auto text-white text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              alertasInfo.criticas > 0 ? 'bg-red-500' : 'bg-yellow-500'
                            }`}>
                              {alertasInfo.total}
                            </span>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && item.id === "alertas" && proyectoSeleccionado && alertasInfo.total > 0 && (
                        <span className={`absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ${
                          alertasInfo.criticas > 0 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {alertasInfo.total > 99 ? '99+' : alertasInfo.total}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info - Optimizado para tablets */}
        {!sidebarCollapsed && (
          <div className="p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-xs text-gray-600 truncate">Conectado</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="p-2 border-t border-gray-200 flex-shrink-0">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-700" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden h-screen">
        {/* Top bar for mobile */}
        <div className="md:hidden bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo CEMEX en mobile */}
            <div className="flex items-center">
              <img 
                src="/CemexLogo.webp" 
                alt="CEMEX Logo" 
                className="w-20 h-6 object-contain" 
              />
            </div>
            
            <div className="w-10 h-10"></div>
          </div>
          
          {/* Mobile Project Info Expandida */}
          {proyectoSeleccionado && (
            <div className="bg-blue-50 border-b border-blue-200">
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">{proyectoSeleccionado.nombre}</p>
                    <p className="text-xs text-blue-600 truncate">
                      {proyectoSeleccionado.tramo}, Cuerpo {proyectoSeleccionado.cuerpo}
                    </p>
                  </div>
                  <button
                    onClick={handleCambiarProyecto}
                    className="text-xs text-blue-600 hover:text-blue-800 underline flex-shrink-0 ml-2 p-1"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
              
              {/* Indicadores móviles */}
              {proyectoInfo && (
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-blue-700 font-medium">
                      Progreso: {formatNumber(proyectoInfo.progresoPorcentaje, 1)}%
                    </span>
                    <div className="flex gap-3">
                      {alertasInfo.total > 0 && (
                        <span className={`px-2 py-1 rounded-full text-white text-xs ${
                          alertasInfo.criticas > 0 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {alertasInfo.total} alertas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(proyectoInfo.progresoPorcentaje, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-4 md:py-6 h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;