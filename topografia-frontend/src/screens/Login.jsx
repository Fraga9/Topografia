import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useLogin, useIsAuthenticated } from '../hooks/auth';
import { authService } from '../services';
import { Eye, EyeOff, User, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    
    const login = useLogin();
    const { isAuthenticated, loading } = useIsAuthenticated();

    // Verificar configuración de Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasValidConfig = supabaseUrl && !supabaseUrl.includes('your-project');

    // Verificar si hay bloqueo por intentos fallidos
    const isLocked = authService.loginAttempts.isLocked();
    const lockTimeRemaining = isLocked ? authService.loginAttempts.getRemainingLockTime() : 0;

    // Redirigir si ya está autenticado
    if (isAuthenticated && !loading) {
        return <Navigate to="/" replace />;
    }

    const validateForm = () => {
        const newErrors = {};

        // Validar email
        const emailValidation = authService.validateEmail(credentials.email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }

        // Validar password
        if (!credentials.password) {
            newErrors.password = 'La contraseña es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Verificar configuración antes de proceder
        if (!hasValidConfig) {
            setErrors({
                general: 'Error de configuración: Las credenciales de Supabase no están configuradas correctamente. Revisa el archivo .env'
            });
            return;
        }
        
        if (isLocked) {
            setErrors({
                general: `Cuenta bloqueada. Intenta en ${authService.formatLockoutTime(lockTimeRemaining)}`
            });
            return;
        }

        if (!validateForm()) return;

        console.log('🚀 Iniciando proceso de login...');

        try {
            await login.mutateAsync(credentials);
            // El login exitoso es manejado automáticamente por el hook
            authService.loginAttempts.reset();
        } catch (error) {
            console.error('Error en login:', error);
            
            // Incrementar intentos fallidos
            authService.loginAttempts.increment();
            
            let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Error de conexión: No se puede conectar con Supabase. Verifica la configuración de red y las credenciales.';
            } else if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
            }
            
            setErrors({
                general: errorMessage
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar errores al empezar a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">            {/* Lado izquierdo - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo CEMEX */}
                    <div className="mb-8">
                        <img
                            src="/Cemex.webp"
                            alt="CEMEX"
                            className="h-20 w-auto"
                        />
                        <h1 className="text-3xl font-light text-gray-900 mb-3">
                            Bienvenido al
                            <br />
                            <span className="font-normal">Sistema de Topografía</span>
                        </h1>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Control y cálculo de pavimentos optimizado con tecnología de precisión
                        </p>                    </div>

                    {/* Estado de configuración */}
                    {!hasValidConfig && (
                        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Configuración requerida:</strong> Las credenciales de Supabase no están configuradas. 
                                        Consulta el archivo .env para más información.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error general */}
                    {errors.general && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulario de login */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={credentials.email}
                                    onChange={handleChange}
                                    disabled={login.isPending || isLocked}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.email ? 'border-red-300' : 'border-gray-200'
                                    } ${login.isPending || isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="tu.email@ejemplo.com"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={credentials.password}
                                    onChange={handleChange}
                                    disabled={login.isPending || isLocked}
                                    className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.password ? 'border-red-300' : 'border-gray-200'
                                    } ${login.isPending || isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Contraseña"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={login.isPending || isLocked}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>                        <button
                            type="submit"
                            disabled={login.isPending || isLocked}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-2xl font-medium text-base hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {login.isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verificando credenciales...
                                </>
                            ) : isLocked ? (
                                <>
                                    <AlertCircle className="h-5 w-5" />
                                    Cuenta bloqueada
                                </>
                            ) : (
                                <>
                                    Acceder al Sistema
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">
                            &copy; 2024 CEMEX. Sistema de Topografía Avanzado v1.0
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Desarrollado con tecnología moderna
                        </p>
                    </div>
                </div>
            </div>

            {/* Lado derecho - Imagen y branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-8">
                <div className="w-full h-full relative">
                    {/* Imagen de topografía con bordes redondeados */}
                    <img
                        src="/Topografia.jpg"
                        alt="Topografía"
                        className="w-full h-full object-cover rounded-3xl"
                    />

                    {/* Overlay con blur gradual en la parte inferior */}
                    <div className="absolute inset-0 rounded-3xl">
                        {/* Gradiente que define dónde aplicar el blur */}
                        <div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)',
                                backdropFilter: 'blur(0px)'
                            }}
                        ></div>

                        {/* Capa con blur que solo afecta la parte inferior */}
                        <div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                background: 'linear-gradient(to top, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                backdropFilter: 'blur(2px)',
                                mask: 'linear-gradient(to top, black 0%, black 25%, transparent 60%)',
                                WebkitMask: 'linear-gradient(to top, black 0%, black 30%, transparent 60%)'
                            }}
                        ></div>
                    </div>

                    {/* Contenido superpuesto */}
                    <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                        <h2 className="text-2xl font-light mb-4 leading-tight drop-shadow-lg">
                            Tecnología revolucionando la forma en que
                            <span className="font-normal"> creamos, medimos y experimentamos </span>
                            proyectos.
                        </h2>
                    </div>

                    {/* Elementos decorativos flotantes */}
                    <div className="absolute top-8 right-8 w-2 h-2 bg-white/40 rounded-full"></div>
                    <div className="absolute top-16 right-16 w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="absolute top-24 right-12 w-3 h-3 bg-white/20 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};


export default Login;