// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getEnvironmentConfig, getCurrentEnvironment } from '@/config/environments';

const config = getEnvironmentConfig();
const currentEnv = getCurrentEnvironment();

// Create Supabase client with environment-specific configuration
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Test environment specific settings
      ...(currentEnv === 'test' && {
        autoRefreshToken: false, // Faster test execution
        detectSessionInUrl: false
      })
    },
    // Add environment identification to requests
    global: {
      headers: {
        'X-Environment': currentEnv,
        'X-Client-Version': '1.0.0'
      }
    },
    // Performance settings based on environment
    realtime: {
      params: {
        eventsPerSecond: currentEnv === 'test' ? 50 : 10
      }
    }
  }
);

// Export environment info for debugging
export const environmentInfo = {
  environment: currentEnv,
  supabaseUrl: config.supabase.url,
  apiBaseUrl: config.api.baseUrl,
  features: config.features
};

// Console log environment info in non-production
if (currentEnv !== 'production') {
  console.log('🌍 Environment:', environmentInfo);
}