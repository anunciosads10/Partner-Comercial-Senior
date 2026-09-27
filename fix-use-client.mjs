import fs from 'fs';

const files = [
  'src/app/dashboard/partners/page.jsx',
  'src/app/dashboard/affiliation/page.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Verificar si 'use client' no está en la primera línea
  if (content.includes("'use client'") || content.includes('"use client"')) {
    // Remover todas las apariciones de 'use client'
    content = content.replace(/['"]use client['"];?\s*\n?/g, '');
    // Colocarlo en la línea 1 absoluta
    content = `'use client';\n\n` + content.trimStart();
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[✓] 'use client' colocado en la línea 1 en: ${file}`);
  }
});

console.log('\n✨ Corrección completada. Recarga el navegador.');
