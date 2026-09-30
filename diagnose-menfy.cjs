#!/usr/bin/env node

/**
 * Script de Diagnóstico en PartnerVerse para el partner/entidad: MENFY
 * 100% LECTURA - No altera la base de datos ni los archivos
 */

const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = [
  '.json', '.js', '.ts', '.jsx', '.tsx', 
  '.sql', '.yaml', '.yml', '.csv', '.env', '.prisma'
];

const IGNORED_DIRS = [
  'node_modules', '.git', 'dist', 'build', 
  '.next', '.cache', 'coverage', '.vscode'
];

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

let totalFilesScanned = 0;
const findings = [];

function scanDirectory(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.includes(ext) && !entry.name.endsWith('.bak')) {
        auditFile(fullPath);
      }
    }
  }
}

function auditFile(filePath) {
  totalFilesScanned++;
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return;
  }

  // Buscamos a MENFY en PartnerVerse sin importar mayúsculas/minúsculas
  if (!/menfy/i.test(content)) return;

  const lines = content.split('\n');
  const menfyIndices = [];

  lines.forEach((line, idx) => {
    if (/menfy/i.test(line)) {
      menfyIndices.push(idx);
    }
  });

  const WINDOW = 10;

  for (const menfyIdx of menfyIndices) {
    const start = Math.max(0, menfyIdx - WINDOW);
    const end = Math.min(lines.length - 1, menfyIdx + WINDOW);

    const snippetLines = [];
    let detectedBaseValue = null;
    let baseLineNum = null;
    let status = 'INFORMATIVO';

    for (let i = start; i <= end; i++) {
      const lineText = lines[i];
      snippetLines.push({ num: i + 1, text: lineText, isMenfy: i === menfyIdx });

      // Busca valores de Base (30 vs 60, o 0.3 vs 0.6)
      const match30 = lineText.match(/(["']?base["']?\s*[:\-=]\s*)(30\b|0\.30?\b)/i) || 
                      lineText.match(/(\bBase\b\s*[:\-]??\s*)30(\%?)/i);
      
      const match60 = lineText.match(/(["']?base["']?\s*[:\-=]\s*)(60\b|0\.60?\b)/i) || 
                      lineText.match(/(\bBase\b\s*[:\-]??\s*)60(\%?)/i);

      if (match30) {
        detectedBaseValue = match30[0].trim();
        baseLineNum = i + 1;
        status = 'PROBLEMA_DETECTADO';
      } else if (match60) {
        detectedBaseValue = match60[0].trim();
        baseLineNum = i + 1;
        status = 'YA_CORREGIDO';
      }
    }

    findings.push({
      filePath: path.relative(process.cwd(), filePath),
      menfyLine: menfyIdx + 1,
      baseLine: baseLineNum,
      detectedBaseValue,
      status,
      snippet: snippetLines
    });
  }
}

function run() {
  console.log(`\n${c.bold}${c.cyan}====================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   AUDITORÍA PARTNERVERSE: BÚSQUEDA DE 'MENFY'     ${c.reset}`);
  console.log(`${c.gray}   (Diagnóstico 100% de lectura, no altera ningún dato)${c.reset}`);
  console.log(`${c.bold}${c.cyan}====================================================${c.reset}\n`);

  scanDirectory(process.cwd());

  console.log(`${c.green}✓ Escaneo completado.${c.reset} Archivos revisados en PartnerVerse: ${totalFilesScanned}\n`);

  if (findings.length === 0) {
    console.log(`${c.red}✖ No se encontró 'MENFY' en los archivos estáticos/código de este proyecto.${c.reset}`);
    console.log(`${c.yellow}Nota:${c.reset} Si PartnerVerse carga los datos de MENFY directamente desde una base de datos activa (Supabase, PostgreSQL, Prisma o MongoDB), el cambio debe hacerse en la base de datos.\n`);
    return;
  }

  console.log(`${c.bold}COINCIDENCIAS ENCONTRADAS (${findings.length}):${c.reset}\n`);

  findings.forEach((f, idx) => {
    console.log(`${c.bold}[${idx + 1}] Archivo:${c.reset} ${c.cyan}${f.filePath}${c.reset}`);
    console.log(`    Línea de MENFY: ${c.yellow}${f.menfyLine}${c.reset}`);

    if (f.status === 'PROBLEMA_DETECTADO') {
      console.log(`    Estado: ${c.bold}${c.red}✖ DISCREPANCIA (Tiene '${f.detectedBaseValue}' en línea ${f.baseLine})${c.reset}`);
    } else if (f.status === 'YA_CORREGIDO') {
      console.log(`    Estado: ${c.bold}${c.green}✔ OK (Tiene '${f.detectedBaseValue}' en línea ${f.baseLine})${c.reset}`);
    } else {
      console.log(`    Estado: ${c.gray}ℹ MENFY encontrado (sin campo Base en las líneas contiguas)${c.reset}`);
    }

    console.log(`    ${c.gray}--- Fragmento ---${c.reset}`);
    f.snippet.forEach(s => {
      const linePrefix = String(s.num).padStart(5, ' ');
      if (s.num === f.baseLine && f.status === 'PROBLEMA_DETECTADO') {
        console.log(`${c.red} > ${linePrefix} | ${s.text}${c.reset}`);
      } else if (s.num === f.baseLine && f.status === 'YA_CORREGIDO') {
        console.log(`${c.green} > ${linePrefix} | ${s.text}${c.reset}`);
      } else if (s.isMenfy) {
        console.log(`${c.yellow} * ${linePrefix} | ${s.text}${c.reset}`);
      } else {
        console.log(`${c.gray}   ${linePrefix} | ${s.text}${c.reset}`);
      }
    });
    console.log(`    ${c.gray}-----------------${c.reset}\n`);
  });
}

run();
