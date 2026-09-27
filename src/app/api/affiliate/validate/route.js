import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function GET(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code');
  if (!rawCode) return Response.json({ valido: false }, { status: 200, headers: getCorsHeaders() });

  const code = rawCode.trim().toUpperCase();

  try {
    const firestore = getServerFirestore();
    const partnersCol = collection(firestore, 'partners');

    // 1. Buscar en /partners por referralCode
    let snap = await getDocs(query(partnersCol, where('referralCode', '==', code)));
    if (!snap.empty) {
      const p = snap.docs[0].data();
      const isActive = p.status !== 'Inactive' && p.status !== 'Suspended';
      return Response.json({ valido: isActive, partner_id: snap.docs[0].id, plataforma: 'MENFY' }, { status: 200, headers: getCorsHeaders() });
    }

    // 2. Buscar en /partners por ID o prefijo
    const allPartners = await getDocs(partnersCol);
    for (const d of allPartners.docs) {
      const p = d.data();
      if (d.id.toUpperCase().startsWith(code) || (p.referralCode && p.referralCode === code)) {
        const isActive = p.status !== 'Inactive' && p.status !== 'Suspended';
        return Response.json({ valido: isActive, partner_id: d.id, plataforma: 'MENFY' }, { status: 200, headers: getCorsHeaders() });
      }
    }

    // 3. Fallback en /users (por si se registró en la web)
    const usersCol = collection(firestore, 'users');
    const allUsers = await getDocs(usersCol);
    for (const d of allUsers.docs) {
      const u = d.data();
      if (d.id.toUpperCase().startsWith(code)) {
        // Inicializar de forma transparente en /partners
        await setDoc(doc(firestore, 'partners', d.id), {
          name: u.name || 'Socio',
          email: u.email || '',
          referralCode: code,
          status: 'Active',
          tier: 'Silver',
        }, { merge: true });

        return Response.json({ valido: true, partner_id: d.id, plataforma: 'MENFY' }, { status: 200, headers: getCorsHeaders() });
      }
    }

    return Response.json({ valido: false }, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    console.error('[API /validate] Error:', error);
    return Response.json({ valido: false }, { status: 200, headers: getCorsHeaders() });
  }
}
