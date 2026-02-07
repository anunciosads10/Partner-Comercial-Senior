'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta para entornos de cliente y servidor.
 * Evita errores de "app/no-options" durante la generación estática de Next.js.
 */
export function initializeFirebase() {
  // Verificamos si ya hay aplicaciones inicializadas para evitar duplicados en HMR
  // Durante el build, esto asegura que se use la configuración explícita proporcionada.
  let firebaseApp: FirebaseApp;
  
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // Si no hay configuración disponible (caso raro en build estático sin envs), 
    // lanzamos un error descriptivo, pero aquí usamos el objeto importado directamente.
    if (!firebaseConfig.apiKey) {
      console.warn("Firebase Config: API Key no detectada. Verifique src/firebase/config.ts");
    }
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}

// Exportación centralizada de utilidades y hooks
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
