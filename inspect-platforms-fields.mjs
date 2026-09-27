import fs from 'fs';

const platContent = fs.readFileSync('src/app/dashboard/platforms/page.jsx', 'utf8');
const lines = platContent.split('\n');

console.log('--- Campos iniciales de Plataforma en platforms/page.jsx (alrededor de L85 y L185) ---');
for (let i = 75; i <= 105; i++) {
  if (lines[i]) console.log(`  L${i+1}: ${lines[i]}`);
}
console.log('----------------------------------------------------');
for (let i = 180; i <= 210; i++) {
  if (lines[i]) console.log(`  L${i+1}: ${lines[i]}`);
}
console.log('----------------------------------------------------');
