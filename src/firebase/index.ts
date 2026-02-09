'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Inicializa Firebase de forma robusta para entornos de producción (SaaS).
 * Sigue estrictamente la guía para evitar el error (app/no-options) durante el build.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  // Verificamos si ya existe una instancia para evitar re-inicializaciones en caliente (HMR)
  // Siempre pasamos el objeto de configuración explícitamente para el proceso de build.
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
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

// Exportación centralizada de utilidades y hooks para evitar ciclos de importación
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
