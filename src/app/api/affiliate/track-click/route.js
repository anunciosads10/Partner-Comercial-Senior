import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function POST(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    if (!body.code) return Response.json({ error: 'Campo code requerido' }, { status: 400, headers: getCorsHeaders() });

    const code = String(body.code).trim().toUpperCase();
    const firestore = getServerFirestore();
    const partnersCol = collection(firestore, 'partners');

    let partnerDocId = null;

    let snap = await getDocs(query(partnersCol, where('referralCode', '==', code)));
    if (!snap.empty) {
      partnerDocId = snap.docs[0].id;
    } else {
      const allP = await getDocs(partnersCol);
      for (const d of allP.docs) {
        if (d.id.toUpperCase().startsWith(code) || d.data().referralCode === code) {
          partnerDocId = d.id;
          break;
        }
      }
    }

    // Fallback a /users
    if (!partnerDocId) {
      const allU = await getDocs(collection(firestore, 'users'));
      for (const d of allU.docs) {
        if (d.id.toUpperCase().startsWith(code)) {
          partnerDocId = d.id;
          await setDoc(doc(firestore, 'partners', d.id), {
            name: d.data().name || 'Socio',
            email: d.data().email || '',
            referralCode: code,
            status: 'Active',
          }, { merge: true });
          break;
        }
      }
    }

    if (partnerDocId) {
      await updateDoc(doc(firestore, 'partners', partnerDocId), { clicks: increment(1) });
      return Response.json({ ok: true }, { status: 200, headers: getCorsHeaders() });
    }

    return Response.json({ ok: false, error: 'Codigo no encontrado' }, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    console.error('[API /track-click] Error:', error);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: getCorsHeaders() });
  }
}
