const fs = require('fs');

// 1. Respaldos de seguridad
fs.copyFileSync('src/app/dashboard/activations/page.jsx', 'src/app/dashboard/activations/page.jsx.bak');
fs.copyFileSync('src/app/dashboard/referrals/page.jsx', 'src/app/dashboard/referrals/page.jsx.bak');
console.log('✔ Respaldos .bak creados con éxito.');

// =========================================================================
// 2. Modificaciones en src/app/dashboard/activations/page.jsx
// =========================================================================
let act = fs.readFileSync('src/app/dashboard/activations/page.jsx', 'utf8');

// Corrección 8: Título dinámico por rol
act = act.replace(
  '<Zap className="h-8 w-8 text-amber-500" /> Activar Negocio',
  '<Zap className="h-8 w-8 text-amber-500" /> {isSuperAdmin ? \'Verificación de Activaciones\' : \'Solicitar Activación\'}'
);

// Corrección 8: Comentario en handleSubmit
act = act.replace(
  "// 1. FLUJO ADMIN: Registrar activación -> referral pasa a 'pendiente_activacion'",
  "// 1. FLUJO SOCIO: Registrar activación -> referral pasa a 'pendiente_activacion'"
);

// Corrección 2: Eliminar useEffect de preselección forzada
act = act.replace(
  /  \/\/ Preseleccionar plataforma por defecto[\s\S]*?}, \[activePlatforms, selectedPlatformId\]\);/,
  "  // Selección manual de plataforma SaaS por el socio"
);

// Corrección 5: Reemplazar "60%" fijo por {partnerPct}% en CardDescription
act = act.replace(
  "El sistema calcula tu 60% de ganancia.",
  "El sistema calcula tu {partnerPct}% de ganancia."
);

// Corrección 2: Insertar Select de Plataforma en el formulario (3 columnas en desktop)
const oldFormGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Restaurante Referido</label>`;

const newFormGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Plataforma SaaS</label>
                    <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona plataforma..." /></SelectTrigger>
                      <SelectContent>
                        {activePlatforms.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.baseCommission || 60}%)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Restaurante Referido</label>`;

act = act.replace(oldFormGrid, newFormGrid);

// Corrección 7: Input de comprobante requerido
act = act.replace(
  `<Input type="file" className="mt-1 cursor-pointer" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />`,
  `<Input type="file" required className="mt-1 cursor-pointer" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />`
);

// Corrección 2, 3, 6 y 7: Validaciones en handleSubmit, restaurantName y Notificación aislada
const oldSubmitBlock = `    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!firestore || !user?.uid || !selectedReferralId) {
        toast({ variant: "destructive", title: "Faltan datos", description: "Selecciona un restaurante registrado." });
        return;
      }
      setIsSubmitting(true);
      try {
        let receiptUrl = '';
        if (receiptFile && storage) {
          const fileRef = ref(storage, \`receipts/\${user.uid}/\${Date.now()}_\${receiptFile.name}\`);
          const snapshot = await uploadBytes(fileRef, receiptFile);
          receiptUrl = await getDownloadURL(snapshot.ref);
        }
        const now = new Date().toISOString();
        const batch = writeBatch(firestore);

        // Crear activación con status enviado
        const actRef = doc(collection(firestore, 'activations'));
        batch.set(actRef, {
          partnerId: user.uid,
          referralId: selectedReferralId,
          chargedAmount: Number(chargedAmount),
          partnerKeep,
          menfyAmount,
          platformId: currentPlatform.id || 'menfy',
          platformName: currentPlatform.name || 'MENFY',
          partnerPercentage: partnerPct,
          platformPercentage: platformPct,
          platformAmount,
          paymentMethod,
          receiptUrl,
          status: 'enviado',
          submittedAt: now,
          createdAt: now,
        });

        // Actualizar el referral a pendiente_activacion
        const refDoc = doc(firestore, 'referrals', selectedReferralId);
        batch.update(refDoc, { status: 'pendiente_activacion' });

        // Notificar al SuperAdmin
        const superadminQuery = query(collection(firestore, 'users'), where('role', '==', 'superadmin'));
        const superSnap = await getDocs(superadminQuery);
        superSnap.forEach(sDoc => {
          const notifRef = doc(collection(firestore, 'partners', sDoc.id, 'notifications'));
          batch.set(notifRef, {
            title: 'Nueva Activación para Revisar',
            message: \`El socio ha solicitado la activación de un restaurante por $\${Number(chargedAmount).toLocaleString()}.\`,
            timestamp: now,
            read: false,
            type: 'info',
          });
        });

        await batch.commit();`;

const newSubmitBlock = `    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedPlatformId) {
        toast({ variant: "destructive", title: "Falta plataforma", description: "Selecciona la plataforma SaaS del cobro." });
        return;
      }
      if (!firestore || !user?.uid || !selectedReferralId) {
        toast({ variant: "destructive", title: "Faltan datos", description: "Selecciona un restaurante registrado." });
        return;
      }
      if (!receiptFile) {
        toast({ variant: "destructive", title: "Comprobante requerido", description: "Debes adjuntar el comprobante de pago." });
        return;
      }
      setIsSubmitting(true);
      try {
        let receiptUrl = '';
        if (receiptFile && storage) {
          const fileRef = ref(storage, \`receipts/\${user.uid}/\${Date.now()}_\${receiptFile.name}\`);
          const snapshot = await uploadBytes(fileRef, receiptFile);
          receiptUrl = await getDownloadURL(snapshot.ref);
        }
        const now = new Date().toISOString();
        const batch = writeBatch(firestore);

        const selectedRef = availableReferrals.find(r => r.id === selectedReferralId);
        const restaurantName = selectedRef?.restaurantName || 'Restaurante';

        // Crear activación con status enviado y restaurantName guardado
        const actRef = doc(collection(firestore, 'activations'));
        batch.set(actRef, {
          partnerId: user.uid,
          referralId: selectedReferralId,
          restaurantName,
          chargedAmount: Number(chargedAmount),
          partnerKeep,
          menfyAmount,
          platformId: currentPlatform.id || 'menfy',
          platformName: currentPlatform.name || 'MENFY',
          partnerPercentage: partnerPct,
          platformPercentage: platformPct,
          platformAmount,
          paymentMethod,
          receiptUrl,
          status: 'enviado',
          submittedAt: now,
          createdAt: now,
        });

        // Actualizar el referral a pendiente_activacion
        const refDoc = doc(firestore, 'referrals', selectedReferralId);
        batch.update(refDoc, { status: 'pendiente_activacion' });

        // Notificar al SuperAdmin en try/catch independiente para no bloquear el guardado
        try {
          const superadminQuery = query(collection(firestore, 'users'), where('role', '==', 'superadmin'));
          const superSnap = await getDocs(superadminQuery);
          superSnap.forEach(sDoc => {
            const notifRef = doc(collection(firestore, 'partners', sDoc.id, 'notifications'));
            batch.set(notifRef, {
              title: 'Nueva Activación para Revisar',
              message: \`El socio ha solicitado la activación de \${restaurantName} por $\${Number(chargedAmount).toLocaleString()}.\`,
              timestamp: now,
              read: false,
              type: 'info',
            });
          });
        } catch (notifErr) {
          console.warn('[Activations] Notificación secundaria omitida:', notifErr);
        }

        await batch.commit();`;

act = act.replace(oldSubmitBlock, newSubmitBlock);

// Corrección 4: handleVerify usando porcentaje dinámico pct
const oldVerifyBlock = `        // c) Crear transacción aprobada
        const txRef = doc(collection(firestore, 'transactions'));
        batch.set(txRef, {
          partnerId: a.partnerId,
          referralId: a.referralId || '',
          type: 'activacion',
          baseAmount: Number(a.chargedAmount),
          commissionPct: 60,
          commissionValue: Number(a.partnerKeep),
          status: 'aprobado',
          period: now.slice(0, 7),
          approvedBy: user.email || 'SuperAdmin',
          approvedAt: now,
          createdAt: now,
          description: 'Comisión 60% activación aprobada'
        });

        // d) Notificar al socio
        const notifRef = doc(collection(firestore, 'partners', a.partnerId, 'notifications'));
        batch.set(notifRef, {
          title: '¡Activación Verificada y Aprobada!',
          message: \`Tu activación fue aprobada. Se acreditó tu comisión del 60% ($${Number(a.partnerKeep).toLocaleString()}).\`,
          timestamp: now,
          read: false,
          type: 'success',
        });`;

const newVerifyBlock = `        const pct = Number(a.partnerPercentage ?? 60);

        // c) Crear transacción aprobada con porcentaje dinámico real
        const txRef = doc(collection(firestore, 'transactions'));
        batch.set(txRef, {
          partnerId: a.partnerId,
          referralId: a.referralId || '',
          type: 'activacion',
          baseAmount: Number(a.chargedAmount),
          commissionPct: pct,
          commissionValue: Number(a.partnerKeep),
          status: 'aprobado',
          period: now.slice(0, 7),
          approvedBy: user.email || 'SuperAdmin',
          approvedAt: now,
          createdAt: now,
          description: \`Comisión \${pct}% activación aprobada\`
        });

        // d) Notificar al socio con su porcentaje dinámico real
        const notifRef = doc(collection(firestore, 'partners', a.partnerId, 'notifications'));
        batch.set(notifRef, {
          title: '¡Activación Verificada y Aprobada!',
          message: \`Tu activación fue aprobada. Se acreditó tu comisión del \${pct}% ($\${Number(a.partnerKeep).toLocaleString()}).\`,
          timestamp: now,
          read: false,
          type: 'success',
        });`;

act = act.replace(oldVerifyBlock, newVerifyBlock);

// Corrección 3: useMemo de activations con platformFilter y searchQuery
const oldActivationsMemo = `    const activations = React.useMemo(() => {
      if (!rawActivations) return [];
      return [...rawActivations].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [rawActivations]);`;

const newActivationsMemo = `    const activations = React.useMemo(() => {
      if (!rawActivations) return [];
      return rawActivations
        .filter(a => {
          const matchPlatform = platformFilter === 'all' || a.platformId === platformFilter;
          const matchSearch = !searchQuery || 
            a.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.platformName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.partnerId?.toLowerCase().includes(searchQuery.toLowerCase());
          return matchPlatform && matchSearch;
        })
        .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [rawActivations, platformFilter, searchQuery]);`;

act = act.replace(oldActivationsMemo, newActivationsMemo);

// Corrección 1: Agregar celda de Plataforma en las filas de la tabla
act = act.replace(
  `<TableCell className="font-bold text-xs">$\${Number(a.chargedAmount || 0).toLocaleString()}</TableCell>`,
  `<TableCell className="font-bold text-xs">$\${Number(a.chargedAmount || 0).toLocaleString()}</TableCell>\n                          <TableCell className="text-xs font-bold">{a.platformName || 'MENFY'}</TableCell>`
);

// Corrección 1: colSpan exacto
act = act.replace('colSpan={isSuperAdmin ? 8 : 7}', 'colSpan={isSuperAdmin ? 9 : 8}');

fs.writeFileSync('src/app/dashboard/activations/page.jsx', act, 'utf8');
console.log('✔ src/app/dashboard/activations/page.jsx actualizado quirúrgicamente.');

// =========================================================================
// 3. Modificaciones en src/app/dashboard/referrals/page.jsx
// =========================================================================
let refCode = fs.readFileSync('src/app/dashboard/referrals/page.jsx', 'utf8');

// Corrección 9: Etiqueta legible de estado sin cambiar el valor guardado
if (!refCode.includes('getStatusLabel')) {
  const helper = `  const getStatusLabel = (status) => {
    if (status === 'pendiente_activacion') return 'Pendiente de activación';
    if (status === 'registrado') return 'Registrado';
    if (status === 'activo') return 'Activo';
    if (status === 'pagado') return 'Pagado';
    if (status === 'cancelado') return 'Cancelado';
    return status || 'Registrado';
  };`;

  refCode = refCode.replace('const userDocRef = useMemoFirebase', `${helper}\n\n  const userDocRef = useMemoFirebase`);
  refCode = refCode.replace(
    `<Badge variant="outline" className="uppercase text-[10px] font-bold">{r.status || 'registrado'}</Badge>`,
    `<Badge variant="outline" className={\`text-[10px] font-bold \${r.status === 'pendiente_activacion' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'uppercase'}\`}>{getStatusLabel(r.status)}</Badge>`
  );
  fs.writeFileSync('src/app/dashboard/referrals/page.jsx', refCode, 'utf8');
  console.log('✔ src/app/dashboard/referrals/page.jsx actualizado con etiquetas legibles.');
}
