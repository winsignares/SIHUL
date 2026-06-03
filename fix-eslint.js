// fix-eslint.js — Phase 1: clean old comments, Phase 2: add per-file disables
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname);
const srcRoot = path.join(projectRoot, 'frontend', 'src');

// ── helpers ──────────────────────────────────────────────────────────
function rel(p) { return path.join(srcRoot, p); }

function stripOldDisable(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // Remove any line that is a file-level eslint-disable comment (at top of file)
  const lines = content.split('\n');
  const cleaned = [];
  for (const line of lines) {
    if (/^\s*\/\*\s*eslint-disable[\s\S]*?\*\/\s*$/.test(line)) continue;
    cleaned.push(line);
  }
  fs.writeFileSync(filePath, cleaned.join('\n'), 'utf8');
}

function addDisable(filePath, rules) {
  if (!fs.existsSync(filePath)) { console.log('  SKIP (not found):', filePath); return; }
  const comment = `/* eslint-disable ${rules.join(', ')} */`;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(comment)) return; // already present
  content = comment + '\n' + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  ✓', path.relative(projectRoot, filePath));
}

// ── Phase 1: strip ALL old eslint-disable lines from previously touched files ──
console.log('\n🧹  Phase 1 — Stripping old eslint-disable comments …');
const allSrcFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) allSrcFiles.push(p);
  }
}
walk(srcRoot);
allSrcFiles.forEach(f => stripOldDisable(f));
console.log(`   Cleaned ${allSrcFiles.length} files.`);

// ── Phase 2: add per-file disables ───────────────────────────────────
console.log('\n📝  Phase 2 — Adding per-file eslint-disable comments …');

const UNUSED = '@typescript-eslint/no-unused-vars';
const ANY    = '@typescript-eslint/no-explicit-any';
const DEPS   = 'react-hooks/exhaustive-deps';
const CASE   = 'no-case-declarations';
const REFRESH = 'react-refresh/only-export-components';

const fileRules = {
  // Todas las reglas desactivadas - mostrar todos los warnings
};

for (const [relative, rules] of Object.entries(fileRules)) {
  addDisable(rel(relative), rules);
}

console.log('\n✅  Done! Run `npm run lint` to verify.\n');
