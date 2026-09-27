import fs from 'fs';

const filePath = 'src/app/dashboard/partners/page.jsx';
const bakPath = 'src/app/dashboard/partners/page.jsx.bak';

if (!fs.existsSync(bakPath)) {
  console.error('❌ No se encontró el archivo de respaldo .bak');
  process.exit(1);
}

// 1. Restaurar archivo original limpio
fs.copyFileSync(bakPath, filePath);
console.log('[✓] Archivo restaurado a su estado original limpio desde .bak.');

let content = fs.readFileSync(filePath, 'utf8');

// 2. Colocar 'use client' en línea 1 y agregar import Link
content = content.replace(/['"]use client['"];?\s*\n?/g, '');
if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
  content = `'use client';\n\nimport Link from 'next/link';\n` + content.trimStart();
} else {
  content = `'use client';\n\n` + content.trimStart();
}

const lines = content.split('\n');

// 3. Localizar la línea con 'ACTIVE'
let activeLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ACTIVE')) {
    activeLineIdx = i;
    break;
  }
}

if (activeLineIdx === -1) {
  console.error('❌ No se encontró la etiqueta "ACTIVE" en la tabla.');
  process.exit(1);
}

console.log(`[✓] Fila de acciones detectada en línea ${activeLineIdx + 1}`);

// 4. Buscar hacia arriba el .map que provee la variable del socio en esa fila
let partnerVar = 'partner';
for (let i = activeLineIdx; i >= 0; i--) {
  const match = lines[i].match(/\.map\s*\(\s*(?:\(?\s*([a-zA-Z0-9_]+))/);
  if (match) {
    partnerVar = match[1];
    console.log(`[✓] Variable del socio identificada: '${partnerVar}'`);
    break;
  }
}

// 5. Localizar el botón de los tres puntos (...) en esa misma celda (entre activeLineIdx y 15 líneas abajo)
let dotsButtonIdx = -1;
for (let i = activeLineIdx; i <= Math.min(lines.length - 1, activeLineIdx + 15); i++) {
  if (lines[i].includes('<button') || lines[i].includes('<Button') || lines[i].includes('DropdownMenuTrigger') || lines[i].includes('MoreHorizontal') || lines[i].includes('...')) {
    dotsButtonIdx = i;
    break;
  }
}

const targetIdx = dotsButtonIdx !== -1 ? dotsButtonIdx : activeLineIdx;

// 6. Construir el botón con seguridad ante valores nulos
const buttonCode = `                  <Link
                    href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${partnerVar}?.email || ${partnerVar}?.id || ${partnerVar}?.name || '')}\`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm mx-1.5"
                    title="Ver rendimiento de afiliación"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Ver rendimiento</span>
                  </Link>`;

// Inserción aditiva limpia antes del elemento objetivo
lines.splice(targetIdx, 0, buttonCode);
console.log(`[✓] Botón inyectado limpiamente en la línea ${targetIdx + 1}.`);

// 7. Guardar y verificar
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n--- Verificación del bloque generado ---');
const previewStart = Math.max(0, targetIdx - 3);
const previewEnd = Math.min(lines.length, targetIdx + 12);
console.log(lines.slice(previewStart, previewEnd).join('\n'));
console.log('----------------------------------------');
console.log('✨ Operación completada sin errores. Recarga el navegador.');
