#!/usr/bin/env node
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function hashDir(dir) {
  const hash = createHash('sha256');
  function walk(p) {
    for (const f of readdirSync(p).sort()) {
      const full = join(p, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.js') || f.endsWith('.c')) hash.update(readFileSync(full));
    }
  }
  if (existsSync(dir)) walk(dir);
  return hash.digest('hex');
}

const grammarFile = process.argv[2] || 'grammar.js';
mkdirSync('.grammar-cache', { recursive: true });
const cacheKey = grammarFile.replace(/\//g, '_').replace(/\.js$/, '');
const hashFile = `.grammar-cache/${cacheKey}.hash`;

const currentHash = hashDir('grammar') + readFileSync(grammarFile, 'utf8');

if (existsSync(hashFile) && readFileSync(hashFile, 'utf8').trim() === currentHash.trim()) {
  console.log(`grammar unchanged — skipping generate (${grammarFile})`);
  process.exit(0);
}

console.log(`generating parser from ${grammarFile}...`);
execSync(
  `npx --yes --package=tree-sitter-cli@v0.26.3 -- tree-sitter generate ${grammarFile}`,
  { stdio: 'inherit' }
);
writeFileSync(hashFile, currentHash);
console.log(`done.`);
