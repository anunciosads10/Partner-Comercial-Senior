import fs from 'fs';
import path from 'path';

// 1. Localizar el archivo que contiene 'Ver Ficha Técnica'
function findFileWithText(dir, text) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileWithText(full, text);
      if (found) return found;
    } else if (entry.isFile() && /\.(jsx|tsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(text)) return full;
    }
  }
  return null;
}

let targetFile = 'src/app/dashboard/partners/page.jsx';
if (!fs.existsSync(targetFile) || !fs.readFileSync(targetFile, 'utf8').includes('Ver Ficha Técnica')) {
  targetFile = findFileWithText('src', 'Ver Ficha Técnica') || findFileWithText('app', 'Ver Ficha Técnica');
}

if (!targetFile) {
  console.error('❌ No se encontró ningún archivo con el texto "Ver Ficha Técnica".');
  process.exit(1);
}

console.log(`[✓] Archivo del menú detectado: ${targetFile}`);

let content = fs.readFileSync(targetFile, 'utf8');

// 2. Asegurar import de Link y useRouter si aplica
if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
  content = content.replace(/'use client';\s*\n?/, `'use client';\n\nimport Link from 'next/link';\n`);
}

const lines = content.split('\n');

// 3. Localizar la línea de "Perfil Público" o "Ver Ficha Técnica"
let anchorIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Perfil Público')) {
    anchorIdx = i;
    break;
  }
}
if (anchorIdx === -1) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Ver Ficha Técnica')) {
      anchorIdx = i;
      break;
    }
  }
}

if (anchorIdx === -1) {
  console.error('❌ No se encontró la opción en las líneas del archivo.');
  process.exit(1);
}

console.log(`[✓] Opción ancla detectada en línea ${anchorIdx + 1}: ${lines[anchorIdx].trim()}`);

// 4. Buscar hacia arriba para identificar la variable del partner en este componente/scope
let partnerVar = 'partner';
for (let i = anchorIdx; i >= Math.max(0, anchorIdx - 40); i--) {
  const match = lines[i].match(/(?:map\s*\(\s*\(?|function\s+[a-zA-Z0-9_]+\s*\(\s*\{?\s*)([a-zA-Z0-9_]+)/);
  if (match && !['index', 'key', 'e', 'event'].includes(match[1])) {
    partnerVar = match[1];
    break;
  }
}

// Verificar si en las líneas cercanas se usa partner, p, socio o item
const nearbyBlock = lines.slice(Math.max(0, anchorIdx - 20), anchorIdx + 20).join('\n');
if (nearbyBlock.includes('partner.')) partnerVar = 'partner';
else if (nearbyBlock.includes('p.')) partnerVar = 'p';
else if (nearbyBlock.includes('socio.')) partnerVar = 'socio';
else if (nearbyBlock.includes('item.')) partnerVar = 'item';

console.log(`[✓] Variable del socio para el menú: '${partnerVar}'`);

// 5. Identificar el cierre del elemento actual (DropdownMenuItem, button, etc.)
let closeIdx = anchorIdx;
while (closeIdx < lines.length && !lines[closeIdx].includes('</DropdownMenuItem>') && !lines[closeIdx].includes('</button>') && !lines[closeIdx].includes('</a>')) {
  closeIdx++;
}

// 6. Construir el nuevo ítem reutilizando el mismo formato de DropdownMenuItem
const isDropdownMenuItem = lines.slice(Math.max(0, anchorIdx - 5), closeIdx + 2).some(l => l.includes('DropdownMenuItem'));

let newItemCode = '';
if (isDropdownMenuItem) {
  newItemCode = `
                <DropdownMenuItem asChild>
                  <Link
                    href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${partnerVar}?.email || ${partnerVar}?.id || '')}\`}
                    className="flex items-center gap-2 cursor-pointer w-full text-slate-700 hover:text-blue-600 px-2 py-1.5 text-sm outline-none"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Ver rendimiento de afiliación</span>
                  </Link>
                </DropdownMenuItem>`;
} else {
  newItemCode = `
                <Link
                  href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${partnerVar}?.email || ${partnerVar}?.id || '')}\`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Ver rendimiento de afiliación</span>
                </Link>`;
}

// Inyectar inmediatamente después del ítem actual
lines.splice(closeIdx + 1, 0, newItemCode);

fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');

console.log(`[✓] Ítem "Ver rendimiento de afiliación" inyectado exitosamente en la línea ${closeIdx + 2}.`);
console.log('✨ Abre el menú (...) en el navegador y verás la nueva opción.');
