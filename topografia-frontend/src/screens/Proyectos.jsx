import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useMisProyectos,  // ← CAMBIO CLAVE: Usar el hook que consulta la vista mis_proyectos
  useCreateProyectoCompleto, 
  useUpdateProyecto, 
  useDeleteProyecto 
} from '../hooks/proyectos';
import { useProyectoSeleccionado } from '../context/ProyectoContext';
import { formatDate } from '../utils/formatters';
import { Plus, Search, CheckCircle } from 'lucide-react';
import ProyectoCard from '../components/ProyectoCard';


const Proyectos = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Context del proyecto seleccionado
  const { proyectoSeleccionado, seleccionarProyecto } = useProyectoSeleccionado();

  // 🔧 CAMBIO PRINCIPAL: Usar el hook que consulta la vista mis_proyectos
  // Esta vista incluye todos los campos calculados que necesitamos
  const { 
    data: proyectosOriginales, // Renamed to avoid conflict
    isLoading, 
    error 
  } = useMisProyectos(); // ← Este hook debe consultar la vista mis_proyectos
  
  const createProyectoCompleto = useCreateProyectoCompleto();
  const updateProyecto = useUpdateProyecto();
  const deleteProyecto = useDeleteProyecto();

  // --- Hardcoded projects for testing ---
  const hardcodedProyectos = [
    {
      id: 'hc-proj-1',
      nombre: "Demo: Carretera del Desierto",
      tramo: "Sección Oasis",
      cuerpo: "A",
      km_inicial: 100000,
      km_final: 125000,
      estado: "EN_PROGRESO",
      estaciones_configuradas: 250,
      estaciones_medidas: 50,
      total_lecturas: 200,
      // Add any other fields expected by ProyectoCard or selection logic
      // For example, if 'fecha_creacion' is used for sorting or display:
      fecha_creacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    },
    {
      id: 'hc-proj-2',
      nombre: "Demo: Puente Colgante",
      tramo: "Valle Profundo",
      cuerpo: "Unico",
      km_inicial: 5000,
      km_final: 5500,
      estado: "CONFIGURACIÓN", // To test glassmorphism
      estaciones_configuradas: 50,
      estaciones_medidas: 0,
      total_lecturas: 0,
      fecha_creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: 'hc-proj-3',
      nombre: "Demo: Túnel Montañoso",
      tramo: "Paso Cumbres",
      cuerpo: "B",
      km_inicial: 75000,
      km_final: 78000,
      estado: "PAUSADO",
      estaciones_configuradas: 30,
      estaciones_medidas: 10,
      total_lecturas: 40,
      fecha_creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  ];

  // Combine fetched projects with hardcoded ones
  // Ensure hardcoded ones don't clash with real IDs if they could be similar
  // For demo, we can just prepend or append. Prepending might be more visible.
  const proyectos = React.useMemo(() => {
    const hcIds = new Set(hardcodedProyectos.map(p => p.id));
    const filteredOriginales = proyectosOriginales?.filter(p => !hcIds.has(p.id)) || [];
    return [...hardcodedProyectos, ...filteredOriginales];
  }, [proyectosOriginales]);
  // --- End of hardcoded projects section ---


  const [newProject, setNewProject] = useState({
    nombre: "",
    tramo: "",
    cuerpo: "A",
    km_inicial: "",
    km_final: "",
    intervalo: "5",
    espesor: "0.25",
    tolerancia_sct: "0.005",
  });

  // Filtrar proyectos según búsqueda
  const proyectosFiltrados = proyectos?.filter(
    (proyecto) =>
      proyecto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.tramo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 🔍 DEBUG: Ver qué datos estamos recibiendo
  React.useEffect(() => {
    if (proyectos && proyectos.length > 0) {
      console.log('📊 Datos de proyectos (combinados) para la lista:', proyectos);
      // console.log('Campos disponibles en el primer proyecto combinado:', Object.keys(proyectos[0]));
    }
  }, [proyectos]);

  const handleCreateProject = async () => {
    try {
      const proyectoData = {
        p_nombre: newProject.nombre,
        p_tramo: newProject.tramo,
        p_cuerpo: newProject.cuerpo,
        p_km_inicial: parseFloat(newProject.km_inicial),
        p_km_final: parseFloat(newProject.km_final),
        p_intervalo: parseFloat(newProject.intervalo),
        p_espesor: parseFloat(newProject.espesor),
        p_tolerancia_sct: parseFloat(newProject.tolerancia_sct)
      };

      const nuevoProyecto = await createProyectoCompleto.mutateAsync(proyectoData);
      
      seleccionarProyecto(nuevoProyecto);
      
      setMostrarFormulario(false);
      setNewProject({
        nombre: "",
        tramo: "",
        cuerpo: "A", 
        km_inicial: "",
        km_final: "",
        intervalo: "5",
        espesor: "0.25",
        tolerancia_sct: "0.005",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creando proyecto:', error);
      alert('Error al crear el proyecto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleSeleccionarProyecto = (proyecto) => {
    seleccionarProyecto(proyecto);
    // navigate('/dashboard'); // Line removed to prevent redirection
  };

  const handleEliminar = async (proyectoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        await deleteProyecto.mutateAsync(proyectoId);
        
        if (proyectoSeleccionado && proyectoSeleccionado.id === proyectoId) {
          seleccionarProyecto(null);
        }
      } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        alert('Error al eliminar el proyecto');
      }
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button 
            onClick={() => setMostrarFormulario(false)} 
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Volver a Proyectos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Proyecto</h1>
          <p className="text-gray-600">Configure los parámetros del nuevo proyecto de carretera</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto *</label>
              <input
                type="text"
                value={newProject.nombre}
                onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: San Miguel Allende - Dolores Hidalgo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tramo *</label>
              <input
                type="text"
                value={newProject.tramo}
                onChange={(e) => setNewProject({ ...newProject, tramo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Frente 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuerpo *</label>
              <select
                value={newProject.cuerpo}
                onChange={(e) => setNewProject({ ...newProject, cuerpo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Cuerpo A</option>
                <option value="B">Cuerpo B</option>
                <option value="C">Cuerpo C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">KM Inicial *</label>
              <input
                type="number"
                value={newProject.km_inicial}
                onChange={(e) => setNewProject({ ...newProject, km_inicial: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="78000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">KM Final *</label>
              <input
                type="number"
                value={newProject.km_final}
                onChange={(e) => setNewProject({ ...newProject, km_final: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="79000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intervalo entre estaciones (metros)</label>
              <input
                type="number"
                value={newProject.intervalo}
                onChange={(e) => setNewProject({ ...newProject, intervalo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Espesor Concreto (m)</label>
              <input
                type="number"
                step="0.01"
                value={newProject.espesor}
                onChange={(e) => setNewProject({ ...newProject, espesor: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tolerancia SCT (m)</label>
              <input
                type="number"
                step="0.001"
                value={newProject.tolerancia_sct}
                onChange={(e) => setNewProject({ ...newProject, tolerancia_sct: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.001"
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleCreateProject}
              disabled={!newProject.nombre || !newProject.km_inicial || !newProject.km_final || createProyectoCompleto.isLoading}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {createProyectoCompleto.isLoading ? 'Creando proyecto y estaciones...' : 'Crear Proyecto'}
            </button>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error al cargar proyectos</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banco de Proyectos</h1>
        <p className="text-gray-600">Selecciona un proyecto existente o crea uno nuevo</p>
        
        {/* Proyecto seleccionado actualmente */}
        {proyectoSeleccionado && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Proyecto activo: {proyectoSeleccionado.nombre}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Create */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Projects Grid */}
      {proyectosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {proyectosFiltrados.map((proyecto) => {
            const esSeleccionado = proyectoSeleccionado && proyectoSeleccionado.id === proyecto.id;

            return (
              <ProyectoCard
                key={proyecto.id}
                proyecto={proyecto}
                esSeleccionado={esSeleccionado}
                onSeleccionar={handleSeleccionarProyecto}
                onEliminar={handleEliminar}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'No se encontraron proyectos que coincidan con tu búsqueda'
              : 'No tienes proyectos creados aún'
            }
          </p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Crear Primer Proyecto
          </button>
        </div>
      )}
    </div>
  );
};

export default Proyectos;