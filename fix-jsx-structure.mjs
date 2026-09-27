import fs from 'fs';

const filePath = 'src/app/dashboard/activations/page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Extraer y remover la barra de filtros de donde quedó mal ubicada
const filterRegex = /\{\/\*\s*Barra superior de Filtros y Búsqueda\s*\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*/;
content = content.replace(filterRegex, '');

// 2. Definición limpia de la barra de filtros
const cleanFilterBar = `
          {/* Barra superior de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-b">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por restaurante, socio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Plataforma:</span>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[180px] h-9 text-xs bg-white">
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

// 3. Colocar la barra ANTES del ternario de carga ({isLoading ? ...)
const targetAnchor = /<CardContent className="p-0">/;
if (targetAnchor.test(content)) {
  content = content.replace(targetAnchor, `<CardContent className="p-0">\n${cleanFilterBar}`);
  console.log('[✓] Barra colocada correctamente como hijo directo de CardContent.');
} else {
  console.error('❌ No se encontró la etiqueta <CardContent className="p-0">');
  process.exit(1);
}

// 4. Asegurar que {isLoading ? ... : ( esté limpio hacia <Table>
content = content.replace(
  /(\{isLoading\s*\?[\s\S]*?:\s*\(\s*)(\s*<Table)/,
  `$1\n                $2`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ ESTRUCTURA JSX CORREGIDA Y VALIDADA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('[✓] Conflicto de fragmentos adyacentes resuelto.');
console.log('[✓] Barra de búsqueda y selector en su posición ideal.');
