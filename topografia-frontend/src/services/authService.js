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
   * Gestiona intentos de login fallidos
   */
  loginAttempts: {
    key: 'topografia_login_attempts',
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    
    get: () => {
      try {
        const stored = localStorage.getItem(authService.loginAttempts.key);
        return stored ? JSON.parse(stored) : { count: 0, lastAttempt: null };
      } catch {
        return { count: 0, lastAttempt: null };
      }
    },
    
    increment: () => {
      const attempts = authService.loginAttempts.get();
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      
      localStorage.setItem(authService.loginAttempts.key, JSON.stringify(attempts));
      return attempts;
    },
    
    reset: () => {
      localStorage.removeItem(authService.loginAttempts.key);
    },
    
    isLocked: () => {
      const attempts = authService.loginAttempts.get();
      if (attempts.count < authService.loginAttempts.maxAttempts) return false;
      
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < authService.loginAttempts.lockoutDuration;
    }
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
