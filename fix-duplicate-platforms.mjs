import fs from 'fs';

const filePath = 'src/app/dashboard/activations/page.jsx';
if (!fs.existsSync(filePath)) {
  console.error('❌ Archivo no encontrado:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Localizar todas las ocurrencias de "const activePlatforms"
const regex = /const\s+activePlatforms\s*=\s*React\.useMemo\(\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[[^\]]*\]\);?/g;
const matches = [...content.matchAll(regex)];

console.log(`[ℹ] Declaraciones encontradas de 'activePlatforms': ${matches.length}`);

if (matches.length > 1) {
  // Mantener la primera y eliminar las siguientes
  let first = true;
  content = content.replace(regex, (match) => {
    if (first) {
      first = false;
      return match; // Conserva la primera
    }
    console.log('[✓] Declaración duplicada eliminada con éxito.');
    return ''; // Elimina la duplicada
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[✓] Archivo guardado sin variables duplicadas.');
} else {
  // Si una de las dos definiciones no usaba useMemo (por ejemplo const activePlatforms = ...)
  const lines = content.split('\n');
  const declIndices = [];
  lines.forEach((l, i) => {
    if (/const\s+activePlatforms\s*=/.test(l)) {
      declIndices.push(i);
    }
  });

  console.log(`[ℹ] Líneas con 'const activePlatforms':`, declIndices.map(i => i + 1));

  if (declIndices.length > 1) {
    // Buscar y remover el segundo bloque
    const secondIdx = declIndices[1];
    let endIdx = secondIdx;
    while (endIdx < lines.length && !lines[endIdx].includes('];')) {
      endIdx++;
    }
    lines.splice(secondIdx, endIdx - secondIdx + 1);
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[✓] Duplicado removido entre líneas ${secondIdx + 1} y ${endIdx + 1}.`);
  }
}

// 2. Verificar que no queden duplicados
const finalMatches = [...content.matchAll(/const\s+activePlatforms\s*=/g)];
console.log(`[✓] Cantidad final de declaraciones de 'activePlatforms': ${finalMatches.length}`);

if (finalMatches.length === 1) {
  console.log('✨ Error corregido con éxito. Recarga el navegador.');
} else {
  console.log('⚠️ Revisa si quedan otras menciones.');
}
