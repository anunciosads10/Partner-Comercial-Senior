import fs from 'fs';

const filePath = 'src/app/dashboard/partners/page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. LIMPIEZA: Eliminar cualquier inyección errónea previa
const cleanupRegex = /\{\/\*\s*Botón visible de rendimiento de afiliación\s*\*\/\}[\s\S]*?<\/Link>\s*/g;
content = content.replace(cleanupRegex, '');
console.log('[✓] Inyecciones erradas previas eliminadas (se corrige el ReferenceError).');

// 2. Asegurar import de Link en el encabezado
if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
  content = content.replace(/'use client';\s*\n?/, `'use client';\n\nimport Link from 'next/link';\n`);
}

// 3. Localizar la sección de la tabla donde está "Estado y Acciones"
const headerIndex = content.indexOf('Estado y Acciones');
if (headerIndex === -1) {
  console.error('❌ No se encontró el texto "Estado y Acciones" en el archivo.');
  process.exit(1);
}

// Buscar el .map posterior a la cabecera de la tabla
const afterHeader = content.slice(headerIndex);
const mapMatch = afterHeader.match(/\.map\s*\(\s*(?:\(?\s*([a-zA-Z0-9_]+)\s*(?:,\s*[a-zA-Z0-9_]+\s*)?\)?\s*=>)/);

if (!mapMatch) {
  console.error('❌ No se encontró el .map de la tabla de socios después de Estado y Acciones.');
  process.exit(1);
}

const partnerVar = mapMatch[1];
console.log(`[✓] Variable real de la fila en la tabla: '${partnerVar}'`);

// Identificar si la propiedad es email o id
const emailProp = `${partnerVar}.email || ${partnerVar}.id || ''`;

// 4. Crear el botón estilizado con la variable correcta
const buttonJsx = `
                        {/* Botón visible de rendimiento de afiliación */}
                        <Link
                          href={\`/dashboard/affiliation?partner=\${encodeURIComponent(${emailProp})}\`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all shadow-sm mx-2"
                          title="Ver rendimiento de afiliación"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>Ver rendimiento</span>
                        </Link>`;

// 5. Inyectar en la fila de la tabla después del encabezado
// Buscamos el switch o toggle dentro del bloque de la tabla
const relativeMapPos = headerIndex + mapMatch.index;
const tablePart = content.slice(relativeMapPos);

// Buscar el Switch o el menú (...) dentro de esa tabla
const switchMatch = tablePart.match(/(<Switch[^>]*\/>|<input[^>]*type="checkbox"[^>]*\/>)/i);
const dotsMatch = tablePart.match(/(<button[^>]*>[\s\S]*?(?:MoreHorizontal|\.\.\.)[\s\S]*?<\/button>)/i);

let injected = false;
let newTablePart = tablePart;

if (switchMatch) {
  newTablePart = tablePart.replace(switchMatch[0], `${switchMatch[0]}\n${buttonJsx}`);
  injected = true;
  console.log('[✓] Botón inyectado junto al interruptor de estado (Switch) en la tabla real.');
} else if (dotsMatch) {
  newTablePart = tablePart.replace(dotsMatch[0], `${buttonJsx}\n${dotsMatch[0]}`);
  injected = true;
  console.log('[✓] Botón inyectado antes del menú (...) en la tabla real.');
}

if (!injected) {
  console.error('❌ No se encontró el interruptor ni el botón de menú dentro del .map de la tabla.');
  process.exit(1);
}

content = content.slice(0, relativeMapPos) + newTablePart;

fs.writeFileSync(filePath, content, 'utf8');
console.log('[✓] Archivo guardado correctamente sin errores de scope.');
console.log('✨ Listo. Recarga el navegador para verificar la tabla.');
