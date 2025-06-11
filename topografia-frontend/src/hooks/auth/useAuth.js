// hooks/auth/useAuth.js - Simple auth hooks that use the AuthContext
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth as useAuthContext } from '../../context/AuthContext';

/**
 * Main auth hook - re-export from context
 */
export const useAuth = useAuthContext;

/**
 * Hook for login with mutation support
 */
export const useLogin = () => {
  const { signIn } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const result = await signIn(email, password);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    
    onError: (error) => {
      console.error('Error en login:', error.message);
    }
  });
};

/**
 * Hook for signup with mutation support
 */
export const useSignUp = () => {
  const { signUp } = useAuthContext();
  
  return useMutation({
    mutationFn: async ({ email, password, userData = {} }) => {
      const result = await signUp(email, password, userData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    
    onError: (error) => {
      console.error('Error en registro:', error.message);
    }
  });
};

/**
 * Hook for logout with mutation support
 */
export const useLogout = () => {
  const { signOut } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const result = await signOut();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    
    onSuccess: () => {
      queryClient.clear();
    },
    
    onError: (error) => {
      console.error('Error en logout:', error.message);
    }
  });
};

/**
 * Hook for password reset
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      // This would call a password reset function
      // For now, just simulate it
      console.log('Password reset request for:', email);
      return { success: true };
    }
  });
};

/**
 * Hook for password update
 */
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async ({ password }) => {
      // This would call a password update function
      console.log('Password update request');
      return { success: true };
    }
  });
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated, loading } = useAuthContext();
  return { isAuthenticated, loading };
};

/**
 * Hook to get access token
 */
export const useAccessToken = () => {
  const { getAccessToken } = useAuthContext();
  return { getAccessToken };
};

/**
 * Hook to refresh session
 */
export const useRefreshSession = () => {
  const { refreshSession } = useAuthContext();
  return useMutation({
    mutationFn: refreshSession
  });
};
