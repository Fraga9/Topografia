import { useState } from 'react';
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

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'proyectos':
        return <Proyectos />;
      case 'alertas':
        return <Alertas />;
      case 'analisis':
        return <Analisis />;
      case 'campo':
        return <Campo />;
      case 'configuracion':
        return <Configuracion />;
      case 'datosdiseno':
        return <DatosDiseno />;
      case 'reportes':
        return <Reportes />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;