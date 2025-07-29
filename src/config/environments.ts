// Environment configuration for different deployment stages
export type Environment = 'development' | 'test' | 'production';

export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enableDebugMode: boolean;
    enablePerformanceMonitoring: boolean;
  };
  services: {
    resend: {
      apiKey?: string;
      fromEmail: string;
    };
    monitoring: {
      enabled: boolean;
      endpoint?: string;
    };
  };
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    supabase: {
      url: "https://cqlbidkagiknfplzbwse.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA"
    },
    api: {
      baseUrl: "http://localhost:8080",
      timeout: 30000
    },
    features: {
      enableAnalytics: false,
      enableErrorReporting: false,
      enableDebugMode: true,
      enablePerformanceMonitoring: false
    },
    services: {
      resend: {
        fromEmail: "dev@managementpn.services"
      },
      monitoring: {
        enabled: false
      }
    }
  },
  test: {
    supabase: {
      url: "https://TEST_SUPABASE_PROJECT_ID.supabase.co", // Will be replaced during setup
      anonKey: "TEST_SUPABASE_ANON_KEY" // Will be replaced during setup
    },
    api: {
      baseUrl: "https://test.managementpn.services",
      timeout: 15000
    },
    features: {
      enableAnalytics: false,
      enableErrorReporting: true,
      enableDebugMode: true,
      enablePerformanceMonitoring: true
    },
    services: {
      resend: {
        fromEmail: "test@managementpn.services"
      },
      monitoring: {
        enabled: true,
        endpoint: "https://test.managementpn.services/api/monitoring"
      }
    }
  },
  production: {
    supabase: {
      url: "https://cqlbidkagiknfplzbwse.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA"
    },
    api: {
      baseUrl: "https://managementpn.services",
      timeout: 10000
    },
    features: {
      enableAnalytics: true,
      enableErrorReporting: true,
      enableDebugMode: false,
      enablePerformanceMonitoring: true
    },
    services: {
      resend: {
        fromEmail: "noreply@managementpn.services"
      },
      monitoring: {
        enabled: true,
        endpoint: "https://managementpn.services/api/monitoring"
      }
    }
  }
};

// Get current environment from window location or build mode
export function getCurrentEnvironment(): Environment {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('test.') || hostname.includes('staging.')) {
      return 'test';
    }
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    
    return 'production';
  }
  
  // Fallback for SSR or build time
  const buildMode = import.meta.env.MODE;
  if (buildMode === 'test' || buildMode === 'staging') {
    return 'test';
  }
  if (buildMode === 'development') {
    return 'development';
  }
  return 'production';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  return environments[env];
}

export function isTestEnvironment(): boolean {
  return getCurrentEnvironment() === 'test';
}

export function isDevelopmentEnvironment(): boolean {
  return getCurrentEnvironment() === 'development';
}

export function isProductionEnvironment(): boolean {
  return getCurrentEnvironment() === 'production';
}