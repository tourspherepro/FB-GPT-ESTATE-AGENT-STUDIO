'use client';

/**
 * Firebase configuration object.
 * 
 * This file attempts to parse the system-provided configuration strings 
 * used by Firebase App Hosting and Studio, falling back to individual variables.
 */

const getFirebaseConfig = () => {
  // 1. Try to parse system-provided config (common in App Hosting/Studio)
  const systemConfig = 
    process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG || 
    process.env.NEXT_PUBLIC_FIREBASE_CONFIG ||
    process.env.FIREBASE_CONFIG;
  
  let config: any = {};

  if (systemConfig) {
    try {
      const parsed = typeof systemConfig === 'string' ? JSON.parse(systemConfig) : systemConfig;
      if (parsed.apiKey) {
        config = parsed;
      }
    } catch (e) {
      // Silently fail here as we have fallbacks
    }
  }

  // 2. Fallback/Merge with individual environment variables
  const envConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Merge: Prioritize systemConfig if valid, else use individual variables
  const finalConfig = {
    ...envConfig,
    ...config,
  };

  // Clean up undefined values
  Object.keys(finalConfig).forEach(key => {
    if (finalConfig[key as keyof typeof finalConfig] === undefined) {
      delete finalConfig[key as keyof typeof finalConfig];
    }
  });

  return finalConfig;
};

export const firebaseConfig = getFirebaseConfig();

// Diagnostics for developers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const diagnostics = {
        apiKey: firebaseConfig.apiKey ? 'PRESENT' : 'MISSING',
        authDomain: firebaseConfig.authDomain ? 'PRESENT' : 'MISSING',
        projectId: firebaseConfig.projectId ? 'PRESENT' : 'MISSING',
        appId: firebaseConfig.appId ? 'PRESENT' : 'MISSING',
    };
    
    if (!firebaseConfig.apiKey) {
      console.warn("Firebase API Key is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in .env.local");
    } else {
      console.log("Firebase Configuration Loaded Successfully");
    }
}
