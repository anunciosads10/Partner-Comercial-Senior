/**
 * patch-crosslink.mjs
 * Script quirúrgico y aditivo con diagnósticos y respaldos automáticos (.bak).
 */

import fs from 'fs';
import path from 'path';

const isRollback = process.argv.includes('--rollback');

// Buscador recursivo seguro por si la estructura usa route groups (ej: (dashboard))
function findFileSmart(baseCandidates, searchKeyword) {
  const extensions = ['.jsx', '.tsx', '.js', '.ts'];
  
  // 1. Probar candidatos directos
  for (const cand of baseCandidates) {
    for (const ext of extensions) {
      const fullPath = path.resolve(process.cwd(), cand + ext);
      if (fs.existsSync(fullPath)) return fullPath;
    }
  }

  // 2. Búsqueda profunda en src/ o app/ si no está en la ruta estándar
  function walk(dir) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (entry.isFile() && extensions.some(e => entry.name.endsWith(e))) {
        const rel = path.relative(process.cwd(), full).toLowerCase();
        if (rel.includes(searchKeyword.toLowerCase()) && (rel.includes('page.') || rel.includes('table'))) {
          return full;
        }
      }
    }
    return null;
  }

  return walk(path.resolve(process.cwd(), 'src')) || walk(path.resolve(process.cwd(), 'app'));
}

const partnersCandidates = [
  'src/app/dashboard/partners/page',
  'src/app/(dashboard)/partners/page',
  'app/dashboard/partners/page',
  'app/(dashboard)/partners/page',
  'src/pages/dashboard/partners',
  'pages/dashboard/partners'
];

const affiliationCandidates = [
  'src/app/dashboard/affiliation/page',
  'src/app/(dashboard)/affiliation/page',
  'app/dashboard/affiliation/page',
  'app/(dashboard)/affiliation/page',
  'src/pages/dashboard/affiliation',
  'pages/dashboard/affiliation'
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ENLACE CRUZADO: PARTNERS ↔ AFILIACIÓN SAAS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const partnersFile = findFileSmart(partnersCandidates, 'partners');
const affiliationFile = findFileSmart(affiliationCandidates, 'affiliation');

if (!partnersFile || !affiliationFile) {
  console.error('❌ Error: No se pudieron localizar los archivos objetivo automáticamente.');
  if (!partnersFile) console.error('   - No se encontró archivo de Gestión de Partners.');
  if (!affiliationFile) console.error('   - No se encontró archivo de Afiliación SaaS.');
  process.exit(1);
}

console.log(`[✓] Archivo Partners detectado:     ${path.relative(process.cwd(), partnersFile)}`);
console.log(`[✓] Archivo Affiliation detectado:  ${path.relative(process.cwd(), affiliationFile)}\n`);

// Manejo de Rollback
if (isRollback) {
  console.log('🔄 Ejecutando rollback desde copias de seguridad (.bak)...');
  [partnersFile, affiliationFile].forEach((file) => {
    const bak = `${file}.bak`;
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, file);
      console.log(`[✓] Restaurado: ${path.basename(file)}`);
    } else {
      console.log(`[!] No se encontró respaldo .bak para: ${path.basename(file)}`);
    }
  });
  console.log('\n✨ Rollback completado exitosamente.');
  process.exit(0);
}

// Creación de respaldos .bak
function backup(file) {
  const bak = `${file}.bak`;
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
    console.log(`[💾 Respaldo creado] ${path.basename(bak)}`);
  } else {
    console.log(`[ℹ Respaldo preexistente conservado] ${path.basename(bak)}`);
  }
}

backup(partnersFile);
backup(affiliationFile);

let partnersContent = fs.readFileSync(partnersFile, 'utf8');
let affiliationContent = fs.readFileSync(affiliationFile, 'utf8');

// --- 1. MODIFICACIÓN ADITIVA EN AFILIACIÓN SAAS ---
console.log('\n--- 1. Diagnosticando y adaptando Afiliación SaaS ---');

if (affiliationContent.includes('searchParams.get(\'partner\')') || affiliationContent.includes('searchParams.get("partner")')) {
  console.log('[ℹ] Afiliación SaaS ya lee el parámetro ?partner. Omitiendo para no duplicar.');
} else {
  // 1. Asegurar importación de useSearchParams
  if (!affiliationContent.includes('useSearchParams')) {
    if (affiliationContent.includes("from 'next/navigation'") || affiliationContent.includes('from "next/navigation"')) {
      affiliationContent = affiliationContent.replace(
        /(import\s*\{)([^}]*)(\}\s*from\s*['"]next\/navigation['"];?)/,
        '$1 useSearchParams,$2$3'
      );
    } else {
      affiliationContent = `import { useSearchParams } from 'next/navigation';\n` + affiliationContent;
    }
  }

  // 2. Inyectar lectura del parámetro en el componente
  const componentMatch = affiliationContent.match(/(export\s+default\s+function\s+[a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/);
  if (componentMatch) {
    const hookInjection = `\n  const searchParams = useSearchParams();\n  const partnerUrlParam = searchParams?.get('partner') || '';\n`;
    affiliationContent = affiliationContent.replace(componentMatch[0], `${componentMatch[0]}${hookInjection}`);

    // 3. Vincular con el useState de búsqueda existente
    const stateMatch = affiliationContent.match(/(const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*set[a-zA-Z0-9_]+\s*\]\s*=\s*useState(?:<string>)?\(\s*)(['"`]?[^'"`)]*['"`]?)(\s*\);?)/);
    if (stateMatch) {
      affiliationContent = affiliationContent.replace(
        stateMatch[0],
        `${stateMatch[1]}partnerUrlParam || ${stateMatch[3]}${stateMatch[4]}`
      );
      console.log(`[✓] Estado de búsqueda '${stateMatch[2]}' precargado con el parámetro ?partner.`);
    } else {
      console.log('[!] Parámetro inicializado. No se alteró useState.');
    }
  }

  fs.writeFileSync(affiliationFile, affiliationContent, 'utf8');
  console.log('[✓] Afiliación SaaS actualizada.');
}

// --- 2. MODIFICACIÓN ADITIVA EN GESTIÓN DE PARTNERS ---
console.log('\n--- 2. Diagnosticando y adaptando Gestión de Partners ---');

if (partnersContent.includes('/dashboard/affiliation?partner=')) {
  console.log('[ℹ] Gestión de Partners ya contiene el enlace a Afiliación. Omitiendo.');
} else {
  if (!partnersContent.includes("from 'next/link'") && !partnersContent.includes('from "next/link"')) {
    partnersContent = `import Link from 'next/link';\n` + partnersContent;
  }

  // Identificar el campo único más representativo del partner
  let partnerParamExpr = 'partner.id || partner.email || partner.name';
  if (partnersContent.includes('partner.email')) {
    partnerParamExpr = 'partner.email || partner.id';
  } else if (partnersContent.includes('item.email')) {
    partnerParamExpr = 'item.email || item.id';
  } else if (partnersContent.includes('item.id')) {
    partnerParamExpr = 'item.id';
  }

  const actionLinkSnippet = `
                  {/* Enlace cruzado aditivo a Afiliación SaaS */}
                  <Link
                    href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${partnerParamExpr} || '')}\`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                  >
                    <span>Ver rendimiento de afiliación</span>
                  </Link>`;

  let injected = false;

  // Insertar en menú contextual si existe (DropdownMenu, Menu.Items, etc.)
  const dropdownClose = /(<\/DropdownMenuContent>|<\/Menu\.Items>|<\/PopoverContent>)/;
  if (dropdownClose.test(partnersContent)) {
    partnersContent = partnersContent.replace(dropdownClose, `  ${actionLinkSnippet}\n                $1`);
    injected = true;
    console.log('[✓] Botón inyectado dentro del menú de acciones (...) existente.');
  }

  // Si no hay menú desplegable estándar, agregar en la celda de acciones o junto al toggle
  if (!injected) {
    const actionCell = /(<td[^>]*className="[^"]*(?:actions|acciones|estado)[^"]*"[^>]*>[\s\S]*?)(<\/td>)/i;
    if (actionCell.test(partnersContent)) {
      partnersContent = partnersContent.replace(actionCell, `$1\n${actionLinkSnippet}\n$2`);
      injected = true;
      console.log('[✓] Botón inyectado en la celda de acciones de la fila.');
    }
  }

  if (!injected) {
    // Alternativa: junto al toggle / switch de la fila
    const toggleMatch = /(<Switch[^>]*\/>|<input[^>]*type="checkbox"[^>]*\/>)/i;
    if (toggleMatch.test(partnersContent)) {
      partnersContent = partnersContent.replace(toggleMatch, `$1\n${actionLinkSnippet}`);
      injected = true;
      console.log('[✓] Botón inyectado junto al interruptor de estado.');
    }
  }

  if (!injected) {
    console.error('❌ No se encontró un punto de anclaje seguro en la tabla de Partners.');
    process.exit(1);
  }

  fs.writeFileSync(partnersFile, partnersContent, 'utf8');
  console.log('[✓] Gestión de Partners actualizada.');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ PROCESO COMPLETADO SATISFACTORIAMENTE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Archivos respaldados:');
console.log(`  - ${path.relative(process.cwd(), partnersFile)}.bak`);
console.log(`  - ${path.relative(process.cwd(), affiliationFile)}.bak`);
console.log('\nPara revertir todo al estado original:');
console.log('  node patch-crosslink.mjs --rollback\n');
