// hooks/usuarios/useUsuarios.js - El especialista en gestión de usuarios
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { queryKeys } from '../../utils/queryKeys';
import { CACHE_TIMES } from '../../utils/constants';

/**
 * Hook para obtener la lista de usuarios.
 * 
 * Este hook es especialmente útil para administradores que necesitan
 * gestionar usuarios del sistema. Incluye filtros y paginación.
 */
export const useUsuarios = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.usuario.list(filters),

    queryFn: async () => {
      const url = filters && Object.keys(filters).length > 0
        ? `${endpoints.usuarios.getAll()}?${new URLSearchParams(filters)}`
        : endpoints.usuarios.getAll();

      return await apiClient.get(url);
    },

    // Configuración específica para usuarios
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutos
    cacheTime: CACHE_TIMES.LONG, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 3,

    onError: (error) => {
      console.error('Error obteniendo usuarios:', error);
    }
  });
};

/**
 * Hook para obtener un usuario específico por ID.
 */
export const useUsuario = (usuarioId) => {
  return useQuery({
    queryKey: queryKeys.usuario.detail(usuarioId),

    queryFn: async () => {
      return await apiClient.get(endpoints.usuarios.getById(usuarioId));
    },

    enabled: !!usuarioId,
    staleTime: CACHE_TIMES.LONG, // 10 minutos

    onError: (error) => {
      console.error(`Error obteniendo usuario ${usuarioId}:`, error);
    }
  });
};

/**
 * Hook para obtener el perfil del usuario actual.
 * ✅ CORREGIDO: Usa queryKeys.usuario.me() que SÍ existe en tu estructura
 */
export const usePerfilUsuario = () => {
  return useQuery({
    // ✅ CORRECCIÓN: Cambiar profile() por me()
    queryKey: queryKeys.usuario.me(),

    queryFn: async () => {
      return await apiClient.get(endpoints.usuarios.getProfile());
    },

    staleTime: CACHE_TIMES.MEDIUM, // 5 minutos
    cacheTime: CACHE_TIMES.LONG, // 10 minutos
    refetchOnWindowFocus: true, // Refrescar al volver a la ventana

    onError: (error) => {
      console.error('Error obteniendo perfil de usuario:', error);
    }
  });
};

/**
 * Hook para crear un nuevo usuario.
 * Solo disponible para administradores.
 */
export const useCreateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoUsuario) => {
      return await apiClient.post(endpoints.usuarios.create(), nuevoUsuario);
    },

    onSuccess: (data) => {
      // Invalidar listas de usuarios
      queryClient.invalidateQueries({ queryKey: queryKeys.usuario.lists() });

      // Agregar al cache de detalles
      queryClient.setQueryData(queryKeys.usuario.detail(data.id), data);

      console.log('Usuario creado exitosamente:', data.email);
    },

    onError: (error) => {
      console.error('Error creando usuario:', error);
    }
  });
};

/**
 * Hook para actualizar un usuario existente.
 */
export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, datosActualizados }) => {
      return await apiClient.put(
        endpoints.usuarios.update(usuarioId),
        datosActualizados
      );
    },

    onMutate: async ({ usuarioId, datosActualizados }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: queryKeys.usuario.detail(usuarioId) });

      // Snapshot del valor anterior
      const previousUsuario = queryClient.getQueryData(queryKeys.usuario.detail(usuarioId));

      // Update optimista
      queryClient.setQueryData(queryKeys.usuario.detail(usuarioId), old => ({
        ...old,
        ...datosActualizados,
        fecha_actualizacion: new Date().toISOString()
      }));

      return { previousUsuario, usuarioId };
    },

    onError: (err, variables, context) => {
      // Revertir cambios en caso de error
      if (context?.previousUsuario) {
        queryClient.setQueryData(
          queryKeys.usuario.detail(context.usuarioId),
          context.previousUsuario
        );
      }
    },

    onSettled: (data, error, { usuarioId }) => {
      // Invalidar para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: queryKeys.usuario.detail(usuarioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.usuario.lists() });
    }
  });
};

// ✅ También corregir useUpdatePerfil para consistencia
export const useUpdatePerfil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datosActualizados) => {
      return await apiClient.put(endpoints.usuarios.updateProfile(), datosActualizados);
    },

    onSuccess: (data) => {
      // ✅ CORRECCIÓN: Usar me() en lugar de profile()
      queryClient.setQueryData(queryKeys.usuario.me(), data);

      // Invalidar listas que podrían mostrar este usuario
      queryClient.invalidateQueries({ queryKey: queryKeys.usuario.lists() });

      console.log('Perfil actualizado exitosamente');
    },

    onError: (error) => {
      console.error('Error actualizando perfil:', error);
    }
  });
};

/**
 * Hook para eliminar un usuario.
 * Solo disponible para administradores.
 */
export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usuarioId) => {
      return await apiClient.delete(endpoints.usuarios.delete(usuarioId));
    },

    onSuccess: (data, usuarioId) => {
      // Remover del cache de detalles
      queryClient.removeQueries({ queryKey: queryKeys.usuario.detail(usuarioId) });

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: queryKeys.usuario.lists() });

      console.log('Usuario eliminado exitosamente');
    },

    onError: (error) => {
      console.error('Error eliminando usuario:', error);
    }
  });
};

/**
 * Hook para cambiar la contraseña del usuario actual.
 */
export const useCambiarPassword = () => {
  return useMutation({
    mutationFn: async ({ passwordActual, passwordNuevo }) => {
      return await apiClient.post(endpoints.usuarios.changePassword(), {
        current_password: passwordActual,
        new_password: passwordNuevo
      });
    },

    onSuccess: () => {
      console.log('Contraseña cambiada exitosamente');
    },

    onError: (error) => {
      console.error('Error cambiando contraseña:', error);
    }
  });
};

/**
 * Hook para obtener usuarios por proyecto.
 * Útil para mostrar colaboradores de un proyecto específico.
 */
export const useUsuariosPorProyecto = (proyectoId) => {
  return useQuery({
    queryKey: queryKeys.usuario.byProject(proyectoId),

    queryFn: async () => {
      return await apiClient.get(endpoints.usuarios.getByProject(proyectoId));
    },

    enabled: !!proyectoId,
    staleTime: CACHE_TIMES.MEDIUM,

    onError: (error) => {
      console.error(`Error obteniendo usuarios del proyecto ${proyectoId}:`, error);
    }
  });
};
