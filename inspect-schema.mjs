import fs from 'fs';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  INSPECCIÓN DE CAMPOS: saasPlatforms Y activations');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Ver qué campos tiene saasPlatforms en platforms/page.jsx
const platContent = fs.readFileSync('src/app/dashboard/platforms/page.jsx', 'utf8');
console.log('[1] Estructura / Formulario de Plataformas en platforms/page.jsx:');
platContent.split('\n').forEach((l, i) => {
  if (l.includes('name') || l.includes('commission') || l.includes('split') || l.includes('porcentaje') || l.includes('addDoc') || l.includes('setDoc')) {
    if (l.includes(':') || l.includes('useState') || l.includes('input')) {
      console.log(`  L${i+1}: ${l.trim()}`);
    }
  }
});

// 2. Ver cómo se guardan las activaciones en activations/page.jsx
const actContent = fs.readFileSync('src/app/dashboard/activations/page.jsx', 'utf8');
console.log('\n[2] Guardado de Activaciones en activations/page.jsx:');
const actLines = actContent.split('\n');
actLines.forEach((l, i) => {
  if (l.includes("addDoc(collection(firestore, 'activations')") || l.includes("collection(firestore, 'activations')")) {
    console.log(`--- Alrededor de L${i+1} ---`);
    for (let j = Math.max(0, i - 5); j <= Math.min(actLines.length - 1, i + 25); j++) {
      console.log(`  L${j+1}: ${actLines[j]}`);
    }
  }
});
