import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() { return handleOptions(); }

export async function POST(request) {
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { code: rawCode, usuario_id, email, restaurante, platform, monto, comision_pct, plan_id, plan } = body;
    if (!rawCode) return Response.json({ error: 'Campo code requerido' }, { status: 400, headers: getCorsHeaders() });

    const code = String(rawCode).trim().toUpperCase();
    const platName = (platform || 'MENFY').toUpperCase();
    const firestore = getServerFirestore();
    const partnersCol = collection(firestore, 'partners');

    // 1. Localizar socio por referralCode, ID directo o prefijo
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

    if (!partnerDocId) {
      return Response.json({ ok: false, error: 'Codigo no encontrado' }, { status: 200, headers: getCorsHeaders() });
    }

    // 2. Localizar plataforma en saasPlatforms
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

    const platformPlanes = matchedPlatform?.planes || [];
    let baseAmount = Number(monto || 150000);
    let planNombre = plan || 'MENFY Estándar';
    let selectedPlanId = plan_id || 'menfy_plan';
    const montoReportado = monto !== undefined ? Number(monto) : null;

    // Resolución inteligente: si existen planes, buscar por ID, nombre o precio
    if (platformPlanes.length > 0) {
      let foundPlan = null;
      if (plan_id) {
        foundPlan = platformPlanes.find(p => p.id === plan_id || p.id === String(plan_id).trim() || p.nombre?.toLowerCase() === String(plan_id).toLowerCase());
      }
      if (!foundPlan && monto) {
        foundPlan = platformPlanes.find(p => Number(p.precio) === Number(monto));
      }
      if (!foundPlan) {
        // Fallback al primer plan del catálogo oficial
        foundPlan = platformPlanes[0];
      }

      if (foundPlan) {
        baseAmount = Number(foundPlan.precio);
        planNombre = foundPlan.nombre;
        selectedPlanId = foundPlan.id;
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
      plan: planNombre,
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
      notes: 'Suscripción ' + platName + ' [' + planNombre + ']',
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
      description: `Comisión recurrente ${commissionPct}% suscripción ${platName} (${planNombre})`
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
