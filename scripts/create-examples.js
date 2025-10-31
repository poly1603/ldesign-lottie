#!/usr/bin/env node

/**
 * Create example projects for all packages
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const examples = [
  {
    name: 'react',
    port: 3101,
    color: '#61dafb',
  },
  {
    name: 'angular',
    port: 3102,
    color: '#dd0031',
  },
  {
    name: 'solid',
    port: 3103,
    color: '#2c4f7c',
  },
  {
    name: 'svelte',
    port: 3104,
    color: '#ff3e00',
  },
  {
    name: 'qwik',
    port: 3105,
    color: '#18b6f6',
  },
  {
    name: 'preact',
    port: 3106,
    color: '#673ab8',
  },
];

console.log('📦 Creating example projects for all packages...\n');

examples.forEach(({ name, port, color }) => {
  const exampleDir = join(rootDir, 'packages', name, 'example');
  
  if (!existsSync(exampleDir)) {
    mkdirSync(exampleDir, { recursive: true });
  }
  
  console.log(`✅ Created example directory for ${name}`);
  console.log(`   Port: ${port}`);
  console.log(`   Color: ${color}\n`);
});

console.log('✨ All example directories created!');
console.log('\nNext steps:');
console.log('1. Run individual example setup scripts');
console.log('2. Or manually configure each example project');
