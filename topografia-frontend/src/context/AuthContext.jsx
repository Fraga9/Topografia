// context/AuthContext.jsx - El centro de comando de seguridad de tu aplicación
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Este contexto maneja todo lo relacionado con autenticación y autorización.
 * Piensa en él como el departamento de seguridad de tu aplicación:
 * - Sabe quién está conectado en todo momento
 * - Maneja login y logout
 * - Coordina con Supabase para mantener sesiones actualizadas
 * - Proporciona información del usuario a cualquier componente que la necesite
 */

// Crear el contexto de autenticación
const AuthContext = createContext(null);

/**
 * Provider que maneja todo el estado de autenticación.
 * Este componente debe envolver toda tu aplicación para que
 * cualquier componente pueda acceder a la información de autenticación.
 */
export const AuthProvider = ({ children }) => {
  // Estados para manejar autenticación
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  /**
   * Función para inicializar el estado de autenticación.
   * Se ejecuta cuando la aplicación se carga por primera vez
   * para verificar si ya hay una sesión activa.
   */
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Verificar si hay una sesión existente
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error obteniendo sesión inicial:', error);
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      } else {
        // Si hay sesión, configurar el estado del usuario
        setSession(session);
        setUser(session?.user || null);
        setIsAuthenticated(!!session?.user);
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);/**
   * Función para manejar cambios en el estado de autenticación.
   * Supabase llamará esta función automáticamente cuando el estado cambie
   * (login, logout, renovación de token, etc.)
   */
  const handleAuthChange = useCallback((event, session) => {
    console.log('Cambio de autenticación:', event, session?.user?.email);
    
    // Prevenir actualizaciones innecesarias comparando el estado actual
    const newUser = session?.user || null;
    const newIsAuthenticated = !!session?.user;
    
    // Solo actualizar si realmente cambió algo
    setSession(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(session)) {
        return session;
      }
      return prev;
    });
    
    setUser(prev => {
      if (prev?.id !== newUser?.id || prev?.email !== newUser?.email) {
        return newUser;
      }
      return prev;
    });
    
    setIsAuthenticated(prev => {
      if (prev !== newIsAuthenticated) {
        return newIsAuthenticated;
      }
      return prev;
    });
    
    // Si el usuario se desconectó, limpiar cualquier estado local adicional
    if (event === 'SIGNED_OUT') {
      // Aquí podrías limpiar cache local, localStorage, etc.
      console.log('Usuario desconectado, limpiando estado local...');
    }
  }, []);/**
   * Función para iniciar sesión con email y contraseña.
   * Esta función maneja el proceso completo de login y actualiza
   * automáticamente el estado de la aplicación.
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('🔐 Intentando login con:', { email, hasPassword: !!password });
        // Verificar configuración antes de intentar login
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl?.includes('your-project')) {
        // En modo desarrollo, permitir bypass si está configurado
        const devMode = import.meta.env.VITE_DEV_MODE === 'true';
        if (devMode && email === 'admin@test.com' && password === 'admin123') {
          console.log('🧪 Modo desarrollo: Login bypass activado');
          const mockUser = {
            id: 'dev-user-123',
            email: 'admin@test.com',
            user_metadata: { name: 'Usuario de Desarrollo' }
          };
          const mockSession = {
            user: mockUser,
            access_token: 'dev-token',
            refresh_token: 'dev-refresh'
          };
          
          setSession(mockSession);
          setUser(mockUser);
          setIsAuthenticated(true);
          
          return { success: true, data: { user: mockUser, session: mockSession } };
        }
        
        throw new Error('Configuración de Supabase inválida. Por favor, configura las variables de entorno en .env o usa el modo desarrollo');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Respuesta de login:', { 
        success: !error, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message 
      });

      if (error) {
        throw new Error(error.message);
      }

      // El estado se actualizará automáticamente a través del listener
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido en login' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para registrar un nuevo usuario.
   * Crea la cuenta en Supabase Auth con metadata que será usado por el trigger
   * de base de datos para crear automáticamente el perfil.
   */
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      console.log('🚀 Iniciando registro con datos:', { email, userData });
      
      // Crear usuario en Supabase Auth con metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Datos que serán guardados en raw_user_meta_data
            // y usados por el trigger de base de datos
            nombre: userData.nombre || '',
            organizacion: userData.organizacion || null,
            empresa: userData.organizacion || null, // Alias para compatibilidad
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      console.log('✅ Usuario creado en Supabase Auth:', {
        id: authData.user?.id,
        email: authData.user?.email,
        metadata: authData.user?.user_metadata
      });

      // El perfil se creará automáticamente por el trigger de base de datos
      // No necesitamos hacer llamadas adicionales a la API

      return { success: true, data: authData };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido en registro' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para cerrar sesión.
   * Limpia toda la información de sesión local y en Supabase.
   */
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      // El estado se actualizará automáticamente a través del listener
      return { success: true };
      
    } catch (error) {
      console.error('Error en logout:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido en logout' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para renovar el token de sesión.
   * Útil para mantener sesiones activas por períodos largos.
   */
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error(error.message);
      }

      return { success: true, session };
      
    } catch (error) {
      console.error('Error renovando sesión:', error);
      return { 
        success: false, 
        error: error.message || 'Error renovando sesión' 
      };
    }
  };

  /**
   * Función para obtener el token de acceso actual.
   * Útil para hacer llamadas directas a APIs que necesitan el token.
   */
  const getAccessToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return session.access_token;
      
    } catch (error) {
      console.error('Error obteniendo token de acceso:', error);
      return null;
    }
  };

  // Efecto para inicializar autenticación cuando el componente se monta
  useEffect(() => {
    initializeAuth();

    // Configurar listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Cleanup: remover listener cuando el componente se desmonta
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Valor que se proporciona a todos los componentes hijos
  const value = {
    // Estado actual
    user,
    session,
    isAuthenticated,
    loading,
    
    // Funciones de autenticación
    signIn,
    signUp,
    signOut,
    refreshSession,
    getAccessToken,
    
    // Cliente de Supabase para uso directo si es necesario
    supabase,
    
    // Información útil derivada del estado
    userEmail: user?.email,
    userId: user?.id,
    userMetadata: user?.user_metadata || {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para usar el contexto de autenticación.
 * Este hook proporciona una manera fácil y consistente de acceder
 * a la información de autenticación desde cualquier componente.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

/**
 * Hook que requiere autenticación.
 * Útil para componentes que solo deben mostrarse a usuarios autenticados.
 */
export const useRequireAuth = () => {
  const auth = useAuth();
  
  if (!auth.isAuthenticated && !auth.loading) {
    throw new Error('Este componente requiere autenticación');
  }
  
  return auth;
};

/**
 * Higher-Order Component que protege rutas que requieren autenticación.
 * Envuelve componentes que solo deben ser accesibles por usuarios autenticados.
 */
export const withAuth = (WrappedComponent) => {
  return function AuthGuardedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Verificando autenticación...</div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">
            Debes iniciar sesión para acceder a esta página.
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Export both named and default exports for flexibility
export { AuthContext };
export default AuthContext;
