'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta para entornos de cliente y servidor.
 * Sigue la guía para evitar el error (app/no-options) pasando explícitamente la configuración.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  // Lógica para que funcione tanto en Local como en Server
  // Si ya existe una app iniciada, úsala. Si no, inicialízala con la config explícitamente.
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // Validamos que la configuración sea válida antes de intentar inicializar
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase Config Error: Credenciales no encontradas en config.ts");
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
