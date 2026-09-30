const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/app/dashboard/activations/page.jsx');

if (!fs.existsSync(targetFile)) {
  console.log('No se encontró activations/page.jsx');
  process.exit(1);
}

const original = fs.readFileSync(targetFile, 'utf8');

// Respaldo de seguridad
fs.writeFileSync(`${targetFile}.bak`, original, 'utf8');

let updated = original;

// 1. Corregir fallbacks por defecto de 60 a 30
updated = updated.replace(/baseCommission:\s*60/g, 'baseCommission: 30');
updated = updated.replace(/baseCommission\s*\|\|\s*60/g, 'baseCommission || 30');

// 2. Corregir la descripción estática
updated = updated.replace(/El sistema calcula tu 60% de ganancia/g, 'El sistema calcula tu 30% de ganancia');

// 3. Corregir el label de Pago a MENFY (40% -> 70% o dinámico {platformPct}%)
updated = updated.replace(/Pago a MENFY \(40%\)/g, 'Pago a MENFY ({platformPct}%)');

fs.writeFileSync(targetFile, updated, 'utf8');

console.log('✓ Archivo actualizado quirúrgicamente.');
console.log('✓ Textos alineados a Base 30% y Pago MENFY 70% (dinámico).');
console.log('✓ Respaldo creado en: src/app/dashboard/activations/page.jsx.bak');
