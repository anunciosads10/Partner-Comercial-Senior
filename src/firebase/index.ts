'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta para entornos de cliente y servidor.
 * Asegura que el objeto de configuración se pase explícitamente para evitar el error (app/no-options)
 * durante la generación de páginas estáticas o el proceso de build.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  // Lógica robusta para evitar re-inicialización y asegurar conectividad en build
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // Siempre pasamos la configuración explícitamente cumpliendo con la guía técnica
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
