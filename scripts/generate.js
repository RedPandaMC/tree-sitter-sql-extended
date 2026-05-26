#!/usr/bin/env node
/**
 * Hash-cached grammar generation.
 *
 * For the base grammar:   node scripts/generate.js
 * For a dialect grammar:  node scripts/generate.js databricks
 *
 * Each grammar generates into its own src/ directory by running
 * tree-sitter generate from within the grammar's directory.
 * This is required because tree-sitter writes output to ./src/ relative to CWD.
 */

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const CLI = 'npx --yes --package=tree-sitter-cli@v0.26.3 -- tree-sitter';
const ROOT = fileURLToPath(new URL('..', import.meta.url));

function hashDir(dir) {
  const hash = createHash('sha256');
  function walk(p) {
    if (!existsSync(p)) return;
    for (const f of readdirSync(p).sort()) {
      const full = join(p, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.js') || f.endsWith('.c')) hash.update(readFileSync(full));
    }
  }
  walk(dir);
  return hash.digest('hex');
}

// Determine which grammar to generate.
// Argument can be a dialect name ("databricks") or omitted (base grammar).
const dialect = process.argv[2] || null;
const grammarDir = dialect ? join(ROOT, dialect) : ROOT;
const grammarFile = 'grammar.js';
const grammarPath = join(grammarDir, grammarFile);

if (!existsSync(grammarPath)) {
  console.error(`Grammar file not found: ${grammarPath}`);
  process.exit(1);
}

// Compute a hash covering the grammar entry point, the shared grammar/ rules,
// and (for dialects) the dialect's own grammar/ rules plus any parent entry
// files (e.g. spark/grammar.js for databricks, grammar.js for all dialects).
const sharedHash = hashDir(join(ROOT, 'grammar'));
const dialectHash = dialect ? hashDir(join(grammarDir, 'grammar')) : '';
const entryHash = readFileSync(grammarPath, 'utf8');

// Include parent grammar entry files so that changes to grammar.js (base)
// or spark/grammar.js (for databricks) invalidate the dialect hash.
const parentHashes = [];
if (dialect) parentHashes.push(readFileSync(join(ROOT, 'grammar.js'), 'utf8'));
if (dialect === 'databricks') parentHashes.push(readFileSync(join(ROOT, 'spark', 'grammar.js'), 'utf8'));
if (dialect === 'mariadb') parentHashes.push(readFileSync(join(ROOT, 'mysql', 'grammar.js'), 'utf8'));

const currentHash = [sharedHash, dialectHash, entryHash, ...parentHashes].join('|');

mkdirSync(join(ROOT, '.grammar-cache'), { recursive: true });
const cacheKey = dialect || 'base';
const hashFile = join(ROOT, `.grammar-cache/${cacheKey}.hash`);

if (existsSync(hashFile) && readFileSync(hashFile, 'utf8').trim() === currentHash.trim()) {
  console.log(`grammar unchanged — skipping generate (${cacheKey})`);
  process.exit(0);
}

console.log(`generating parser for ${cacheKey}...`);
// Run tree-sitter generate FROM the grammar's directory so output goes to <dialect>/src/
execSync(`${CLI} generate ${grammarFile}`, { cwd: grammarDir, stdio: 'inherit' });
writeFileSync(hashFile, currentHash);
console.log(`done (${cacheKey}).`);
