// lib/supabase.js - Cliente único de Supabase para toda la aplicación
import { createClient } from '@supabase/supabase-js';

// Validación de configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuración de Supabase:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isPlaceholder: supabaseUrl?.includes('your-project')
});

// Verificar si la configuración es válida
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.error('❌ ERROR: Configuración de Supabase inválida. Por favor, configura las variables de entorno en .env');
  console.error('Variables requeridas:');
  console.error('- VITE_SUPABASE_URL (actualmente:', supabaseUrl, ')');
  console.error('- VITE_SUPABASE_ANON_KEY (presente:', !!supabaseAnonKey, ')');
}

// Cliente único de Supabase para toda la aplicación
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;
