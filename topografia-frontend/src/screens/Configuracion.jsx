import React, { useState, useEffect } from 'react';
import { useProyecto } from '../hooks/useProyecto';
import { useUpdateProyecto } from '../hooks/proyectos/useProyectos';
import { formatNumber } from '../utils/formatters';
import { Users, Plus, X, Edit, Trash2 } from 'lucide-react';

const Configuracion = () => {
  const [guardando, setGuardando] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  // Hook para proyecto actual
  const { proyecto, tieneProyecto } = useProyecto();

  // Hook para actualizar proyecto
  const updateProyecto = useUpdateProyecto();

  // Estados para los valores del formulario
  const [configuracion, setConfiguracion] = useState({
    nombre: '',
    tramo: '',
    cuerpo: '',
    km_inicial: '',
    km_final: '',
    intervalo: '',
    espesor: '',
    tolerancia_sct: '',
    divisiones_izquierdas: [],
    divisiones_derechas: [],
    encargados: []
  });

  // Estados para campos calculados (solo lectura)
  const [calculados, setCalculados] = useState({
    total_estaciones: 0,
    longitud_proyecto: 0
  });

  // Cargar valores del proyecto al estado del formulario
  useEffect(() => {
    if (proyecto) {
      setConfiguracion({
        nombre: proyecto.nombre || '',
        tramo: proyecto.tramo || '',
        cuerpo: proyecto.cuerpo || '',
        km_inicial: proyecto.km_inicial || '',
        km_final: proyecto.km_final || '',
        intervalo: proyecto.intervalo || '',
        espesor: proyecto.espesor || '',
        tolerancia_sct: proyecto.tolerancia_sct || '',
        divisiones_izquierdas: proyecto.divisiones_izquierdas || [],
        divisiones_derechas: proyecto.divisiones_derechas || [],
        encargados: proyecto.encargados || []
      });
      setCambiosPendientes(false);
    }
  }, [proyecto]);

  // Recalcular campos automáticos cuando cambien los valores relevantes
  useEffect(() => {
    if (configuracion.km_inicial && configuracion.km_final && configuracion.intervalo) {
      const kmInicial = parseFloat(configuracion.km_inicial);
      const kmFinal = parseFloat(configuracion.km_final);
      const intervalo = parseFloat(configuracion.intervalo);

      if (!isNaN(kmInicial) && !isNaN(kmFinal) && !isNaN(intervalo) && intervalo > 0) {
        const longitud = kmFinal - kmInicial;
        const totalEstaciones = Math.floor(longitud / intervalo) + 1; // +1 para incluir la estación inicial

        setCalculados({
          total_estaciones: totalEstaciones,
          longitud_proyecto: longitud
        });
      }
    }
  }, [configuracion.km_inicial, configuracion.km_final, configuracion.intervalo]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (proyecto) {
      const hayDiferencias = 
        configuracion.nombre !== (proyecto.nombre || '') ||
        configuracion.tramo !== (proyecto.tramo || '') ||
        configuracion.cuerpo !== (proyecto.cuerpo || '') ||
        parseFloat(configuracion.km_inicial) !== proyecto.km_inicial ||
        parseFloat(configuracion.km_final) !== proyecto.km_final ||
        parseFloat(configuracion.intervalo) !== proyecto.intervalo ||
        parseFloat(configuracion.espesor) !== proyecto.espesor ||
        parseFloat(configuracion.tolerancia_sct) !== proyecto.tolerancia_sct ||
        JSON.stringify(configuracion.divisiones_izquierdas) !== JSON.stringify(proyecto.divisiones_izquierdas) ||
        JSON.stringify(configuracion.divisiones_derechas) !== JSON.stringify(proyecto.divisiones_derechas) ||
        JSON.stringify(configuracion.encargados) !== JSON.stringify(proyecto.encargados || []);

      setCambiosPendientes(hayDiferencias);
    }
  }, [configuracion, proyecto]);

  // Manejar cambios en inputs
  const handleInputChange = (campo, valor) => {
    setConfiguracion(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Agregar división
  const agregarDivision = (lado) => {
    const valor = prompt(`Ingrese la nueva división ${lado} (en metros):`);
    if (valor !== null && !isNaN(parseFloat(valor))) {
      const nuevasDivisiones = [...configuracion[`divisiones_${lado}`], parseFloat(valor)];
      nuevasDivisiones.sort((a, b) => lado === 'izquierdas' ? b - a : a - b); // Ordenar
      
      handleInputChange(`divisiones_${lado}`, nuevasDivisiones);
    }
  };

  // Eliminar división
  const eliminarDivision = (lado, index) => {
    const nuevasDivisiones = configuracion[`divisiones_${lado}`].filter((_, i) => i !== index);
    handleInputChange(`divisiones_${lado}`, nuevasDivisiones);
  };

  // Editar división
  const editarDivision = (lado, index, valorActual) => {
    const nuevoValor = prompt(`Editar división ${lado}:`, valorActual);
    if (nuevoValor !== null && !isNaN(parseFloat(nuevoValor))) {
      const nuevasDivisiones = [...configuracion[`divisiones_${lado}`]];
      nuevasDivisiones[index] = parseFloat(nuevoValor);
      nuevasDivisiones.sort((a, b) => lado === 'izquierdas' ? b - a : a - b); // Reordenar
      
      handleInputChange(`divisiones_${lado}`, nuevasDivisiones);
    }
  };

  // Funciones para manejar encargados
  const handleEncargadoChange = (index, field, value) => {
    const nuevosEncargados = [...configuracion.encargados];
    nuevosEncargados[index] = { ...nuevosEncargados[index], [field]: value };
    handleInputChange('encargados', nuevosEncargados);
  };

  const agregarEncargado = () => {
    const nuevosEncargados = [...configuracion.encargados, { nombre: '', puesto: '' }];
    handleInputChange('encargados', nuevosEncargados);
  };

  const eliminarEncargado = (index) => {
    if (confirm('¿Está seguro de eliminar este encargado?')) {
      const nuevosEncargados = configuracion.encargados.filter((_, i) => i !== index);
      handleInputChange('encargados', nuevosEncargados);
    }
  };

  // Guardar cambios
  const handleGuardar = async () => {
    if (!proyecto || !cambiosPendientes) return;

    setGuardando(true);
    try {
      const datosActualizados = {
        nombre: configuracion.nombre,
        tramo: configuracion.tramo,
        cuerpo: configuracion.cuerpo,
        km_inicial: parseFloat(configuracion.km_inicial),
        km_final: parseFloat(configuracion.km_final),
        intervalo: parseFloat(configuracion.intervalo),
        espesor: parseFloat(configuracion.espesor),
        tolerancia_sct: parseFloat(configuracion.tolerancia_sct),
        divisiones_izquierdas: configuracion.divisiones_izquierdas,
        divisiones_derechas: configuracion.divisiones_derechas,
        encargados: configuracion.encargados.filter(enc => enc.nombre.trim() || enc.puesto.trim())
      };

      await updateProyecto.mutateAsync({
        proyectoId: proyecto.id,
        datosActualizados
      });

      setCambiosPendientes(false);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar configuración: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGuardando(false);
    }
  };

  // Restaurar valores originales
  const handleRestaurar = () => {
    if (confirm('¿Descartar todos los cambios y restaurar valores originales?')) {
      if (proyecto) {
        setConfiguracion({
          nombre: proyecto.nombre || '',
          tramo: proyecto.tramo || '',
          cuerpo: proyecto.cuerpo || '',
          km_inicial: proyecto.km_inicial || '',
          km_final: proyecto.km_final || '',
          intervalo: proyecto.intervalo || '',
          espesor: proyecto.espesor || '',
          tolerancia_sct: proyecto.tolerancia_sct || '',
          divisiones_izquierdas: proyecto.divisiones_izquierdas || [],
          divisiones_derechas: proyecto.divisiones_derechas || [],
          encargados: proyecto.encargados || []
        });
      }
    }
  };

  // Formatear KM para mostrar
  const formatearKM = (km) => {
    if (!km) return '';
    const kmNum = parseFloat(km);
    const kmMiles = Math.floor(kmNum / 1000);
    const metros = kmNum % 1000;
    return `${kmMiles}+${metros.toFixed(0).padStart(3, '0')}`;
  };

  // Si no hay proyecto seleccionado
  if (!tieneProyecto) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Seleccione un Proyecto</h2>
          <p className="text-gray-600 mb-4">
            Para configurar parámetros, primero seleccione un proyecto.
          </p>
          <button 
            onClick={() => window.location.href = '/proyectos'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg"
          >
            Ir a Proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Proyecto</h1>
            <p className="text-gray-600 mt-1">
              Modifica los parámetros y configuración del proyecto
            </p>
          </div>
          
          <div className="text-right">
            <h3 className="font-medium text-gray-900">{proyecto.nombre}</h3>
            <p className="text-sm text-gray-500">ID: {proyecto.id}</p>
            {cambiosPendientes && (
              <p className="text-xs text-orange-600 font-medium">● Cambios sin guardar</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleRestaurar}
          disabled={!cambiosPendientes}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Restaurar
        </button>
        <button
          onClick={handleGuardar}
          disabled={!cambiosPendientes || guardando}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Información Básica del Proyecto */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={configuracion.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del proyecto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tramo
            </label>
            <input
              type="text"
              value={configuracion.tramo}
              onChange={(e) => handleInputChange('tramo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del tramo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuerpo
            </label>
            <select
              value={configuracion.cuerpo}
              onChange={(e) => handleInputChange('cuerpo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Cuerpo A</option>
              <option value="B">Cuerpo B</option>
              <option value="C">Cuerpo C</option>
              <option value="D">Cuerpo D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parámetros Geométricos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros Geométricos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KM Inicial (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={configuracion.km_inicial}
              onChange={(e) => handleInputChange('km_inicial', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15000.000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: {formatearKM(configuracion.km_inicial)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KM Final (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={configuracion.km_final}
              onChange={(e) => handleInputChange('km_final', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="18500.000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: {formatearKM(configuracion.km_final)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intervalo (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={configuracion.intervalo}
              onChange={(e) => handleInputChange('intervalo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5.0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Distancia entre estaciones
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Espesor (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={configuracion.espesor}
              onChange={(e) => handleInputChange('espesor', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.250"
            />
            <p className="text-xs text-gray-500 mt-1">
              Espesor de carpeta asfáltica
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tolerancia SCT (m)
            </label>
            <input
              type="number"
              step="0.001"
              value={configuracion.tolerancia_sct}
              onChange={(e) => handleInputChange('tolerancia_sct', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.005"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tolerancia de la SCT
            </p>
          </div>
        </div>

        {/* Valores Calculados */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Valores Calculados Automáticamente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Total de Estaciones:</span>
              <span className="font-medium text-blue-900">{calculados.total_estaciones}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Longitud del Proyecto:</span>
              <span className="font-medium text-blue-900">{formatNumber(calculados.longitud_proyecto, 3)} m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divisiones Transversales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Divisiones Izquierdas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Divisiones Izquierdas</h3>
            <button
              onClick={() => agregarDivision('izquierdas')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              + Agregar
            </button>
          </div>
          
          <div className="space-y-2">
            {configuracion.divisiones_izquierdas.map((division, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-medium">
                  {formatNumber(Math.abs(division), 2)}m (I)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => editarDivision('izquierdas', index, division)}
                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarDivision('izquierdas', index)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            
            {configuracion.divisiones_izquierdas.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay divisiones izquierdas configuradas
              </p>
            )}
          </div>
        </div>

        {/* Divisiones Derechas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Divisiones Derechas</h3>
            <button
              onClick={() => agregarDivision('derechas')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              + Agregar
            </button>
          </div>
          
          <div className="space-y-2">
            {configuracion.divisiones_derechas.map((division, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm font-medium">
                  {formatNumber(division, 2)}m (D)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => editarDivision('derechas', index, division)}
                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarDivision('derechas', index)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            
            {configuracion.divisiones_derechas.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay divisiones derechas configuradas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Encargados del Proyecto */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Encargados del Proyecto
          </h3>
          <button
            onClick={agregarEncargado}
            disabled={configuracion.encargados.length >= 10}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar Encargado
          </button>
        </div>
        
        <div className="space-y-3">
          {configuracion.encargados.length > 0 ? (
            configuracion.encargados.map((encargado, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={encargado.nombre || ''}
                    onChange={(e) => handleEncargadoChange(index, 'nombre', e.target.value)}
                    placeholder="Ej: Juan Carlos Pérez García"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto/Cargo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={encargado.puesto || ''}
                      onChange={(e) => handleEncargadoChange(index, 'puesto', e.target.value)}
                      placeholder="Ej: Topógrafo Principal"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => eliminarEncargado(index)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar encargado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No hay encargados asignados al proyecto</p>
              <button
                onClick={agregarEncargado}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Agregar Primer Encargado
              </button>
            </div>
          )}
        </div>

        {configuracion.encargados.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Total de encargados:</strong> {configuracion.encargados.length} 
              {configuracion.encargados.length >= 10 && (
                <span className="text-orange-600 ml-2">(Máximo alcanzado)</span>
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Define quiénes son los responsables técnicos del proyecto. Estos nombres aparecerán en los reportes oficiales.
            </p>
          </div>
        )}
      </div>

      {/* Vista Previa de Divisiones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa de Sección Transversal</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-center items-center space-x-2 text-sm">
            {/* Divisiones izquierdas */}
            {configuracion.divisiones_izquierdas.slice().reverse().map((div, index) => (
              <span key={`izq-${index}`} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {formatNumber(Math.abs(div), 1)}
              </span>
            ))}
            
            {/* Centro */}
            <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded font-bold">
              0.0 (CL)
            </span>
            
            {/* Divisiones derechas */}
            {configuracion.divisiones_derechas.map((div, index) => (
              <span key={`der-${index}`} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {formatNumber(div, 1)}
              </span>
            ))}
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-2">
            Total de divisiones: {configuracion.divisiones_izquierdas.length + configuracion.divisiones_derechas.length + 1} 
            (incluye centro de línea)
          </p>
        </div>
      </div>

      {/* Indicador de cambios pendientes */}
      {cambiosPendientes && (
        <div className="fixed bottom-4 right-4 bg-orange-100 border border-orange-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-orange-800 font-medium">Tienes cambios sin guardar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;