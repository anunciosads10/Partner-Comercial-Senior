import fs from 'fs';
import path from 'path';

function findFile(candidates) {
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

const activationsCandidates = [
  'src/app/dashboard/activations/page.jsx',
  'src/app/dashboard/activations/page.tsx',
  'src/app/(dashboard)/activations/page.jsx',
  'app/dashboard/activations/page.jsx'
];

const platformsCandidates = [
  'src/app/dashboard/platforms/page.jsx',
  'src/app/dashboard/platforms/page.tsx',
  'src/app/dashboard/platforms-saas/page.jsx',
  'src/app/dashboard/saas/page.jsx',
  'src/app/(dashboard)/platforms/page.jsx'
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  DIAGNÓSTICO: ACTIVACIONES MULTI-PLATAFORMA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const actFile = findFile(activationsCandidates);
console.log(`[1] Archivo Activaciones: ${actFile ? actFile : '❌ No encontrado'}`);

let platFile = findFile(platformsCandidates);
// Si no está en la lista directa, buscar dónde dice "Plataformas SaaS"
if (!platFile) {
  function search(dir) {
    if (!fs.existsSync(dir)) return null;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const found = search(full);
        if (found) return found;
      } else if (/\.(jsx|tsx|js)$/.test(ent.name)) {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('PLATAFORMAS SAAS') || text.includes('Plataformas SaaS')) return full;
      }
    }
    return null;
  }
  platFile = search('src') || search('app');
}
console.log(`[2] Archivo Plataformas SaaS: ${platFile ? platFile : '❌ No encontrado'}\n`);

if (actFile) {
  console.log('--- ANÁLISIS EN ACTIVACIONES ---');
  const actContent = fs.readFileSync(actFile, 'utf8');
  const actLines = actContent.split('\n');

  // Buscar colección Firestore o endpoint de activaciones
  const collectionMatches = actContent.match(/collection\s*\(\s*(?:db|firestore)\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g);
  console.log('• Colecciones Firestore usadas en Activaciones:', collectionMatches || 'Ninguna explícita');

  // Buscar donde se calcula 60% o 40% o 0.6
  actLines.forEach((line, i) => {
    if (line.includes('60%') || line.includes('40%') || line.includes('Menfy') || line.includes('0.6') || line.includes('0.4')) {
      if (i < 300 || line.includes('Comisión') || line.includes('th') || line.includes('td')) {
        console.log(`  L${i + 1}: ${line.trim()}`);
      }
    }
  });
}

if (platFile) {
  console.log('\n--- ANÁLISIS EN PLATAFORMAS SAAS ---');
  const platContent = fs.readFileSync(platFile, 'utf8');
  
  // Buscar colecciones y campos de porcentaje/comisión
  const platCollections = platContent.match(/collection\s*\(\s*(?:db|firestore)\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g);
  console.log('• Colecciones Firestore en Plataformas:', platCollections || 'Ninguna explícita');

  const platLines = platContent.split('\n');
  platLines.forEach((line, i) => {
    if (line.includes('percent') || line.includes('comision') || line.includes('commission') || line.includes('split') || line.includes('%')) {
      if (line.includes('partner') || line.includes('split') || line.includes('rate') || line.includes('state') || line.includes('const')) {
        console.log(`  L${i + 1}: ${line.trim()}`);
      }
    }
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
