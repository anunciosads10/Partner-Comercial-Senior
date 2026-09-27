import fs from 'fs';

const filePath = 'src/app/dashboard/activations/page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Eliminar cualquier intento anterior truncado
const brokenBlockRegex = /\{\/\*\s*Barra superior de Filtros y Búsqueda\s*\*\/\}[\s\S]*?(?=<Table)/;
content = content.replace(brokenBlockRegex, '');

// 2. Asegurar import de Input
if (!content.includes('@/components/ui/input')) {
  content = content.replace(
    /(import.*from.*@\/components\/ui\/table.*;)/,
    `$1\nimport { Input } from '@/components/ui/input';`
  );
}

// 3. Asegurar import de Search en lucide-react
if (!content.includes('Search') && content.includes('lucide-react')) {
  content = content.replace(
    /(import\s*\{)([^}]*?)(\}\s*from\s*['"]lucide-react['"];?)/,
    `$1 Search,$2$3`
  );
} else if (!content.includes('lucide-react')) {
  content = `import { Search } from 'lucide-react';\n` + content;
}

// 4. Asegurar estado searchQuery
if (!content.includes('searchQuery') && !content.includes('setSearchQuery')) {
  content = content.replace(
    /(const\s+\[platformFilter,\s*setPlatformFilter\]\s*=\s*React\.useState\([^)]*\);?)/,
    `$1\n  const [searchQuery, setSearchQuery] = React.useState('');`
  );
}

// 5. Definir la barra con líneas cortas para evitar cortes de buffer en terminal
const cleanFilterBar = [
  '        {/* Barra superior de Filtros y Búsqueda */}',
  '        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-b">',
  '          <div className="relative flex-1 max-w-sm">',
  '            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />',
  '            <Input',
  '              placeholder="Buscar por restaurante, socio..."',
  '              value={searchQuery}',
  '              onChange={(e) => setSearchQuery(e.target.value)}',
  '              className="pl-9 h-9 text-xs bg-white"',
  '            />',
  '          </div>',
  '          <div className="flex items-center gap-2">',
  '            <span className="text-xs font-semibold text-slate-500">Plataforma:</span>',
  '            <Select value={platformFilter} onValueChange={setPlatformFilter}>',
  '              <SelectTrigger className="w-[180px] h-9 text-xs bg-white">',
  '                <SelectValue placeholder="Todas las plataformas" />',
  '              </SelectTrigger>',
  '              <SelectContent>',
  '                <SelectItem value="all">Todas las plataformas</SelectItem>',
  '                {activePlatforms.map((p) => (',
  '                  <SelectItem key={p.id} value={p.id}>',
  '                    {p.name}',
  '                  </SelectItem>',
  '                ))}',
  '              </SelectContent>',
  '            </Select>',
  '          </div>',
  '        </div>\n'
].join('\n');

// 6. Inyectar de forma segura inmediatamente antes de <Table
const tableIdx = content.indexOf('<Table');
if (tableIdx === -1) {
  console.error('❌ No se encontró la etiqueta <Table en el archivo.');
  process.exit(1);
}

content = content.slice(0, tableIdx) + cleanFilterBar + '        ' + content.slice(tableIdx);

fs.writeFileSync(filePath, content, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ SINTAXIS REPARADA Y BARRA DE FILTROS INTEGRADA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('[✓] Bloque truncado eliminado.');
console.log('[✓] Importaciones Input y Search aseguradas.');
console.log('[✓] Barra de filtros insertada con formato limpio y seguro.');
