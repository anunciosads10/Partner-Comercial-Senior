import fs from 'fs';

const filePath = 'src/app/dashboard/partners/page.jsx';
if (!fs.existsSync(filePath)) {
  console.error('❌ No se encontró el archivo:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Identificar variable en el map (partner, p, item, socio)
const mapMatch = content.match(/\.(?:map|forEach)\s*\(\s*(?:\(?\s*([a-zA-Z0-9_]+))/);
const varName = mapMatch ? mapMatch[1] : 'partner';
console.log(`[✓] Variable de fila detectada: '${varName}'`);

// Identificar campo único más seguro (email o id)
let partnerVal = `${varName}.email || ${varName}.id || ${varName}.name`;
if (content.includes(`${varName}.email`)) {
  partnerVal = `${varName}.email || ${varName}.id`;
}

// 2. Definir el componente de botón visible
const visibleButtonJsx = `
                {/* Botón visible de rendimiento de afiliación */}
                <Link
                  href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${partnerVal} || '')}\`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm ml-2 mr-1"
                  title="Ver rendimiento de afiliación"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Ver rendimiento</span>
                </Link>`;

// Asegurar import de Link
if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
  content = content.replace(/'use client';\s*\n?/, `'use client';\n\nimport Link from 'next/link';\n`);
}

// 3. Buscar dónde están el toggle y los tres puntos (...)
// Casos comunes: botones con MoreHorizontal, "...", o el Switch de activación
let patched = false;

// Caso A: Justo antes del botón de los tres puntos (...)
const moreDotsRegex = /(<(?:button|DropdownMenuTrigger)[^>]*>[\s\S]*?(?:MoreHorizontal|\.\.\.)[\s\S]*?<\/(?:button|DropdownMenuTrigger)>)/i;
if (moreDotsRegex.test(content) && !content.includes('Ver rendimiento</span>')) {
  content = content.replace(moreDotsRegex, `${visibleButtonJsx}\n                $1`);
  patched = true;
  console.log('[✓] Botón visible insertado justo al lado del botón de acciones (...).');
}

// Caso B: Si no coincidió con MoreHorizontal, buscar el Switch/Toggle de la fila
if (!patched && !content.includes('Ver rendimiento</span>')) {
  const switchRegex = /(<Switch[^>]*\/>|<input[^>]*type="checkbox"[^>]*\/>)/i;
  if (switchRegex.test(content)) {
    content = content.replace(switchRegex, `$1\n${visibleButtonJsx}`);
    patched = true;
    console.log('[✓] Botón visible insertado junto al interruptor de estado.');
  }
}

// Caso C: En la celda de Estado y Acciones
if (!patched && !content.includes('Ver rendimiento</span>')) {
  const tdActionsRegex = /(<td[^>]*className="[^"]*(?:actions|acciones|estado)[^"]*"[^>]*>[\s\S]*?)(<\/td>)/i;
  if (tdActionsRegex.test(content)) {
    content = content.replace(tdActionsRegex, `$1\n${visibleButtonJsx}\n$2`);
    patched = true;
    console.log('[✓] Botón visible insertado en la celda de acciones.');
  }
}

if (patched) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[✓] Archivo actualizado exitosamente.');
  console.log('✨ Ahora el botón "Ver rendimiento" aparece visible en cada fila.');
} else {
  console.log('[!] Ya estaba presente o no se encontró el selector exacto.');
}
