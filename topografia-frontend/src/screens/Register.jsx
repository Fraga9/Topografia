import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSignUp, useIsAuthenticated } from '../hooks/auth';
import { authService } from '../services';
import { Eye, EyeOff, User, Mail, ArrowRight, AlertCircle, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizacion: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    
    const signUp = useSignUp();
    const { isAuthenticated, loading } = useIsAuthenticated();
    const navigate = useNavigate();

    // Verificar configuración de Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasValidConfig = supabaseUrl && !supabaseUrl.includes('your-project');

    // Redirigir si ya está autenticado
    if (isAuthenticated && !loading) {
        return <Navigate to="/" replace />;
    }

    // Efecto para manejar la redirección después del registro exitoso
    useEffect(() => {
        if (registrationSuccess) {
            const timer = setTimeout(() => {
                navigate('/', { replace: true });
            }, 3000); // Redirigir después de 3 segundos

            return () => clearTimeout(timer);
        }
    }, [registrationSuccess, navigate]);

    const validateForm = () => {
        const newErrors = {};

        // Validar nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        // Validar email
        const emailValidation = authService.validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }

        // Validar password
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        // Validar confirmación de password
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        // Validar organización (opcional pero recomendado)
        if (formData.organizacion && formData.organizacion.trim().length < 2) {
            newErrors.organizacion = 'El nombre de la organización debe tener al menos 2 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Verificar configuración antes de proceder
        if (!hasValidConfig) {
            setErrors({
                general: 'Error de configuración: Las credenciales de Supabase no están configuradas correctamente. Revisa el archivo .env'
            });
            return;
        }

        if (!validateForm()) return;

        console.log('🚀 Iniciando proceso de registro...');

        try {
            const userData = {
                nombre: formData.nombre.trim(),
                organizacion: formData.organizacion.trim() || null
            };

            await signUp.mutateAsync({
                email: formData.email,
                password: formData.password,
                userData
            });

            // El registro exitoso es manejado automáticamente por el hook
            console.log('✅ Registro exitoso');
            setRegistrationSuccess(true);
            
            // Limpiar errores y mostrar mensaje de éxito
            setErrors({});
        } catch (error) {
            console.error('Error en registro:', error);
            
            let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Error de conexión: No se puede conectar con Supabase. Verifica la configuración de red y las credenciales.';
            } else if (error.message.includes('User already registered')) {
                errorMessage = 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'El formato del email no es válido.';
            } else if (error.message.includes('For security purposes, you can only request this after')) {
                const seconds = error.message.match(/(\d+) seconds/)?.[1] || '60';
                errorMessage = `Por seguridad, debes esperar ${seconds} segundos antes de intentar registrarte nuevamente.`;
            }
            
            setErrors({
                general: errorMessage
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
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
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Lado izquierdo - Formulario */}
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
                            Crear Cuenta
                            <br />
                            <span className="font-normal">Sistema de Topografía</span>
                        </h1>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Únete al sistema de control y cálculo de pavimentos más avanzado
                        </p>
                    </div>

                    {/* Botón de regreso */}
                    <div className="mb-6">
                        <Link 
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>

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

                    {/* Mensaje de éxito */}
                    {registrationSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-green-800">
                                        <strong>¡Cuenta creada exitosamente!</strong>
                                    </p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Serás redirigido al sistema en unos segundos...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error general */}
                    {errors.general && !registrationSuccess && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulario de registro */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nombre */}
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre completo *
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    disabled={signUp.isPending}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.nombre ? 'border-red-300' : 'border-gray-200'
                                    } ${signUp.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Tu nombre completo"
                                    autoComplete="name"
                                />
                            </div>
                            {errors.nombre && (
                                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={signUp.isPending}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.email ? 'border-red-300' : 'border-gray-200'
                                    } ${signUp.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="tu.email@ejemplo.com"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Organización */}
                        <div>
                            <label htmlFor="organizacion" className="block text-sm font-medium text-gray-700 mb-2">
                                Organización <span className="text-gray-400">(opcional)</span>
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <input
                                    id="organizacion"
                                    name="organizacion"
                                    type="text"
                                    value={formData.organizacion}
                                    onChange={handleChange}
                                    disabled={signUp.isPending}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.organizacion ? 'border-red-300' : 'border-gray-200'
                                    } ${signUp.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="CEMEX, Constructora ABC..."
                                    autoComplete="organization"
                                />
                            </div>
                            {errors.organizacion && (
                                <p className="mt-1 text-sm text-red-600">{errors.organizacion}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña *
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={signUp.isPending}
                                    className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.password ? 'border-red-300' : 'border-gray-200'
                                    } ${signUp.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={signUp.isPending}
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
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar contraseña *
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={signUp.isPending}
                                    className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                                        errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                                    } ${signUp.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Repite tu contraseña"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={signUp.isPending}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Botón de registro */}
                        <button
                            type="submit"
                            disabled={signUp.isPending || registrationSuccess}
                            className={`w-full py-3.5 rounded-2xl font-medium text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${
                                registrationSuccess 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white focus:ring-green-500' 
                                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500'
                            }`}
                        >
                            {registrationSuccess ? (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    ¡Cuenta creada exitosamente!
                                </>
                            ) : signUp.isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    Crear Cuenta
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link para iniciar sesión */}
                    {!registrationSuccess && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                ¿Ya tienes una cuenta?{' '}
                                <Link 
                                    to="/login" 
                                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    )}

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
                            Únete a la revolución digital en
                            <span className="font-normal"> topografía profesional </span>
                            y construcción vial.
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-white/90">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Cálculos automáticos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span>Análisis en tiempo real</span>
                            </div>
                        </div>
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

export default Register;