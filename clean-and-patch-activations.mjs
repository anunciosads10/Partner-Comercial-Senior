import fs from 'fs';

const filePath = 'src/app/dashboard/activations/page.jsx';
const bakPath = 'src/app/dashboard/activations/page.jsx.bak';

if (!fs.existsSync(bakPath)) {
  console.error('❌ No se encontró el archivo de respaldo .bak');
  process.exit(1);
}

// 1. Restaurar archivo original limpio
fs.copyFileSync(bakPath, filePath);
console.log('[✓] Archivo restaurado desde .bak a su versión limpia original.');

let content = fs.readFileSync(filePath, 'utf8');

// 2. Asegurar imports necesarios sin duplicar
if (!content.includes('@/components/ui/badge')) {
  content = content.replace(/(import.*from.*@\/components\/ui\/table.*;)/, `$1\nimport { Badge } from '@/components/ui/badge';`);
}
if (!content.includes('@/components/ui/select')) {
  content = content.replace(/(import.*from.*@\/components\/ui\/table.*;)/, `$1\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';`);
}

// 3. Bloque de consulta de saasPlatforms y split dinámico (ÚNICA INSTANCIA)
const platformHookSnippet = `
  // Consultar plataformas SaaS activas para split dinámico
  const platformsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'saasPlatforms');
  }, [firestore]);
  const { data: rawPlatforms } = useCollection(platformsQuery);
  const activePlatforms = React.useMemo(() => {
    if (!rawPlatforms || rawPlatforms.length === 0) {
      return [{ id: 'menfy', name: 'MENFY', baseCommission: 60, status: 'Active' }];
    }
    return rawPlatforms.filter(p => p.status === 'Active' || !p.status);
  }, [rawPlatforms]);

  const [selectedPlatformId, setSelectedPlatformId] = React.useState('');
  const [platformFilter, setPlatformFilter] = React.useState('all');

  // Preseleccionar plataforma por defecto
  React.useEffect(() => {
    if (activePlatforms.length > 0 && !selectedPlatformId) {
      const menfy = activePlatforms.find(p => p.name?.toLowerCase().includes('menfy'));
      setSelectedPlatformId(menfy ? menfy.id : activePlatforms[0].id);
    }
  }, [activePlatforms, selectedPlatformId]);

  const currentPlatform = React.useMemo(() => {
    return activePlatforms.find(p => p.id === selectedPlatformId) || activePlatforms[0] || { name: 'MENFY', baseCommission: 60 };
  }, [activePlatforms, selectedPlatformId]);

  const partnerRate = Number(currentPlatform.baseCommission || 60) / 100;
  const platformRate = Math.max(0, 1 - partnerRate);
  const partnerPct = Math.round(partnerRate * 100);
  const platformPct = Math.round(platformRate * 100);
`;

// Inyectar justo después de setChargedAmount
content = content.replace(
  /(const\s+\[chargedAmount,\s*setChargedAmount\]\s*=\s*React\.useState\([^)]*\);?)/,
  `$1\n${platformHookSnippet}`
);

// 4. Modificar cálculo dinámico
content = content.replace(
  /const\s+partnerKeep\s*=\s*Math\.round\(Number\(chargedAmount\s*\|\|\s*0\)\s*\*\s*0\.60\);/,
  `const partnerKeep = Math.round(Number(chargedAmount || 0) * partnerRate);`
);

content = content.replace(
  /const\s+menfyAmount\s*=\s*Math\.round\(Number\(chargedAmount\s*\|\|\s*0\)\s*\*\s*0\.40\);/,
  `const platformAmount = Math.round(Number(chargedAmount || 0) * platformRate);\n  const menfyAmount = platformAmount; // Retrocompatibilidad`
);

// 5. Guardar campos en Firestore activations
const savePlatformSnippet = `        platformId: currentPlatform.id || 'menfy',
        platformName: currentPlatform.name || 'MENFY',
        partnerPercentage: partnerPct,
        platformPercentage: platformPct,
        platformAmount,`;

content = content.replace(
  /(referralId:\s*selectedReferralId,\s*\n\s*chargedAmount:\s*Number\(chargedAmount\),\s*\n\s*partnerKeep,\s*\n\s*menfyAmount,)/,
  `$1\n${savePlatformSnippet}`
);

// 6. Selector de plataforma en el formulario del Partner
const platformSelectJsx = `
            {/* Selector dinámico de Plataforma */}
            {activePlatforms.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Plataforma SaaS
                </label>
                <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
                  <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Selecciona la plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePlatforms.map((plat) => (
                      <SelectItem key={plat.id} value={plat.id}>
                        {plat.name} ({plat.baseCommission || 60}% comisión)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
`;

content = content.replace(
  /(<form[^>]*onSubmit=\{handleSubmit\}[^>]*>[\s\S]*?<div[^>]*className="space-y-4"[^>]*>)/,
  `$1${platformSelectJsx}`
);

// 7. Textos dinámicos en formulario Partner
content = content.replace(
  /<div[^>]*className="text-\[11px\][^"]*"[^>]*>Tu Comisión \(60%\)<\/div>/g,
  `<div className="text-[11px] font-bold text-muted-foreground uppercase">Tu Comisión ({partnerPct}%)</div>`
);

content = content.replace(
  /<div[^>]*className="text-\[11px\][^"]*"[^>]*>Pago a Menfy \(40%\)<\/div>/g,
  `<div className="text-[11px] font-bold text-muted-foreground uppercase">Pago a {currentPlatform.name || 'Plataforma'} ({platformPct}%)</div>`
);

// 8. SuperAdmin: Filtro por plataforma en la cabecera
const filterHeaderJsx = `
          <div className="flex items-center gap-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
                <SelectValue placeholder="Todas las plataformas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las plataformas</SelectItem>
                {activePlatforms.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
`;

content = content.replace(
  /(<h2[^>]*>[\s\S]*?PANEL DE VERIFICACIÓN DE ACTIVACIONES[\s\S]*?<\/h2>[\s\S]*?)(<\/div>)/i,
  `$1${filterHeaderJsx}$2`
);

// 9. SuperAdmin: Encabezados genéricos y columna Plataforma
content = content.replace(
  /<TableHead>Comisión 60%<\/TableHead>\s*<TableHead>Menfy 40%<\/TableHead>/g,
  `<TableHead>Plataforma</TableHead>\n              <TableHead>Comisión Partner</TableHead>\n              <TableHead>Comisión Plataforma</TableHead>`
);

// 10. SuperAdmin: Celdas con Badge de plataforma
const rowPlatformCellsJsx = `              <TableCell>
                <Badge variant="outline" className="font-semibold text-xs bg-slate-50 border-slate-300 text-slate-800">
                  {a.platformName || 'MENFY'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-emerald-600">
                \${Number(a.partnerKeep || 0).toLocaleString()}
                <span className="text-[10px] text-muted-foreground block">
                  ({a.partnerPercentage || 60}%)
                </span>
              </TableCell>
              <TableCell className="font-medium text-blue-600">
                \${Number(a.platformAmount || a.menfyAmount || 0).toLocaleString()}
                <span className="text-[10px] text-muted-foreground block">
                  ({a.platformPercentage || (100 - (a.partnerPercentage || 60))}%)
                </span>
              </TableCell>`;

content = content.replace(
  /<TableCell[^>]*>\s*\$\{Number\(a\.partnerKeep\)\.toLocaleString\(\)\}\s*<\/TableCell>\s*<TableCell[^>]*>\s*\$\{Number\(a\.menfyAmount\)\.toLocaleString\(\)\}\s*<\/TableCell>/g,
  rowPlatformCellsJsx
);

// 11. Filtrado dinámico de activaciones
content = content.replace(
  /const\s+activations\s*=\s*React\.useMemo\(\(\)\s*=>\s*\{([\s\S]*?return\s+\[\.\.\.rawActivations\]\.sort\([^)]*\);?\s*\})/,
  `const activations = React.useMemo(() => {
    if (!rawActivations) return [];
    let list = [...rawActivations].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (platformFilter !== 'all') {
      list = list.filter(a => (a.platformId || 'menfy') === platformFilter || (a.platformName || '').toLowerCase() === platformFilter.toLowerCase());
    }
    return list;
  }, [rawActivations, platformFilter])`
);

fs.writeFileSync(filePath, content, 'utf8');

// 12. Verificación de variables duplicadas
const checkVars = ['activePlatforms', 'currentPlatform', 'platformsQuery', 'partnerRate'];
let hasDuplicates = false;

checkVars.forEach(v => {
  const count = (content.match(new RegExp(`const\\s+${v}\\s*=`, 'g')) || []).length;
  if (count > 1) {
    console.error(`⚠️ Alerta: '${v}' está definida ${count} veces.`);
    hasDuplicates = true;
  } else {
    console.log(`[✓] '${v}': Definida exactamente 1 vez.`);
  }
});

if (!hasDuplicates) {
  console.log('\n✨ CORRECCIÓN TOTAL COMPLETADA: Cero duplicados, compilación limpia.');
}
