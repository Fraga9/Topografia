import { useState } from 'react';
import { Eye, EyeOff, User, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        cemexId: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Credenciales hardcodeadas para desarrollo
    const DEMO_CREDENTIALS = {
        cemexId: 'TOP001',
        password: 'cemex2024'
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simular delay de autenticación
        setTimeout(() => {
            if (
                credentials.cemexId === DEMO_CREDENTIALS.cemexId &&
                credentials.password === DEMO_CREDENTIALS.password
            ) {
                onLogin({
                    id: '1',
                    cemexId: credentials.cemexId,
                    nombre: 'Juan Carlos Pérez',
                    empresa: 'CEMEX',
                    rol: 'Ingeniero Topógrafo',
                    division: 'Infraestructura'
                });
            } else {
                alert('Credenciales incorrectas. Use:\nCEMEX ID: TOP001\nPassword: cemex2024');
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
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
                            Bienvenido al
                            <br />
                            <span className="font-normal">Sistema de Topografía</span>
                        </h1>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Control y cálculo de pavimentos optimizado con tecnología de precisión
                        </p>
                    </div>

                    {/* Formulario de login */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="cemexId"
                                    name="cemexId"
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                                    placeholder="CEMEX ID"
                                    value={credentials.cemexId}
                                    onChange={handleChange}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                                    placeholder="Contraseña"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-dark-blue-600 to-dark-blue-700 text-white py-3.5 rounded-2xl font-medium text-base hover:from-dark-blue-700 hover:to-dark-blue-800 focus:outline-none focus:ring-2 focus:ring-dark-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verificando credenciales...
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
                            &copy; 2024 CEMEX. Sistema de Control de Pavimentos v1.0
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