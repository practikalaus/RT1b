import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add error handling for fetch operations
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    // Return a mock response to prevent unhandled promise rejections
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
