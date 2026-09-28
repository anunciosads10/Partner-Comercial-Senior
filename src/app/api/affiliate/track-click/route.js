import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function POST(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    if (!body.code) return Response.json({ error: 'Campo code requerido' }, { status: 400, headers: getCorsHeaders() });

    const code = String(body.code).trim().toUpperCase();
    const platform = (body.platform || 'MENFY').toUpperCase();
    const firestore = getServerFirestore();
    const partnersCol = collection(firestore, 'partners');

    let partnerDocId = null;

    let snap = await getDocs(query(partnersCol, where('referralCode', '==', code)));
    if (!snap.empty) {
      partnerDocId = snap.docs[0].id;
    } else {
      const direct = await getDoc(doc(firestore, 'partners', code));
      if (direct.exists()) {
        partnerDocId = direct.id;
      } else {
        const allSnap = await getDocs(partnersCol);
        for (const d of allSnap.docs) {
          if (d.id.toUpperCase().startsWith(code) || (d.data().uid && d.data().uid.toUpperCase().startsWith(code))) {
            partnerDocId = d.id;
            break;
          }
        }
      }
    }

    if (partnerDocId) {
      const updateData = {
        clicks: increment(1),
        [`platformMetrics.${platform}.clicks`]: increment(1)
      };
      await updateDoc(doc(firestore, 'partners', partnerDocId), updateData);
      return Response.json({ ok: true, partner_id: partnerDocId, platform }, { status: 200, headers: getCorsHeaders() });
    }

    return Response.json({ ok: false, error: 'Codigo no encontrado' }, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    console.error('[API /track-click] Error:', error);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: getCorsHeaders() });
  }
}
