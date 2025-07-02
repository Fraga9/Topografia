import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useMisProyectos,
  useCreateProyectoCompleto, 
  useUpdateProyecto, 
  useDeleteProyecto 
} from '../hooks/proyectos';
import { useProyectoSeleccionado } from '../context/ProyectoContext';
import { formatDate } from '../utils/formatters';
import { validators } from '../utils/validators';
import { Plus, Search, CheckCircle, AlertCircle, MapPin, Calculator, Settings, X, ArrowLeft, ArrowRight } from 'lucide-react';
import ProyectoCard from '../components/ProyectoCard';

// Componente FormField fuera del componente principal para evitar re-creaciones
const FormField = React.memo(({ label, children, error, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
));

FormField.displayName = 'FormField';

// Componente para las divisiones transversales
const DivisionesTransversales = React.memo(({ 
  titulo, 
  divisiones, 
  tipo, 
  onDivisionChange, 
  onAddDivision, 
  onRemoveDivision,
  icono 
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
        {icono}
        {titulo}
      </h4>
      <button
        type="button"
        onClick={() => onAddDivision(tipo)}
        className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
        title="Agregar división"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {divisiones.map((division, index) => (
        <div key={index} className="relative">
          <input
            type="number"
            step="0.01"
            value={division}
            onChange={(e) => onDivisionChange(tipo, index, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {divisiones.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveDivision(tipo, index)}
              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-colors"
              title="Eliminar división"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">
      {tipo === 'divisiones_izquierdas' 
        ? 'Valores negativos representan distancias hacia la izquierda del eje central' 
        : 'Valores positivos representan distancias hacia la derecha del eje central'
      }
    </p>
  </div>
));

DivisionesTransversales.displayName = 'DivisionesTransversales';

const Proyectos = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // Context del proyecto seleccionado
  const { proyectoSeleccionado, seleccionarProyecto } = useProyectoSeleccionado();

  // Obtener proyectos reales del usuario
  const { 
    data: proyectos, 
    isLoading, 
    error,
    refetch 
  } = useMisProyectos();
  
  const createProyectoCompleto = useCreateProyectoCompleto();
  const updateProyecto = useUpdateProyecto();
  const deleteProyecto = useDeleteProyecto();

  // Estado del formulario mejorado
  const [newProject, setNewProject] = useState({
    nombre: "",
    tramo: "",
    cuerpo: "A",
    km_inicial: "",
    km_final: "",
    intervalo: "5",
    espesor: "0.25",
    tolerancia_sct: "0.005",
    divisiones_izquierdas: [-12.21, -10.7, -9, -6, -3, -1.3, 0],
    divisiones_derechas: [1.3, 3, 6, 9, 10.7, 12.21],
  });

  // Filtrar proyectos según búsqueda
  const proyectosFiltrados = useMemo(() => {
    if (!proyectos) return [];
    
    return proyectos.filter((proyecto) =>
      proyecto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.tramo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.cuerpo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [proyectos, searchTerm]);

  // Validación completa del formulario
  const validateForm = useCallback(() => {
    const errors = {};

    // Validar nombre
    const nombreValidation = validators.proyecto.nombre(newProject.nombre);
    if (!nombreValidation.valid) {
      errors.nombre = nombreValidation.message;
    }

    // Validar tramo
    if (!newProject.tramo.trim()) {
      errors.tramo = 'El tramo es requerido';
    } else if (newProject.tramo.trim().length < 2) {
      errors.tramo = 'El tramo debe tener al menos 2 caracteres';
    }

    // Validar kilómetros
    const kmInicial = parseFloat(newProject.km_inicial);
    const kmFinal = parseFloat(newProject.km_final);
    
    if (!newProject.km_inicial || isNaN(kmInicial) || kmInicial < 0) {
      errors.km_inicial = 'KM inicial es requerido y debe ser un número válido (≥ 0)';
    } else if (!newProject.km_final || isNaN(kmFinal) || kmFinal < 0) {
      errors.km_final = 'KM final es requerido y debe ser un número válido (≥ 0)';
    } else {
      const kmValidation = validators.proyecto.kilometros(kmInicial, kmFinal);
      if (!kmValidation.valid) {
        errors.kilometros = kmValidation.message;
      }
      
      // Validar que la diferencia no sea demasiado grande
      const longitud = kmFinal - kmInicial;
      if (longitud > 100000) { // Máximo 100km
        errors.kilometros = 'La longitud del proyecto no puede exceder 100 km';
      }
    }

    // Validar intervalo
    const intervalo = parseFloat(newProject.intervalo);
    if (isNaN(intervalo)) {
      errors.intervalo = 'El intervalo debe ser un número válido';
    } else {
      const intervaloValidation = validators.configuracion.intervalo(intervalo);
      if (!intervaloValidation.valid) {
        errors.intervalo = intervaloValidation.message;
      }
    }

    // Validar espesor
    const espesor = parseFloat(newProject.espesor);
    if (isNaN(espesor)) {
      errors.espesor = 'El espesor debe ser un número válido';
    } else {
      const espesorValidation = validators.configuracion.espesor(espesor);
      if (!espesorValidation.valid) {
        errors.espesor = espesorValidation.message;
      }
    }

    // Validar tolerancia SCT
    const tolerancia = parseFloat(newProject.tolerancia_sct);
    if (isNaN(tolerancia)) {
      errors.tolerancia_sct = 'La tolerancia SCT debe ser un número válido';
    } else {
      const toleranciaValidation = validators.configuracion.toleranciaSCT(tolerancia);
      if (!toleranciaValidation.valid) {
        errors.tolerancia_sct = toleranciaValidation.message;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newProject]);

  // Calcular estadísticas del formulario
  const projectStats = useMemo(() => {
    const kmInicial = parseFloat(newProject.km_inicial);
    const kmFinal = parseFloat(newProject.km_final);
    const intervalo = parseFloat(newProject.intervalo);

    if (isNaN(kmInicial) || isNaN(kmFinal) || isNaN(intervalo) || kmFinal <= kmInicial) {
      return null;
    }

    const longitud = kmFinal - kmInicial;
    const totalEstaciones = Math.floor(longitud / intervalo) + 1;

    return {
      longitud: longitud.toLocaleString(), // Formatear con comas
      totalEstaciones: totalEstaciones.toLocaleString(),
      intervalos: (totalEstaciones - 1).toLocaleString()
    };
  }, [newProject.km_inicial, newProject.km_final, newProject.intervalo]);

  const handleCreateProject = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const proyectoData = {
        nombre: newProject.nombre.trim(),
        tramo: newProject.tramo.trim(),
        cuerpo: newProject.cuerpo,
        km_inicial: parseFloat(newProject.km_inicial),  // Backend espera Decimal (float)
        km_final: parseFloat(newProject.km_final),      // Backend espera Decimal (float)
        intervalo: parseFloat(newProject.intervalo),
        espesor: parseFloat(newProject.espesor),
        tolerancia_sct: parseFloat(newProject.tolerancia_sct),
        generar_estaciones: true  // Para el endpoint completo
      };

      // Validar que los datos estén completos antes de enviar
      console.log('📊 Datos a enviar al endpoint /proyectos/completo/:', proyectoData);
      
      // Verificar que no haya NaN
      if (isNaN(proyectoData.km_inicial) || isNaN(proyectoData.km_final) || 
          isNaN(proyectoData.intervalo) || isNaN(proyectoData.espesor) || 
          isNaN(proyectoData.tolerancia_sct)) {
        throw new Error('Todos los campos numéricos deben tener valores válidos');
      }

      // Verificar campos requeridos
      if (!proyectoData.nombre || !proyectoData.tramo) {
        throw new Error('Nombre y tramo son requeridos');
      }

      const nuevoProyecto = await createProyectoCompleto.mutateAsync(proyectoData);
      
      // Seleccionar el nuevo proyecto
      seleccionarProyecto(nuevoProyecto);
      
      // Limpiar formulario
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
        divisiones_izquierdas: [-12.21, -10.7, -9, -6, -3, -1.3, 0],
        divisiones_derechas: [1.3, 3, 6, 9, 10.7, 12.21],
      });
      setFormErrors({});

      // Navegar al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creando proyecto:', error);
      
      let errorMessage = 'Error al crear el proyecto. Verifica los datos e intenta nuevamente.';
      
      // Manejar errores de validación del backend (422)
      if (error.status === 422 || error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail || error.message;
        
        if (Array.isArray(validationErrors)) {
          // Errores de validación de FastAPI/Pydantic
          errorMessage = validationErrors.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        } else if (typeof validationErrors === 'string') {
          errorMessage = validationErrors;
        } else if (typeof validationErrors === 'object') {
          errorMessage = JSON.stringify(validationErrors);
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      setFormErrors({
        general: errorMessage
      });
    }
  }, [validateForm, newProject, createProyectoCompleto, seleccionarProyecto, navigate]);

  const handleInputChange = useCallback((field, value) => {
    setNewProject(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error específico al escribir
    setFormErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Función para manejar divisiones transversales
  const handleDivisionChange = useCallback((tipo, index, value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;
    
    setNewProject(prev => {
      const newDivisiones = [...prev[tipo]];
      newDivisiones[index] = numericValue;
      return { ...prev, [tipo]: newDivisiones };
    });
  }, []);

  const handleAddDivision = useCallback((tipo) => {
    setNewProject(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], 0]
    }));
  }, []);

  const handleRemoveDivision = useCallback((tipo, index) => {
    setNewProject(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter((_, i) => i !== index)
    }));
  }, []);

  const handleSeleccionarProyecto = useCallback((proyecto) => {
    seleccionarProyecto(proyecto);
  }, [seleccionarProyecto]);

  const handleEliminar = useCallback(async (proyectoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        await deleteProyecto.mutateAsync(proyectoId);
        
        if (proyectoSeleccionado && proyectoSeleccionado.id === proyectoId) {
          seleccionarProyecto(null);
        }
      } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        let errorMessage = 'Error al eliminar el proyecto';
        
        if (error.status === 404 || error.response?.status === 404) {
          errorMessage = 'El proyecto ya no existe o ya fue eliminado';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    }
  }, [deleteProyecto, proyectoSeleccionado, seleccionarProyecto]);

  // Formulario de creación mejorado
  if (mostrarFormulario) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button 
            onClick={() => {
              setMostrarFormulario(false);
              setFormErrors({});
            }} 
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Volver a Proyectos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Proyecto</h1>
          <p className="text-gray-600">Configure los parámetros del nuevo proyecto de carretera</p>
        </div>

        {/* Error general */}
        {formErrors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{formErrors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Formulario principal */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Información del proyecto */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Información del Proyecto
                  </h3>
                </div>

                <FormField 
                  label="Nombre del Proyecto" 
                  required 
                  error={formErrors.nombre}
                >
                  <input
                    type="text"
                    value={newProject.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: San Miguel Allende - Dolores Hidalgo"
                  />
                </FormField>

                <FormField 
                  label="Tramo" 
                  required 
                  error={formErrors.tramo}
                >
                  <input
                    type="text"
                    value={newProject.tramo}
                    onChange={(e) => handleInputChange('tramo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Frente 3, Sección Norte"
                  />
                </FormField>

                <FormField 
                  label="Cuerpo" 
                  required
                >
                  <select
                    value={newProject.cuerpo}
                    onChange={(e) => handleInputChange('cuerpo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A">Cuerpo A</option>
                    <option value="B">Cuerpo B</option>
                    <option value="C">Cuerpo C</option>
                    <option value="D">Cuerpo D</option>
                  </select>
                </FormField>

                {/* Kilómetros */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    Kilometraje
                  </h3>
                </div>

                <FormField 
                  label="KM Inicial" 
                  required 
                  error={formErrors.km_inicial || formErrors.kilometros}
                >
                  <input
                    type="number"
                    value={newProject.km_inicial}
                    onChange={(e) => handleInputChange('km_inicial', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="78000 (metros)"
                    step="1"
                    min="0"
                  />
                </FormField>

                <FormField 
                  label="KM Final" 
                  required 
                  error={formErrors.km_final}
                >
                  <input
                    type="number"
                    value={newProject.km_final}
                    onChange={(e) => handleInputChange('km_final', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="79000 (metros)"
                    step="1"
                    min="0"
                  />
                </FormField>

                {/* Configuración técnica */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Configuración Técnica
                  </h3>
                </div>

                <FormField 
                  label="Intervalo entre estaciones (metros)" 
                  error={formErrors.intervalo}
                >
                  <select
                    value={newProject.intervalo}
                    onChange={(e) => handleInputChange('intervalo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="2.5">2.5 metros</option>
                    <option value="5">5 metros (estándar)</option>
                    <option value="10">10 metros</option>
                    <option value="15">15 metros</option>
                    <option value="20">20 metros</option>
                  </select>
                </FormField>

                <FormField 
                  label="Espesor Concreto (metros)" 
                  error={formErrors.espesor}
                >
                  <input
                    type="number"
                    step="0.01"
                    value={newProject.espesor}
                    onChange={(e) => handleInputChange('espesor', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.25"
                    min="0.01"
                    max="1.00"
                  />
                </FormField>

                <FormField 
                  label="Tolerancia SCT (metros)" 
                  error={formErrors.tolerancia_sct}
                >
                  <select
                    value={newProject.tolerancia_sct}
                    onChange={(e) => handleInputChange('tolerancia_sct', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0.003">0.003 m (alta precisión)</option>
                    <option value="0.005">0.005 m (estándar)</option>
                    <option value="0.010">0.010 m (tolerante)</option>
                    <option value="0.015">0.015 m (muy tolerante)</option>
                  </select>
                </FormField>

                {/* Divisiones Transversales */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5 text-orange-600" />
                    <ArrowRight className="w-5 h-5 text-orange-600" />
                    Divisiones Transversales
                  </h3>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <DivisionesTransversales
                    titulo="Divisiones Izquierdas (metros)"
                    divisiones={newProject.divisiones_izquierdas}
                    tipo="divisiones_izquierdas"
                    onDivisionChange={handleDivisionChange}
                    onAddDivision={handleAddDivision}
                    onRemoveDivision={handleRemoveDivision}
                    icono={<ArrowLeft className="w-4 h-4 text-orange-600" />}
                  />
                  
                  <DivisionesTransversales
                    titulo="Divisiones Derechas (metros)"
                    divisiones={newProject.divisiones_derechas}
                    tipo="divisiones_derechas"
                    onDivisionChange={handleDivisionChange}
                    onAddDivision={handleAddDivision}
                    onRemoveDivision={handleRemoveDivision}
                    icono={<ArrowRight className="w-4 h-4 text-orange-600" />}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCreateProject}
                  disabled={createProyectoCompleto.isPending}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createProyectoCompleto.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creando proyecto...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear Proyecto
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setFormErrors({});
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          {/* Panel de estadísticas */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resumen del Proyecto
              </h3>
              
              {projectStats ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600">Longitud total</div>
                    <div className="text-2xl font-bold text-blue-600">{projectStats.longitud} m</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600">Estaciones a crear</div>
                    <div className="text-2xl font-bold text-green-600">{projectStats.totalEstaciones}</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600">Intervalos</div>
                    <div className="text-2xl font-bold text-purple-600">{projectStats.intervalos}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-white rounded-lg p-3">
                    <strong>Nota:</strong> Se crearán automáticamente {projectStats.totalEstaciones} estaciones teóricas 
                    desde el KM {newProject.km_inicial} hasta el 
                    KM {newProject.km_final} con intervalos de {newProject.intervalo} metros.
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Complete los kilómetros inicial y final para ver las estadísticas del proyecto
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-red-800 font-medium">Error al cargar proyectos</h3>
              <p className="text-red-600 mt-1">{error.message}</p>
              <button 
                onClick={refetch}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
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
              {proyectoSeleccionado.tramo && (
                <span className="text-sm text-blue-700">
                  • {proyectoSeleccionado.tramo}
                </span>
              )}
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
            placeholder="Buscar por nombre, tramo o cuerpo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
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
          <div className="max-w-md mx-auto">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'No se encontraron proyectos que coincidan con tu búsqueda'
                : 'No tienes proyectos creados aún'
              }
            </p>
            {!searchTerm && (
              <p className="text-sm text-gray-400 mb-6">
                Crea tu primer proyecto para comenzar con las mediciones topográficas
              </p>
            )}
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              {searchTerm ? 'Crear Nuevo Proyecto' : 'Crear Primer Proyecto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proyectos;