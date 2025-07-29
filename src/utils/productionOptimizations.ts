// Performance optimization: Remove console logs in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.error = (...args) => {
    // Keep errors for debugging critical issues
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('CRITICAL') || arg.includes('FATAL'))
    )) {
      // Allow critical errors through
      const originalError = console.error;
      originalError.apply(console, args);
    }
  };
}

export {};
