#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Extensiones a procesar
const extensions = ['.ts', '.tsx'];

// Rutas a excluir (errores importantes que queremos mantener)
const keepPatterns = [
  /console\.error/,
];

function removeConsoleLogs(content) {
  // Remover console.log, console.info, console.warn, console.debug
  // Pero mantener console.error
  let modified = false;

  // Remover líneas completas de console.log, console.info, console.warn, console.debug
  const patterns = [
    /\s*console\.(log|info|warn|debug)\([^)]*\);?\s*\n/g,
    /\s*console\.(log|info|warn|debug)\([^)]*\);?/g,
    // Remover comentarios de consola también
    /\s*\/\/\s*console\.(log|info|warn|debug)/g,
  ];

  for (const pattern of patterns) {
    if (pattern.test(content)) {
      modified = true;
      content = content.replace(pattern, '');
    }
  }

  // Remover líneas vacías creadas por la eliminación de console.logs
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  return { content, modified };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { content: newContent, modified } = removeConsoleLogs(content);

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ Procesado: ${filePath}`);
      return 1;
    }
  } catch (error) {
    console.error(`✗ Error en ${filePath}:`, error.message);
  }

  return 0;
}

function main() {
  const srcDir = path.join(__dirname, 'frontend/src');
  let totalProcessed = 0;

  // Encontrar todos los archivos TypeScript
  const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  console.log(`🔍 Encontrados ${files.length} archivos TypeScript`);
  console.log('📝 Removiendo console.logs...\n');

  for (const file of files) {
    totalProcessed += processFile(file);
  }

  console.log(`\n✅ Completado: ${totalProcessed} archivos modificados`);
}

main();
