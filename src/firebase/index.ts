'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';


// This structure holds all initialized Firebase services.
type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

// Singleton to hold the initialized services.
let firebaseServices: FirebaseServices | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  // Ensure config has at least the minimum requirements to prevent crash
  // If API key is missing, we use a dummy config to allow initialization but auth will fail gracefully later
  const configToUse = firebaseConfig.apiKey ? firebaseConfig : { 
    apiKey: "missing", 
    projectId: "studio-291643778",
    authDomain: "studio-291643778.firebaseapp.com",
    storageBucket: "studio-291643778.appspot.com",
    messagingSenderId: "000000000000",
    appId: "0:000000000000:web:0000000000000000000000"
  };

  const app = getApps().length ? getApp() : initializeApp(configToUse);
  
  firebaseServices = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app),
  };
  
  return firebaseServices;
}

// Export hooks and providers for use throughout the app.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
