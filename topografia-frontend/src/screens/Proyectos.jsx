import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useProyectos, 
  useCreateProyecto, 
  useUpdateProyecto, 
  useDeleteProyecto 
} from '../hooks/proyectos';
import { useProyectoSeleccionado } from '../context/ProyectoContext';
import { formatDate } from '../utils/formatters';
import { Plus, Search, Calendar, MapPin, Settings, Edit, Trash2, CheckCircle } from 'lucide-react';

const Proyectos = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Context del proyecto seleccionado
  const { proyectoSeleccionado, seleccionarProyecto } = useProyectoSeleccionado();

  // Hooks para gestión de proyectos
  const { 
    data: proyectos, 
    isLoading, 
    error 
  } = useProyectos();
  
  const createProyecto = useCreateProyecto();
  const updateProyecto = useUpdateProyecto();
  const deleteProyecto = useDeleteProyecto();

  const [newProject, setNewProject] = useState({
    nombre: "",
    tramo: "",
    cuerpo: "A",
    km_inicial: "",
    km_final: "",
    intervalo: "5",
    espesor: "0.25",
    tolerancia_sct: "0.005",
    fecha_inicio: new Date().toISOString().split("T")[0],
  });

  // Filtrar proyectos según búsqueda
  const proyectosFiltrados = proyectos?.filter(
    (proyecto) =>
      proyecto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.tramo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (estado) => {
    switch (estado) {
      case "EN_PROGRESO":
        return "bg-green-500 text-white";
      case "COMPLETADO":
        return "bg-blue-500 text-white";
      case "PAUSADO":
        return "bg-yellow-500 text-white";
      case "CONFIGURACION":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case "EN_PROGRESO":
        return "Activo";
      case "COMPLETADO":
        return "Completado";
      case "PAUSADO":
        return "Pausado";
      case "CONFIGURACION":
        return "Configuración";
      default:
        return estado;
    }
  };

  const handleCreateProject = async () => {
    try {
      const proyectoData = {
        nombre: newProject.nombre,
        tramo: newProject.tramo,
        cuerpo: newProject.cuerpo,
        km_inicial: parseFloat(newProject.km_inicial.replace("+", "")),
        km_final: parseFloat(newProject.km_final.replace("+", "")),
        intervalo: parseFloat(newProject.intervalo),
        espesor: parseFloat(newProject.espesor),
        tolerancia_sct: parseFloat(newProject.tolerancia_sct),
        estado: 'EN_PROGRESO'
      };

      const nuevoProyecto = await createProyecto.mutateAsync(proyectoData);
      
      // Seleccionar automáticamente el nuevo proyecto
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
        fecha_inicio: new Date().toISOString().split("T")[0],
      });

      // Navegar al dashboard después de crear el proyecto
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creando proyecto:', error);
      alert('Error al crear el proyecto');
    }
  };

  const handleSeleccionarProyecto = (proyecto) => {
    seleccionarProyecto(proyecto);
    // Navegar al dashboard después de seleccionar
    navigate('/dashboard');
  };

  const handleEliminar = async (proyectoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        await deleteProyecto.mutateAsync(proyectoId);
        
        // Si el proyecto eliminado era el seleccionado, limpiar la selección
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
                type="text"
                value={newProject.km_inicial}
                onChange={(e) => setNewProject({ ...newProject, km_inicial: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 78000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">KM Final *</label>
              <input
                type="text"
                value={newProject.km_final}
                onChange={(e) => setNewProject({ ...newProject, km_final: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 79000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
              <input
                type="date"
                value={newProject.fecha_inicio}
                onChange={(e) => setNewProject({ ...newProject, fecha_inicio: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intervalo (metros)</label>
              <input
                type="number"
                value={newProject.intervalo}
                onChange={(e) => setNewProject({ ...newProject, intervalo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleCreateProject}
              disabled={!newProject.nombre || !newProject.km_inicial || !newProject.km_final || createProyecto.isLoading}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {createProyecto.isLoading ? 'Creando...' : 'Crear Proyecto'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectosFiltrados.map((proyecto) => {
            const progreso = Math.floor(Math.random() * 100); // Temporal hasta tener datos reales
            const estacionesTotal = Math.ceil((proyecto.km_final - proyecto.km_inicial) / proyecto.intervalo);
            const completadas = Math.floor((progreso / 100) * estacionesTotal);
            const esSeleccionado = proyectoSeleccionado && proyectoSeleccionado.id === proyecto.id;

            return (
              <div
                key={proyecto.id}
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  esSeleccionado ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{proyecto.nombre}</h3>
                      {esSeleccionado && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {proyecto.tramo}, Cuerpo {proyecto.cuerpo}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(proyecto.estado)}`}>
                      {getStatusLabel(proyecto.estado)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>
                      KM {proyecto.km_inicial/1000}+{String(proyecto.km_inicial%1000).padStart(3,'0')} - {proyecto.km_final/1000}+{String(proyecto.km_final%1000).padStart(3,'0')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(proyecto.fecha_creacion)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Intervalo: {proyecto.intervalo}m</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{progreso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progreso}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {completadas}/{estacionesTotal} estaciones
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSeleccionarProyecto(proyecto)}
                    className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                      esSeleccionado 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {esSeleccionado ? 'Proyecto Activo' : 'Seleccionar Proyecto'}
                  </button>
                  
                  <button
                    onClick={() => handleEliminar(proyecto.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No se encontraron proyectos que coincidan con tu búsqueda</p>
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