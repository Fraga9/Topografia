// services/authService.js - Servicio de autenticación y autorización
import { supabase } from '../api/client';

/**
 * Servicio de autenticación que proporciona funciones
 * auxiliares para manejo de sesiones y permisos.
 */
export const authService = {
  /**
   * Obtiene la sesión actual del usuario
   */
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error obteniendo sesión actual:', error);
      return null;
    }
  },

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  },

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole: (user, role) => {
    return user?.user_metadata?.role === role || user?.app_metadata?.role === role;
  },

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin: (user) => {
    return authService.hasRole(user, 'admin');
  },

  /**
   * Verifica si el usuario puede acceder a un proyecto
   */
  canAccessProject: (user, projectId) => {
    // Los administradores pueden acceder a todos los proyectos
    if (authService.isAdmin(user)) return true;
    
    // Los usuarios pueden acceder a sus propios proyectos
    // Esta lógica se puede extender según las reglas de negocio
    return true;
  },

  /**
   * Obtiene los permisos del usuario
   */
  getUserPermissions: (user) => {
    const permissions = {
      canCreateProject: true,
      canEditProject: true,
      canDeleteProject: false,
      canManageUsers: false,
      canExportData: true,
      canImportData: true,
    };

    // Los administradores tienen todos los permisos
    if (authService.isAdmin(user)) {
      return {
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canManageUsers: true,
        canExportData: true,
        canImportData: true,
      };
    }

    return permissions;
  },

  /**
   * Formatea la información del usuario para mostrar
   */
  formatUserInfo: (user) => {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: user.user_metadata?.role || user.app_metadata?.role || 'user',
      avatar: user.user_metadata?.avatar_url,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
    };
  },

  /**
   * Verifica si la sesión está cerca de expirar
   */
  isSessionExpiring: (session, minutesThreshold = 5) => {
    if (!session || !session.expires_at) return false;
    
    const expirationTime = session.expires_at * 1000; // Convertir a millisegundos
    const currentTime = Date.now();
    const thresholdTime = minutesThreshold * 60 * 1000; // Convertir minutos a millisegundos
    
    return (expirationTime - currentTime) <= thresholdTime;
  },

  /**
   * Configura listeners para cambios de autenticación
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Valida el formato de email
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida si un email tiene formato correcto
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      message: emailRegex.test(email) ? '' : 'Formato de email inválido'
    };
  },

  /**
   * Valida la fortaleza de una contraseña
   */
  validatePassword: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const issues = [];
    
    if (password.length < minLength) {
      issues.push(`Debe tener al menos ${minLength} caracteres`);
    }
    if (!hasUpperCase) {
      issues.push('Debe incluir al menos una letra mayúscula');
    }
    if (!hasLowerCase) {
      issues.push('Debe incluir al menos una letra minúscula');
    }
    if (!hasNumbers) {
      issues.push('Debe incluir al menos un número');
    }
    if (!hasSpecialChar) {
      issues.push('Debe incluir al menos un carácter especial');
    }

    return {
      isValid: issues.length === 0,
      strength: authService.calculatePasswordStrength(password),
      issues
    };
  },

  /**
   * Calcula la fortaleza de una contraseña
   */
  calculatePasswordStrength: (password) => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;
    
    if (score <= 2) return 'DÉBIL';
    if (score <= 4) return 'MEDIA';
    if (score <= 5) return 'FUERTE';
    return 'MUY_FUERTE';
  },

  /**
   * Verifica si un token JWT está expirado
   */
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error verificando token:', error);
      return true;
    }
  },

  /**
   * Gestiona intentos de login fallidos por usuario específico
   */
  loginAttempts: {
    keyPrefix: 'topografia_login_attempts_',
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    
    getKey: (email) => {
      // Crear una clave específica para cada email
      return `${authService.loginAttempts.keyPrefix}${btoa(email.toLowerCase())}`;
    },
    
    get: (email) => {
      if (!email) return { count: 0, lastAttempt: null };
      
      try {
        const key = authService.loginAttempts.getKey(email);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : { count: 0, lastAttempt: null };
      } catch {
        return { count: 0, lastAttempt: null };
      }
    },
    
    increment: (email) => {
      if (!email) return { count: 0, lastAttempt: null };
      
      const attempts = authService.loginAttempts.get(email);
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      
      const key = authService.loginAttempts.getKey(email);
      localStorage.setItem(key, JSON.stringify(attempts));
      return attempts;
    },
    
    reset: (email) => {
      if (!email) return;
      
      const key = authService.loginAttempts.getKey(email);
      localStorage.removeItem(key);
    },
    
    isLocked: (email) => {
      if (!email) return false;
      
      const attempts = authService.loginAttempts.get(email);
      if (attempts.count < authService.loginAttempts.maxAttempts) return false;
      
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < authService.loginAttempts.lockoutDuration;
    },
    
    getRemainingLockTime: (email) => {
      if (!email) return 0;
      
      const attempts = authService.loginAttempts.get(email);
      if (attempts.count < authService.loginAttempts.maxAttempts) return 0;
      
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      const remainingTime = authService.loginAttempts.lockoutDuration - timeSinceLastAttempt;
      
      return Math.max(0, remainingTime);
    },
    
    // Función para limpiar todos los bloqueos (útil para debugging)
    clearAll: () => {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(authService.loginAttempts.keyPrefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
    }
  },

  /**
   * Formatea el tiempo de bloqueo restante en un formato legible
   */
  formatLockoutTime: (remainingTime) => {
    if (remainingTime <= 0) return '0 segundos';
    
    const minutes = Math.floor(remainingTime / (60 * 1000));
    const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  },

  /**
   * Limpia datos sensibles del localStorage
   */
  clearSensitiveData: () => {
    const keysToRemove = [
      'supabase.auth.token',
      'user-preferences',
      'cached-user-data',
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
