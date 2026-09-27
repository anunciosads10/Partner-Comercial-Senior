'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export default function AffiliateRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  React.useEffect(() => {
    const rawCode = params?.code;
    if (!rawCode) {
      router.replace('/');
      return;
    }

    const code = String(rawCode).trim().toUpperCase();

    // 1. Guardar en localStorage y Cookie por 30 días
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const payload = {
        code,
        timestamp: Date.now(),
        expiresAt: expirationDate.getTime()
      };
      
      localStorage.setItem('partnerverse_aff_code', JSON.stringify(payload));
      document.cookie = `partnerverse_aff_code=${code}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    } catch (e) {
      console.warn('[Affiliate] Error guardando cookie/localStorage:', e);
    }

    // 2. Registrar clic para el socio en Firestore y redirigir a la landing pública
    const registerClickAndRedirect = async () => {
      if (firestore) {
        try {
          const partnersRef = collection(firestore, 'partners');
          const q = query(partnersRef, where('referralCode', '==', code));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const partnerDoc = snap.docs[0];
            await updateDoc(doc(firestore, 'partners', partnerDoc.id), {
              clicks: increment(1)
            });
          }
        } catch (err) {
          console.warn('[Affiliate] Error registrando clic:', err);
        }
      }
      
      // Siempre redirige a la landing page pública (home), nunca a /login
      router.replace('/');
    };

    registerClickAndRedirect();
  }, [params, router, firestore]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground animate-pulse">Conectando con PartnerVerse...</p>
      </div>
    </div>
  );
}
