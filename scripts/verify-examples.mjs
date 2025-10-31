#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const examples = [
  { name: 'Vue', path: 'packages/vue/example', port: 3100 },
  { name: 'React', path: 'packages/react/example', port: 3101 },
  { name: 'Preact', path: 'packages/preact/example', port: 3102 },
  { name: 'Svelte', path: 'packages/svelte/example', port: 3103 },
  { name: 'Qwik', path: 'packages/qwik/example', port: 3104 },
  { name: 'Solid.js', path: 'packages/solid/example', port: 3105 },
  { name: 'Angular', path: 'packages/angular/example', port: 3106 },
];

console.log('🔍 Verifying all example projects...\n');

const results = [];

for (const example of examples) {
  const examplePath = join(rootDir, example.path);
  
  if (!existsSync(examplePath)) {
    results.push({ ...example, status: 'missing', error: 'Directory not found' });
    console.log(`❌ ${example.name}: Directory not found`);
    continue;
  }

  const packageJsonPath = join(examplePath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    results.push({ ...example, status: 'error', error: 'No package.json' });
    console.log(`❌ ${example.name}: No package.json found`);
    continue;
  }

  try {
    // Try to build the example
    console.log(`🔨 Building ${example.name} example...`);
    
    await new Promise((resolve, reject) => {
      const buildProcess = spawn('pnpm', ['build'], {
        cwd: examplePath,
        shell: true,
        stdio: 'pipe'
      });

      let stderr = '';
      
      buildProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}\n${stderr}`));
        }
      });
    });

    results.push({ ...example, status: 'success' });
    console.log(`✅ ${example.name}: Build successful\n`);
  } catch (error) {
    results.push({ ...example, status: 'error', error: error.message });
    console.log(`❌ ${example.name}: ${error.message}\n`);
  }
}

console.log('\n📊 Summary:\n');
console.log('┌─────────────┬──────────┐');
console.log('│ Framework   │ Status   │');
console.log('├─────────────┼──────────┤');

for (const result of results) {
  const status = result.status === 'success' ? '✅ Pass' : '❌ Fail';
  const name = result.name.padEnd(11);
  console.log(`│ ${name} │ ${status}   │`);
}

console.log('└─────────────┴──────────┘\n');

const successCount = results.filter(r => r.status === 'success').length;
const totalCount = results.length;

if (successCount === totalCount) {
  console.log(`🎉 All ${totalCount} examples verified successfully!`);
  process.exit(0);
} else {
  console.log(`⚠️  ${successCount}/${totalCount} examples passed verification`);
  console.log('\nFailed examples:');
  results
    .filter(r => r.status !== 'success')
    .forEach(r => console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`));
  process.exit(1);
}
