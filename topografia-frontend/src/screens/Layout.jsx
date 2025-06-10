import { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  FolderPlus, 
  Calculator, 
  BarChart3, 
  Settings, 
  LogOut,
  Building2,
  User,
  ChevronRight,
  AlertCircle,
  FileBarChart2,
  Map,
  SlidersHorizontal,
  ClipboardList,
  FileText
} from 'lucide-react';

const Layout = ({ children, user, onLogout, currentPage = 'dashboard', setCurrentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'proyectos', name: 'Proyectos', icon: FolderPlus, href: '/proyectos' },
    { id: 'dashboard', name: 'Dashboard', icon: Home, href: '/' },
    { id: 'configuracion', name: 'Configuración', icon: SlidersHorizontal, href: '/configuracion' },
    { id: 'datosdiseno', name: 'Datos de Diseño', icon: ClipboardList, href: '/datosdiseno' },
    { id: 'campo', name: 'Campo', icon: Map, href: '/campo' },
    { id: 'alertas', name: 'Alertas', icon: AlertCircle, href: '/alertas' },
    { id: 'analisis', name: 'Análisis', icon: FileBarChart2, href: '/analisis' },
    { id: 'reportes', name: 'Reportes', icon: FileText, href: '/reportes' },
  ];

  const NavLink = ({ item, mobile = false }) => (
    <button
      type="button"
      className={`nav-link ${currentPage === item.id ? 'active' : ''} ${
        mobile ? 'px-4 py-3' : 'px-3 py-2'
      }`}
      onClick={() => {
        setCurrentPage(item.id);
        if (mobile) setSidebarOpen(false);
      }}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.name}
      {currentPage === item.id && (
        <ChevronRight className="w-4 h-4 ml-auto" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex flex-col items-start w-full">
                <img src="/CemexLogo.webp" alt="CEMEX Logo" className="w-28 h-8 rounded-lg bg-white object-contain" />
                <p className="text-xs text-gray-500 mt-1">Sistema de topografía avanzado</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.id} item={item} />
              ))}
            </nav>

            {/* User section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3">
                  <User className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nombre || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    ID: {user?.cemexId || 'TOP001'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay and sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-white/10 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-40"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
              {/* Mobile Logo */}
              <div className="flex items-center flex-shrink-0 px-4 mb-8 w-full">
                <div className="flex flex-col items-start w-full">
                  <img src="/CemexLogo.webp" alt="CEMEX Logo" className="w-28 h-8 rounded-lg bg-white object-contain" />
                  <p className="text-xs text-gray-500 mt-1">Sistema de topografía avanzado</p>
                </div>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink key={item.id} item={item} mobile />
                ))}
              </nav>
              
              {/* Mobile User section */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center w-full">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.nombre || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.empresa || 'CEMEX'}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 relative z-30">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4 md:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900 capitalize">
                    {navigation.find(item => item.id === currentPage)?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>
              
              {/* Desktop user menu */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombre || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.cemexId || 'TOP001'} • {user?.rol || 'Topógrafo'}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || (
                <div className="space-y-6">
                  {/* Demo content */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Contenido del Dashboard</h2>
                    <p className="text-gray-600">
                      Este es el contenido principal de la aplicación. Ahora el menú hamburguesa 
                      funciona de manera más profesional con un overlay suave y animaciones mejoradas.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-medium text-gray-900 mb-2">Tarjeta 1</h3>
                      <p className="text-gray-600">Contenido de ejemplo</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-medium text-gray-900 mb-2">Tarjeta 2</h3>
                      <p className="text-gray-600">Contenido de ejemplo</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="font-medium text-gray-900 mb-2">Tarjeta 3</h3>
                      <p className="text-gray-600">Contenido de ejemplo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .nav-link {
          @apply flex items-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 group rounded-md transition-all duration-200;
        }
        
        .nav-link.active {
          @apply bg-blue-50 border-r-2 border-blue-500 text-blue-700 font-medium;
        }
        
        .nav-link:hover {
          @apply bg-gray-50 text-gray-900;
        }
        
        .nav-link.active:hover {
          @apply bg-blue-50 text-blue-700;
        }
      `}</style>
    </div>
  );
};

export default Layout;