// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './context/QueryProvider';
import { AuthProvider } from './context/AuthContext';
import { ProyectoProvider } from './context/ProyectoContext';
import { useAuth } from './hooks/auth';
import Login from './screens/Login';
import Layout from './screens/Layout';
import Dashboard from './screens/Dashboard';
import Proyectos from './screens/Proyectos';
import Alertas from './screens/Alertas';
import Analisis from './screens/Analisis';
import Campo from './screens/Campo';
import Configuracion from './screens/Configuracion';
import DatosDiseno from './screens/DatosDiseño';
import Reportes from './screens/Reportes';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Componente principal de rutas
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="proyectos" element={<Proyectos />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="analisis" element={<Analisis />} />
        <Route path="campo" element={<Campo />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="datos-diseno" element={<DatosDiseno />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ProyectoProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
          </Router>
        </ProyectoProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;