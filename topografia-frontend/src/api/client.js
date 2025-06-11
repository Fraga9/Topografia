// api/client.js - El corazón de la comunicación con tu backend
import axios from 'axios';
import { supabase } from '../lib/supabase';

/**
 * Piensa en esta clase como el "departamento de comunicaciones" de tu aplicación.
 * Se encarga de todas las llamadas al exterior (tu API FastAPI) y maneja
 * automáticamente cosas complicadas como autenticación y manejo de errores.
 * 
 * Es como tener un secretario extremadamente competente que sabe exactamente
 * cómo comunicarse con cada departamento externo y nunca se olvida de
 * presentar las credenciales correctas.
 */
class ApiClient {
  constructor() {
    // Usar el cliente de Supabase compartido para obtener tokens de autenticación
    this.supabase = supabase;

    // Luego configuramos nuestro cliente HTTP principal
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      timeout: 15000, // 15 segundos - importante para operaciones de topografía que pueden ser complejas
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Finalmente configuramos los interceptors que harán el trabajo automático
    this.setupInterceptors();
  }

  /**
   * Los interceptors son como asistentes automáticos que trabajan behind-the-scenes.
   * El interceptor de request es como un asistente que revisa cada carta antes
   * de enviarla para asegurarse de que tenga el sello correcto y la dirección completa.
   * El interceptor de response es como un asistente que revisa cada respuesta
   * que llega para decidir si necesita acción inmediata o manejo especial.
   */
  setupInterceptors() {
    // Interceptor de REQUEST: Se ejecuta antes de cada llamada al servidor
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Intentamos obtener la sesión actual de Supabase
          const { data: { session }, error } = await this.supabase.auth.getSession();
          
          if (error) {
            console.warn('Error obteniendo sesión de Supabase:', error.message);
          }
          
          // Si tenemos un token válido, lo agregamos automáticamente
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
          
          // Agregamos timestamp para debugging en desarrollo
          if (import.meta.env.DEV) {
            config.headers['X-Request-Time'] = new Date().toISOString();
          }
          
          return config;
        } catch (error) {
          console.error('Error en interceptor de request:', error);
          return config; // Continuamos incluso si hay error en autenticación
        }
      },
      (error) => {
        // Si hay error antes de hacer la request, lo reportamos
        console.error('Error preparando request:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de RESPONSE: Se ejecuta después de cada respuesta del servidor
    this.client.interceptors.response.use(
      (response) => {
        // Para respuestas exitosas, simplemente las pasamos
        // Aquí podrías agregar logging o transformación de datos si es necesario
        return response;
      },
      async (error) => {
        // Aquí manejamos diferentes tipos de errores de manera inteligente
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Si tenemos un error 401 (no autorizado), intentamos renovar el token
          originalRequest._retry = true;
          
          try {
            const { data: { session }, error: refreshError } = await this.supabase.auth.refreshSession();
            
            if (refreshError || !session) {
              // Si no podemos renovar, redirigimos al login
              this.handleAuthError();
              return Promise.reject(error);
            }
            
            // Si pudimos renovar, reintentamos la request original
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return this.client(originalRequest);
            
          } catch (refreshError) {
            console.error('Error renovando token:', refreshError);
            this.handleAuthError();
            return Promise.reject(error);
          }
        }
        
        // Para otros errores, los pasamos con información adicional útil
        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  /**
   * Esta función maneja errores de autenticación redirigiendo al usuario
   * a la página de login y limpiando cualquier estado local corrupto.
   */
  handleAuthError() {
    // Limpiar el estado de autenticación
    this.supabase.auth.signOut();
    
    // En una aplicación real, aquí redirigirías al login
    // Por ejemplo: window.location.href = '/login';
    console.warn('Sesión expirada, redirigiendo al login...');
  }

  /**
   * Esta función enriquece los errores con información útil para debugging
   * y para mostrar mensajes apropiados al usuario.
   */
  enhanceError(error) {
    // Creamos un objeto de error mejorado
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isServerError: error.response?.status >= 500,
      isClientError: error.response?.status >= 400 && error.response?.status < 500,
      statusCode: error.response?.status,
      message: this.getErrorMessage(error)
    };

    return enhancedError;
  }

  /**
   * Convierte errores técnicos en mensajes comprensibles para los usuarios.
   * Esto es especialmente importante en aplicaciones de topografía donde
   * los usuarios pueden no ser técnicos pero necesitan entender qué salió mal.
   */
  getErrorMessage(error) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.detail || error.response.data?.message;

    switch (status) {
      case 400:
        return serverMessage || 'Los datos enviados no son válidos.';
      case 401:
        return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 422:
        return serverMessage || 'Los datos enviados contienen errores de validación.';
      case 500:
        return 'Error interno del servidor. Por favor intenta más tarde.';
      default:
        return serverMessage || `Error del servidor (${status}). Por favor intenta más tarde.`;
    }
  }

  // Métodos públicos para hacer llamadas HTTP
  // Cada método está diseñado para ser simple de usar desde los hooks

  /**
   * GET request - Para obtener datos
   * Ejemplo: await apiClient.get('/proyectos/')
   */
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }

  /**
   * POST request - Para crear nuevos recursos
   * Ejemplo: await apiClient.post('/proyectos/', nuevoProyecto)
   */
  async post(url, data = {}, config = {}) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * PUT request - Para actualizar recursos completos
   * Ejemplo: await apiClient.put('/proyectos/1', proyectoActualizado)
   */
  async put(url, data = {}, config = {}) {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH request - Para actualizar recursos parcialmente
   * Ejemplo: await apiClient.patch('/proyectos/1', { nombre: 'Nuevo nombre' })
   */
  async patch(url, data = {}, config = {}) {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  /**
   * DELETE request - Para eliminar recursos
   * Ejemplo: await apiClient.delete('/proyectos/1')
   */
  async delete(url, config = {}) {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Creamos y exportamos una instancia única del cliente
// Esto implementa el patrón Singleton para asegurar que toda la aplicación
// use la misma configuración y estado de cliente
const apiClientInstance = new ApiClient();

export const apiClient = apiClientInstance;
export default apiClientInstance;

// Re-export the shared supabase client for convenience
export { supabase } from '../lib/supabase';
