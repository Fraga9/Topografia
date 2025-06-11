import React, { useState } from 'react';
import { useAuth, usePerfilUsuario, useUpdatePerfil, useCambiarPassword } from '../hooks';
import { Save, Download, Upload, User, Settings as SettingsIcon, Lock, HelpCircle } from 'lucide-react';

const Configuracion = ({ proyectoSeleccionado }) => {
  const [seccionActiva, setSeccionActiva] = useState('proyecto');
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);

  const { usuario } = useAuth();
  const { data: perfilUsuario, isLoading: loadingPerfil } = usePerfilUsuario();
  const updatePerfil = useUpdatePerfil();
  const cambiarPassword = useCambiarPassword();

  const [perfilForm, setPerfilForm] = useState({
    nombre: perfilUsuario?.nombre || '',
    email: perfilUsuario?.email || '',
    telefono: perfilUsuario?.telefono || '',
    empresa: perfilUsuario?.empresa || '',
    cargo: perfilUsuario?.cargo || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    passwordActual: '',
    passwordNuevo: '',
    confirmarPassword: ''
  });

  // Configuración del proyecto (valores por defecto basados en el esquema)
  const [configProyecto, setConfigProyecto] = useState({
    nombre: proyectoSeleccionado?.nombre || "San Miguel Allende - Dolores Hidalgo",
    tramo: proyectoSeleccionado?.tramo || "Frente 3",
    cuerpo: proyectoSeleccionado?.cuerpo || "A",
    km_inicial: proyectoSeleccionado ? `${Math.floor(proyectoSeleccionado.km_inicial/1000)}+${String(proyectoSeleccionado.km_inicial%1000).padStart(3,'0')}` : "78+000",
    km_final: proyectoSeleccionado ? `${Math.floor(proyectoSeleccionado.km_final/1000)}+${String(proyectoSeleccionado.km_final%1000).padStart(3,'0')}` : "79+000",
    intervalo: proyectoSeleccionado?.intervalo?.toString() || "5",
    espesor: proyectoSeleccionado?.espesor?.toString() || "0.25",
    tolerancia_sct: proyectoSeleccionado?.tolerancia_sct?.toString() || "0.005",
    // Parámetros de medición (mock)
    altura_aparato: "3.289",
    bn_referencia: "1883.021",
    pendiente_transversal: "-0.045",
    ingeniero: "Ing. Carlos Mendoza",
    fecha_inicio: "2024-01-15",
  });

  // Divisiones transversales (basadas en el esquema SQL)
  const distancias = [
    { id: "eje", label: "EJE CENTRAL", value: "0", readonly: true },
    { id: "d1", label: "DERECHA +1.3m", value: "1.3", readonly: false },
    { id: "d2", label: "DERECHA +3.0m", value: "3.0", readonly: false },
    { id: "d3", label: "DERECHA +6.0m", value: "6.0", readonly: false },
    { id: "d4", label: "DERECHA +9.0m", value: "9.0", readonly: false },
    { id: "d5", label: "DERECHA +10.7m", value: "10.7", readonly: false },
    { id: "d6", label: "DERECHA +12.21m", value: "12.21", readonly: false },
  ];

  React.useEffect(() => {
    if (perfilUsuario) {
      setPerfilForm({
        nombre: perfilUsuario.nombre || '',
        email: perfilUsuario.email || '',
        telefono: perfilUsuario.telefono || '',
        empresa: perfilUsuario.empresa || '',
        cargo: perfilUsuario.cargo || ''
      });
    }
  }, [perfilUsuario]);

  // Actualizar configuración cuando cambie el proyecto seleccionado
  React.useEffect(() => {
    if (proyectoSeleccionado) {
      setConfigProyecto({
        nombre: proyectoSeleccionado.nombre || "",
        tramo: proyectoSeleccionado.tramo || "",
        cuerpo: proyectoSeleccionado.cuerpo || "A",
        km_inicial: `${Math.floor(proyectoSeleccionado.km_inicial/1000)}+${String(proyectoSeleccionado.km_inicial%1000).padStart(3,'0')}`,
        km_final: `${Math.floor(proyectoSeleccionado.km_final/1000)}+${String(proyectoSeleccionado.km_final%1000).padStart(3,'0')}`,
        intervalo: proyectoSeleccionado.intervalo?.toString() || "5",
        espesor: proyectoSeleccionado.espesor?.toString() || "0.25",
        tolerancia_sct: proyectoSeleccionado.tolerancia_sct?.toString() || "0.005",
        altura_aparato: "3.289",
        bn_referencia: "1883.021",
        pendiente_transversal: "-0.045",
        ingeniero: "Ing. Carlos Mendoza",
        fecha_inicio: proyectoSeleccionado.fecha_creacion?.split('T')[0] || "2024-01-15",
      });
    }
  }, [proyectoSeleccionado]);

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    try {
      await updatePerfil.mutateAsync(perfilForm);
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error al actualizar el perfil');
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.passwordNuevo !== passwordForm.confirmarPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      await cambiarPassword.mutateAsync({
        passwordActual: passwordForm.passwordActual,
        passwordNuevo: passwordForm.passwordNuevo
      });
      
      setPasswordForm({
        passwordActual: '',
        passwordNuevo: '',
        confirmarPassword: ''
      });
      setMostrarCambioPassword(false);
      alert('Contraseña cambiada exitosamente');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  const handleSaveConfigProject = () => {
    // Aquí se conectaría con la API para actualizar el proyecto
    alert('Configuración del proyecto guardada (pendiente implementar API)');
  };

  const renderConfiguracionProyecto = () => (
    <div className="space-y-6">
      {proyectoSeleccionado ? (
        <>
          {/* Project Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Proyecto</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={configProyecto.nombre}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tramo</label>
                  <input
                    type="text"
                    value={configProyecto.tramo}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, tramo: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo</label>
                  <input
                    type="text"
                    value={configProyecto.cuerpo}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, cuerpo: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM Inicial</label>
                  <input
                    type="text"
                    value={configProyecto.km_inicial}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, km_inicial: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM Final</label>
                  <input
                    type="text"
                    value={configProyecto.km_final}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, km_final: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingeniero Responsable</label>
                  <input
                    type="text"
                    value={configProyecto.ingeniero}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, ingeniero: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={configProyecto.fecha_inicio}
                    onChange={(e) => setConfigProyecto({ ...configProyecto, fecha_inicio: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Parameters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros Técnicos</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de Medición (metros)</label>
                <input
                  type="number"
                  step="1"
                  value={configProyecto.intervalo}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, intervalo: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espesor de Concreto (metros)</label>
                <input
                  type="number"
                  step="0.01"
                  value={configProyecto.espesor}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, espesor: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tolerancia SCT (metros)</label>
                <input
                  type="number"
                  step="0.001"
                  value={configProyecto.tolerancia_sct}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, tolerancia_sct: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Estándar: ±0.005m (±5mm)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altura de Aparato (metros)</label>
                <input
                  type="number"
                  step="0.001"
                  value={configProyecto.altura_aparato}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, altura_aparato: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BN Referencia (metros)</label>
                <input
                  type="number"
                  step="0.001"
                  value={configProyecto.bn_referencia}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, bn_referencia: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pendiente Transversal (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={configProyecto.pendiente_transversal}
                  onChange={(e) => setConfigProyecto({ ...configProyecto, pendiente_transversal: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Bombeo del pavimento</p>
              </div>
            </div>
          </div>

          {/* Cross Section Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Sección Transversal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Distancias de medición desde el eje central (solo derechas - sección simétrica)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {distancias.map((dist) => (
                <div key={dist.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dist.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dist.value}
                    readOnly={dist.readonly}
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      dist.readonly ? "bg-gray-100 text-gray-500" : "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleSaveConfigProject}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>GUARDAR CONFIGURACIÓN</span>
            </button>

            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>EXPORTAR CONFIG</span>
            </button>

            <button className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>IMPORTAR CONFIG</span>
            </button>

            <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors">
              RESTABLECER VALORES
            </button>
          </div>

          {/* Configuration Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Resumen de Configuración:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total estaciones:</span>
                <span className="font-medium ml-2">
                  {Math.ceil((parseFloat(configProyecto.km_final.replace('+', '')) - parseFloat(configProyecto.km_inicial.replace('+', ''))) / parseFloat(configProyecto.intervalo))} estaciones
                </span>
              </div>
              <div>
                <span className="text-gray-600">Puntos por estación:</span>
                <span className="font-medium ml-2">7 puntos</span>
              </div>
              <div>
                <span className="text-gray-600">Total mediciones:</span>
                <span className="font-medium ml-2">
                  {Math.ceil((parseFloat(configProyecto.km_final.replace('+', '')) - parseFloat(configProyecto.km_inicial.replace('+', ''))) / parseFloat(configProyecto.intervalo)) * 7} puntos
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <SettingsIcon className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyecto seleccionado</h3>
          <p className="text-gray-600">Selecciona un proyecto para configurar sus parámetros.</p>
        </div>
      )}
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>
        
        {loadingPerfil ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleUpdatePerfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={perfilForm.nombre}
                  onChange={(e) => setPerfilForm({...perfilForm, nombre: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={perfilForm.email}
                  onChange={(e) => setPerfilForm({...perfilForm, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={perfilForm.telefono}
                  onChange={(e) => setPerfilForm({...perfilForm, telefono: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Empresa
                </label>
                <input
                  type="text"
                  value={perfilForm.empresa}
                  onChange={(e) => setPerfilForm({...perfilForm, empresa: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cargo
                </label>
                <input
                  type="text"
                  value={perfilForm.cargo}
                  onChange={(e) => setPerfilForm({...perfilForm, cargo: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatePerfil.isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {updatePerfil.isLoading ? 'Actualizando...' : 'Actualizar Perfil'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Seguridad
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Contraseña</h4>
              <p className="text-sm text-gray-600">Cambia tu contraseña regularmente para mayor seguridad</p>
            </div>
            <button
              onClick={() => setMostrarCambioPassword(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          {proyectoSeleccionado 
            ? `Gestiona la configuración del proyecto: ${proyectoSeleccionado.nombre}`
            : 'Gestiona tu perfil y configuración del sistema'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navegación lateral */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <nav className="space-y-1">
            {[
              { id: 'proyecto', label: 'Proyecto', icon: SettingsIcon },
              { id: 'perfil', label: 'Perfil', icon: User },
              { id: 'seguridad', label: 'Seguridad', icon: Lock },
              { id: 'ayuda', label: 'Ayuda', icon: HelpCircle }
            ].map((seccion) => {
              const IconComponent = seccion.icon;
              return (
                <button
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    seccionActiva === seccion.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="mr-3 w-4 h-4" />
                  {seccion.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {seccionActiva === 'proyecto' && renderConfiguracionProyecto()}
          {seccionActiva === 'perfil' && renderPerfil()}
          {seccionActiva === 'seguridad' && renderPerfil()}
          {seccionActiva === 'ayuda' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Centro de Ayuda
              </h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">📖 Documentación</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Consulta la guía completa de usuario
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">💬 Soporte</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Contacta con nuestro equipo de soporte
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">🎥 Tutoriales</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Videos explicativos de las funcionalidades
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal cambio de contraseña */}
      {mostrarCambioPassword && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Cambiar Contraseña
              </h3>
            </div>
            
            <form onSubmit={handleCambiarPassword} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.passwordActual}
                  onChange={(e) => setPasswordForm({...passwordForm, passwordActual: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.passwordNuevo}
                  onChange={(e) => setPasswordForm({...passwordForm, passwordNuevo: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmarPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmarPassword: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarCambioPassword(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cambiarPassword.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {cambiarPassword.isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;