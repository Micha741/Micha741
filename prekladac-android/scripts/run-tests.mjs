// Testy jádra (formáty, překlad) v Node: zkompiluje TypeScript a spustí node --test.
import { execSync } from 'node:child_process';
import { rmSync, readdirSync } from 'node:fs';
rmSync('.test-build', { recursive: true, force: true });
execSync('npx tsc -p tsconfig.test.json', { stdio: 'inherit' });
const files = readdirSync('.test-build/tests').filter((f) => f.endsWith('.test.js')).map((f) => `.test-build/tests/${f}`);
execSync(`node --test ${files.join(' ')}`, { stdio: 'inherit' });
