import fs from 'fs';

const filePath = 'src/app/dashboard/affiliation/page.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Localizar variables de estado relacionadas a búsqueda / filtro
const lines = content.split('\n');
let targetLineIdx = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (
    (line.includes('useState') || line.includes('React.useState')) &&
    /(search|filter|busqueda|filtro|query)/i.test(line)
  ) {
    targetLineIdx = i;
    break;
  }
}

if (targetLineIdx !== -1) {
  console.log(`[✓] Línea de búsqueda detectada (${targetLineIdx + 1}):`, lines[targetLineIdx].trim());
  // Reemplazar useState('') o useState("") por useState(partnerUrlParam || '')
  lines[targetLineIdx] = lines[targetLineIdx].replace(
    /(useState\s*\(\s*)(['"`].*?['"`]|\s*)(\s*\))/g,
    `$1partnerUrlParam || $2$3`
  );
  content = lines.join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[✓] Estado de búsqueda conectado con éxito a ?partner.');
} else {
  // Si no se detectó por nombre, usar useEffect aditivo para sincronizar el input
  console.log('[ℹ] Agregando sincronización aditiva mediante useEffect...');
  
  // Buscar el setter de búsqueda
  const setterMatch = content.match(/set([a-zA-Z0-9_]*(?:Search|Filter|Query)[a-zA-Z0-9_]*)/i);
  const setterName = setterMatch ? setterMatch[0] : null;

  if (setterName) {
    const effectSnippet = `
  // Sincronización automática de query param ?partner
  useEffect(() => {
    if (partnerUrlParam) {
      ${setterName}(partnerUrlParam);
    }
  }, [partnerUrlParam]);
`;
    // Asegurar import de useEffect
    if (!content.includes('useEffect')) {
      content = content.replace(/(import\s*\{)([^}]*?)(\}\s*from\s*['"]react['"];?)/, '$1 useEffect,$2$3');
    }
    content = content.replace(/(const partnerUrlParam = searchParams\?\.get\('partner'\) \|\| '';)/, `$1\n${effectSnippet}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[✓] useEffect aditivo conectado con ${setterName}(partnerUrlParam).`);
  } else {
    console.log('[!] Mostrando las líneas con useState para identificar el input:');
    lines.forEach((l, idx) => {
      if (l.includes('useState')) console.log(`  L${idx + 1}: ${l.trim()}`);
    });
  }
}
