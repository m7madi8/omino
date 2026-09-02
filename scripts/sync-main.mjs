import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'main');
const target = join(root, 'public', 'main');

if (!existsSync(source)) {
  console.warn('[sync-main] main/ not found — skipping');
  process.exit(0);
}

mkdirSync(join(root, 'public'), { recursive: true });
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log('[sync-main] copied main/ → public/main/');
