import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const outputDir = resolve(projectRoot, 'www');
const indexFile = resolve(outputDir, 'index.html');
const fallbackFile = resolve(outputDir, '404.html');
const noJekyllFile = resolve(outputDir, '.nojekyll');
const rootNoJekyllFile = resolve(projectRoot, '.nojekyll');

if (!existsSync(indexFile)) {
  throw new Error('No se encontró www/index.html. Asegúrate de ejecutar la build antes de este paso.');
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(indexFile, fallbackFile);
writeFileSync(noJekyllFile, '');
writeFileSync(rootNoJekyllFile, '');

console.log('GitHub Pages setup complete: 404.html and .nojekyll created in www and repo root.');
