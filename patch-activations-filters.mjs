import fs from 'fs';

const filePath = 'src/app/dashboard/activations/page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Asegurar importación de Input
if (!content.includes('@/components/ui/input')) {
  content = content.replace(
    /(import.*from.*@\/components\/ui\/table.*;)/,
    `$1\nimport { Input } from '@/components/ui/input';`
  );
}

// 2. Asegurar importación de Search de lucide-react
if (content.includes('from "lucide-react"') || content.includes("from 'lucide-react'")) {
  if (!content.includes('Search')) {
    content = content.replace(
      /(import\s*\{)([^}]*?)(\}\s*from\s*['"]lucide-react['"];?)/,
      `$1 Search,$2$3`
    );
  }
} else {
  content = content.replace(
    /(import.*from.*@\/components\/ui\/table.*;)/,
    `$1\nimport { Search } from 'lucide-react';`
  );
}

// 3. Asegurar estado searchQuery
if (!content.includes('searchQuery') && !content.includes('setSearchQuery')) {
  content = content.replace(
    /(const\s+\[platformFilter,\s*setPlatformFilter\]\s*=\s*React\.useState\([^)]*\);?)/,
    `$1\n  const [searchQuery, setSearchQuery] = React.useState('');`
  );
}

// 4. Componente de la Barra de Filtros (Buscador + Selector de Plataformas)
const filterBarJsx = `
        {/* Barra superior de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50/70 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por restaurante, socio o método..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white border-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Plataforma:</span>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[190px] h-9 text-xs bg-white border-slate-200 font-medium">
                <SelectValue placeholder="Todas las plataformas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las plataformas</SelectItem>
                {activePlatforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
`;

// 5. Inyectar la barra exactamente justo antes de la <Table> del panel de SuperAdmin
if (!content.includes('placeholder="Buscar por restaurante, socio o método..."')) {
  // Buscar la tabla donde están las cabeceras modificadas
  const tablePos = content.indexOf('<Table');
  if (tablePos !== -1) {
    content = content.slice(0, tablePos) + filterBarJsx + '\n        ' + content.slice(tablePos);
    console.log('[✓] Barra de búsqueda y selector inyectada antes de la tabla.');
  } else {
    console.error('❌ No se encontró la etiqueta <Table en el archivo.');
    process.exit(1);
  }
} else {
  console.log('[ℹ] La barra de filtros ya estaba presente.');
}

// 6. Actualizar el useMemo de activations para filtrar por texto y por plataforma
content = content.replace(
  /const\s+activations\s*=\s*React\.useMemo\(\(\)\s*=>\s*\{[\s\S]*?return\s+list;\s*\}\s*,\s*\[rawActivations,\s*platformFilter\]\);?/,
  `const activations = React.useMemo(() => {
    if (!rawActivations) return [];
    let list = [...rawActivations].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (platformFilter !== 'all') {
      list = list.filter(a => (a.platformId || 'menfy') === platformFilter || (a.platformName || '').toLowerCase() === platformFilter.toLowerCase());
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.platformName || '').toLowerCase().includes(q) ||
        (a.referralId || '').toLowerCase().includes(q) ||
        (a.partnerId || '').toLowerCase().includes(q) ||
        (a.paymentMethod || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rawActivations, platformFilter, searchQuery]);`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ BARRA SUPERIOR DE BÚSQUEDA Y FILTRO INTEGRADA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('[✓] Input de búsqueda con ícono Search agregado.');
console.log('[✓] Selector de filtro por plataforma colocado en la parte superior derecha.');
console.log('[✓] Filtrado en tiempo real activo.');
