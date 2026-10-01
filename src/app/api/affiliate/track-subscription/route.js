import { getServerFirestore } from '../../../../lib/server-firebase.js';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { getCorsHeaders, handleOptions, validateApiKey } from '../../../../lib/affiliate-auth.js';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request) {
  // 1. Validar x-api-key (401 si falla)
  const authCheck = validateApiKey(request);
  if (!authCheck.isValid) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      code: rawCode,
      platform_id,
      event_id,
      event,
      usuario_id,
      email,
      restaurant_name,
      plan_id,
      plan_name,
      amount,
      currency,
      occurred_at
    } = body;

    // Validación básica de campos obligatorios
    if (!rawCode || !platform_id || !event_id || !event) {
      return Response.json({ ok: false, error: 'Faltan campos obligatorios' }, { status: 200, headers: getCorsHeaders() });
    }

    const code = String(rawCode).trim().toUpperCase();
    const platIdClean = String(platform_id).trim().toLowerCase();
    const validEvents = ['created', 'renewed', 'cancelled'];
    if (!validEvents.includes(event)) {
      return Response.json({ ok: false, error: 'Evento no válido' }, { status: 200, headers: getCorsHeaders() });
    }

    const firestore = getServerFirestore();
    const now = new Date().toISOString();

    // 2. IDEMPOTENCIA: Verificar si event_id ya fue procesado
    const eventDocRef = doc(firestore, 'affiliateEvents', String(event_id).trim());
    const eventSnap = await getDoc(eventDocRef);
    if (eventSnap.exists()) {
      return Response.json({ ok: true, duplicate: true }, { status: 200, headers: getCorsHeaders() });
    }

    // 3. Localizar socio por código
    const partnersCol = collection(firestore, 'partners');
    let partnerDocId = null;
    let partnerData = null;

    let snap = await getDocs(query(partnersCol, where('referralCode', '==', code)));
    if (!snap.empty) {
      partnerDocId = snap.docs[0].id;
      partnerData = snap.docs[0].data();
    } else {
      const allP = await getDocs(partnersCol);
      for (const d of allP.docs) {
        if (d.id.toUpperCase().startsWith(code) || (d.data().referralCode && d.data().referralCode === code)) {
          partnerDocId = d.id;
          partnerData = d.data();
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
          partnerData = d.data();
          break;
        }
      }
    }

    if (!partnerDocId) {
      return Response.json({ ok: false, error: 'Código de afiliado no encontrado' }, { status: 200, headers: getCorsHeaders() });
    }

    // 4. Validar que el socio esté afiliado a platform_id
    if (partnerData && partnerData.affiliatedPlatforms && Array.isArray(partnerData.affiliatedPlatforms)) {
      const isAffiliated = partnerData.affiliatedPlatforms.some(id => 
        String(id).toLowerCase().includes(platIdClean) || platIdClean.includes(String(id).toLowerCase())
      );
      if (!isAffiliated) {
        return Response.json({ ok: false, error: 'Socio no afiliado a esta plataforma' }, { status: 200, headers: getCorsHeaders() });
      }
    }

    // 5. Comparar plan_id con el catálogo de saasPlatforms
    const platformsSnap = await getDocs(collection(firestore, 'saasPlatforms'));
    let matchedPlatform = null;
    for (const pDoc of platformsSnap.docs) {
      const pData = pDoc.data();
      const pName = (pData.name || '').toLowerCase();
      const pSlug = (pData.slug || '').toLowerCase();
      const pDocId = pDoc.id.toLowerCase();
      if (pDocId.includes(platIdClean) || pName.includes(platIdClean) || pSlug.includes(platIdClean)) {
        matchedPlatform = { id: pDoc.id, ...pData };
        break;
      }
    }

    let planMatched = false;
    let finalPlanName = plan_name || 'Plan SaaS';
    let finalPlanValue = Number(amount || 0);

    if (matchedPlatform && matchedPlatform.planes && Array.isArray(matchedPlatform.planes)) {
      const cleanTargetId = (plan_id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = matchedPlatform.planes.find(p => 
        p.id === plan_id || 
        p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTargetId ||
        p.nombre?.toLowerCase() === (plan_name || '').toLowerCase()
      );
      if (found) {
        planMatched = true;
        finalPlanName = found.nombre;
        finalPlanValue = Number(found.precio);
      }
    }

    // 6. Buscar referido existente por platform_id + usuario_id (o email)
    const referralsCol = collection(firestore, 'referrals');
    let refSnap = usuario_id 
      ? await getDocs(query(referralsCol, where('platformId', '==', platform_id), where('externalUserId', '==', String(usuario_id))))
      : { empty: true };

    if (refSnap.empty && email) {
      refSnap = await getDocs(query(referralsCol, where('platformId', '==', platform_id), where('restaurantEmail', '==', String(email).trim().toLowerCase())));
    }

    let referralDocId = null;
    let currentStatus = 'registrado';

    if (refSnap.empty) {
      // Crear referido con status inicial 'registrado'
      const newRef = await addDoc(referralsCol, {
        partnerId: partnerDocId,
        restaurantName: restaurant_name || email || ('Restaurante ' + String(usuario_id || '').substring(0, 6)),
        restaurantEmail: email || '',
        restaurantPhone: '',
        plan: finalPlanName,
        planId: plan_id || null,
        planValue: finalPlanValue,
        planMatched,
        currency: currency || 'COP',
        platformId: platform_id,
        status: 'registrado',
        referralCode: code,
        externalUserId: usuario_id || '',
        createdAt: occurred_at || now,
        notes: 'Suscripción reportada vía webhook por ' + platform_id
      });
      referralDocId = newRef.id;
      currentStatus = 'registrado';
    } else {
      const existingDoc = refSnap.docs[0];
      referralDocId = existingDoc.id;
      currentStatus = existingDoc.data().status || 'registrado';
    }

    // 7. Modificar según el evento
    const refDocRef = doc(firestore, 'referrals', referralDocId);

    if (event === 'created') {
      // Incrementar contadores en /partners para la plataforma específica
      try {
        const platUpper = platIdClean.toUpperCase();
        await updateDoc(doc(firestore, 'partners', partnerDocId), {
          signupsFromLink: increment(1),
          [`platformMetrics.${platUpper}.signups`]: increment(1)
        });
      } catch (e) {
        console.warn('[Track-Subscription] Error incrementando contador de partner:', e);
      }

      const updatePayload = {
        plan: finalPlanName,
        planId: plan_id || null,
        planValue: finalPlanValue,
        planMatched,
        subscriptionStartedAt: occurred_at || now,
        subscriptionStatus: 'active'
      };
      // SOLO pasar a pendiente_activacion si estaba en 'registrado'. NUNCA degradar un referido 'activo'
      if (currentStatus === 'registrado') {
        updatePayload.status = 'pendiente_activacion';
      }
      await updateDoc(refDocRef, updatePayload);
    } else if (event === 'renewed') {
      await updateDoc(refDocRef, {
        lastRenewalAt: occurred_at || now,
        subscriptionStatus: 'active'
      });
    } else if (event === 'cancelled') {
      // Guardar cancelación sin cambiar el status del referido ni borrar nada
      await updateDoc(refDocRef, {
        subscriptionStatus: 'cancelled',
        cancelledAt: occurred_at || now
      });
    }

    // 8. IDEMPOTENCIA: Guardar evento procesado en /affiliateEvents
    await setDoc(eventDocRef, {
      eventId: event_id,
      event,
      platformId: platform_id,
      code,
      partnerId: partnerDocId,
      referralId: referralDocId,
      occurredAt: occurred_at || now,
      receivedAt: now
    });

    return Response.json({
      ok: true,
      event_id,
      referral_id: referralDocId,
      event
    }, { status: 200, headers: getCorsHeaders() });

  } catch (error) {
    console.error('[API /track-subscription] Error:', error);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 200, headers: getCorsHeaders() });
  }
}
