import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment, getDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function POST(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { code: rawCode, usuario_id, email, restaurante, platform, monto, comision_pct } = body;
    if (!rawCode) return Response.json({ error: 'Campo code requerido' }, { status: 400, headers: getCorsHeaders() });

    const code = String(rawCode).trim().toUpperCase();
    const platName = (platform || 'MENFY').toUpperCase();
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
        const allP = await getDocs(partnersCol);
        for (const d of allP.docs) {
          if (d.id.toUpperCase().startsWith(code) || (d.data().referralCode && d.data().referralCode === code)) {
            partnerDocId = d.id;
            break;
          }
        }
      }
    }

    // Fallback en /users
    if (!partnerDocId) {
      const allU = await getDocs(collection(firestore, 'users'));
      for (const d of allU.docs) {
        if (d.id.toUpperCase().startsWith(code)) {
          partnerDocId = d.id;
          break;
        }
      }
    }

    if (partnerDocId) {
      const now = new Date().toISOString();
      const baseAmount = Number(monto || 150000);
      const commissionPct = Number(comision_pct || 30);
      const commissionValue = Math.round((baseAmount * commissionPct) / 100);

      // 1. Incrementar contadores en /partners
      const updateData = {
        signupsFromLink: increment(1),
        [`platformMetrics.${platName}.signups`]: increment(1)
      };
      await updateDoc(doc(firestore, 'partners', partnerDocId), updateData);

      // 2. Crear documento de restaurante en /referrals
      const refDoc = await addDoc(collection(firestore, 'referrals'), {
        partnerId: partnerDocId,
        restaurantName: restaurante || email || ('Restaurante ' + (usuario_id || '').substring(0, 6)),
        restaurantEmail: email || '',
        restaurantPhone: '',
        plan: platName + ' SaaS',
        planValue: baseAmount,
        status: 'activo',
        referralCode: code,
        externalUserId: usuario_id || '',
        createdAt: now,
        activatedAt: now,
        recurringEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Suscripción completada en plataforma externa ' + platName,
      });

      // 3. Crear transacción aprobada en /transactions (alimenta "Mis Ingresos")
      await addDoc(collection(firestore, 'transactions'), {
        partnerId: partnerDocId,
        referralId: refDoc.id,
        type: 'recurrente',
        baseAmount,
        commissionPct,
        commissionValue,
        status: 'aprobado',
        period: now.slice(0, 7),
        approvedBy: 'Sistema ' + platName + ' (API)',
        approvedAt: now,
        createdAt: now,
        description: `Comisión recurrente ${commissionPct}% suscripción ${platName}`
      });

      return Response.json({
        ok: true,
        partner_id: partnerDocId,
        platform: platName,
        commissionValue,
        status: 'aprobado'
      }, { status: 200, headers: getCorsHeaders() });
    }

    return Response.json({ ok: false, error: 'Codigo no encontrado' }, { status: 200, headers: getCorsHeaders() });
  } catch (error) {
    console.error('[API /track-conversion] Error:', error);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: getCorsHeaders() });
  }
}
