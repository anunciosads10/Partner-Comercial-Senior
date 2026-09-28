import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment, getDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function POST(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { code: rawCode, usuario_id, email, restaurante, platform, monto, comision_pct, plan_id } = body;
    if (!rawCode) return Response.json({ error: 'Campo code requerido' }, { status: 400, headers: getCorsHeaders() });

    const code = String(rawCode).trim().toUpperCase();
    const platName = (platform || 'MENFY').toUpperCase();
    const firestore = getServerFirestore();
    const partnersCol = collection(firestore, 'partners');

    // 1. Localizar socio
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

    if (!partnerDocId) {
      return Response.json({ ok: false, error: 'Codigo no encontrado' }, { status: 200, headers: getCorsHeaders() });
    }

    // 2. Localizar catálogo de la plataforma para verificar planes
    const platformsSnap = await getDocs(collection(firestore, 'saasPlatforms'));
    let matchedPlatform = null;
    for (const pDoc of platformsSnap.docs) {
      const pData = pDoc.data();
      if (
        pDoc.id.toUpperCase() === platName ||
        (pData.name && pData.name.toUpperCase() === platName) ||
        (pData.slug && pData.slug.toUpperCase() === platName)
      ) {
        matchedPlatform = { id: pDoc.id, ...pData };
        break;
      }
    }

    const platformPlanes = matchedPlatform?.planes;
    const hasPlanes = Array.isArray(platformPlanes) && platformPlanes.length > 0;

    let baseAmount = Number(monto || 150000);
    let planNombre = null;
    let selectedPlanId = plan_id || null;
    const montoReportado = monto !== undefined ? Number(monto) : null;

    if (hasPlanes) {
      // Si la plataforma tiene planes oficiales:
      if (!plan_id) {
        return Response.json({
          error: 'La plataforma cuenta con planes oficiales. Debe especificar plan_id válido.'
        }, { status: 400, headers: getCorsHeaders() });
      }

      const foundPlan = platformPlanes.find(p => p.id === plan_id || p.id === String(plan_id).trim());
      if (!foundPlan) {
        return Response.json({
          error: 'Plan no válido para esta plataforma'
        }, { status: 400, headers: getCorsHeaders() });
      }

      // Usar obligatoriamente el precio oficial del plan
      baseAmount = Number(foundPlan.precio);
      planNombre = foundPlan.nombre;
    } else {
      // Retrocompatibilidad para plataformas sin planes
      if (plan_id) {
        return Response.json({
          error: 'Plan no válido para esta plataforma'
        }, { status: 400, headers: getCorsHeaders() });
      }
    }

    const now = new Date().toISOString();
    const commissionPct = Number(comision_pct || matchedPlatform?.recurringCommission || matchedPlatform?.baseCommission || 30);
    const commissionValue = Math.round((baseAmount * commissionPct) / 100);

    // 3. Incrementar contadores en /partners
    const updateData = {
      signupsFromLink: increment(1),
      [`platformMetrics.${platName}.signups`]: increment(1)
    };
    await updateDoc(doc(firestore, 'partners', partnerDocId), updateData);

    // 4. Crear documento en /referrals
    const refDoc = await addDoc(collection(firestore, 'referrals'), {
      partnerId: partnerDocId,
      restaurantName: restaurante || email || ('Restaurante ' + (usuario_id || '').substring(0, 6)),
      restaurantEmail: email || '',
      restaurantPhone: '',
      plan: planNombre || (platName + ' SaaS'),
      planId: selectedPlanId,
      planValue: baseAmount,
      monto_oficial: baseAmount,
      monto_reportado: montoReportado,
      status: 'activo',
      referralCode: code,
      externalUserId: usuario_id || '',
      createdAt: now,
      activatedAt: now,
      recurringEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Suscripción ' + platName + (planNombre ? ' [' + planNombre + ']' : ''),
    });

    // 5. Crear transacción aprobada en /transactions
    await addDoc(collection(firestore, 'transactions'), {
      partnerId: partnerDocId,
      referralId: refDoc.id,
      type: 'recurrente',
      baseAmount,
      monto_oficial: baseAmount,
      monto_reportado: montoReportado,
      planId: selectedPlanId,
      planNombre: planNombre,
      commissionPct,
      commissionValue,
      status: 'aprobado',
      period: now.slice(0, 7),
      approvedBy: 'Sistema ' + platName + ' (API)',
      approvedAt: now,
      createdAt: now,
      description: `Comisión recurrente ${commissionPct}% suscripción ${platName}${planNombre ? ' (' + planNombre + ')' : ''}`
    });

    return Response.json({
      ok: true,
      partner_id: partnerDocId,
      platform: platName,
      plan_id: selectedPlanId,
      plan_nombre: planNombre,
      monto_oficial: baseAmount,
      monto_reportado: montoReportado,
      commissionValue,
      status: 'aprobado'
    }, { status: 200, headers: getCorsHeaders() });

  } catch (error) {
    console.error('[API /track-conversion] Error:', error);
    return Response.json({ ok: false, error: 'Error interno: ' + (error?.message || error) }, { status: 500, headers: getCorsHeaders() });
  }
}
