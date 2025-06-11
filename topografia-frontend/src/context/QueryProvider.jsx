// context/QueryProvider.jsx - El coordinador de todas las consultas de datos
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Configuración del cliente de queries para TanStack Query.
 * Esta configuración define cómo se comportará el cache y la sincronización
 * de datos en toda la aplicación.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (no necesitan refetch)
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tiempo que los datos permanecen en cache cuando no están en uso
      cacheTime: 10 * 60 * 1000, // 10 minutos
      
      // No refetch automáticamente cuando la ventana recupera el foco
      // (útil para datos de topografía que no cambian frecuentemente)
      refetchOnWindowFocus: false,
      
      // Reintentar hasta 3 veces en caso de error
      retry: 3,
      
      // Función de reintento personalizada para diferentes tipos de error
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // No refetch cuando se reconecta la red (evita spam de requests)
      refetchOnReconnect: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas una vez
      retry: 1,
      
      // Tiempo de espera para mutaciones (importante para operaciones de topografía)
      timeout: 30000, // 30 segundos
    },
  },
});

/**
 * Provider principal que envuelve la aplicación con TanStack Query.
 * Este componente debe estar cerca de la raíz de tu aplicación,
 * idealmente dentro del AuthProvider pero antes de los componentes de UI.
 */
export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo mostrar devtools en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

/**
 * Hook para acceder al cliente de queries desde cualquier componente.
 * Útil para operaciones avanzadas como invalidaciones manuales.
 */
export const useQueryClient = () => {
  return queryClient;
};

export default QueryProvider;
