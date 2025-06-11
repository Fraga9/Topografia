import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../hooks/auth';
import { useProyectoSeleccionado } from '../context/ProyectoContext';
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
  FileText
} from 'lucide-react';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar el context del proyecto
  const { proyectoSeleccionado, limpiarProyecto } = useProyectoSeleccionado();

  const menuItems = [
    { id: "proyectos", name: "Proyectos", icon: FolderPlus, href: '/proyectos' },
    { id: "dashboard", name: "Dashboard", icon: Home, href: '/', requiresProject: true },
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
      {/* Mobile/Tablet Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar} />
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

        {/* Project Info - Optimizado para tablets */}
        {proyectoSeleccionado && !sidebarCollapsed && (
          <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
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
        )}

        {proyectoSeleccionado && sidebarCollapsed && (
          <div className="p-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="w-8 h-8 bg-[#0404b8] rounded flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-white">P</span>
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
                          {item.id === "alertas" && proyectoSeleccionado && (
                            <span className="ml-auto bg-[#f62631] text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                              14
                            </span>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && item.id === "alertas" && proyectoSeleccionado && (
                        <span className="absolute -top-1 -right-1 bg-[#f62631] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          14
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
          
          {/* Mobile Project Info */}
          {proyectoSeleccionado && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
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