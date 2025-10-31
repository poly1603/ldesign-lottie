#!/usr/bin/env node
/**
 * 验证所有示例项目的配置完整性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const frameworks = [
  { name: 'vue', port: 3100, hasExample: true },
  { name: 'react', port: 3101, hasExample: true },
  { name: 'preact', port: 3102, hasExample: true },
  { name: 'angular', port: 3103, hasExample: false },
  { name: 'solid', port: 3104, hasExample: false },
  { name: 'qwik', port: 3105, hasExample: true },
  { name: 'svelte', port: 3106, hasExample: true },
];

console.log('🔍 验证示例项目配置...\n');

let errors = 0;
let warnings = 0;

frameworks.forEach(({ name, port, hasExample }) => {
  const packagePath = path.join(rootDir, 'packages', name);
  const examplePath = path.join(packagePath, 'example');
  
  console.log(`📦 检查 ${name}:`);
  
  // 检查包 package.json
  const pkgJsonPath = path.join(packagePath, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    console.log(`  ✅ package.json 存在`);
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    
    // 检查依赖
    if (pkg.dependencies && pkg.dependencies['@ldesign/lottie-core']) {
      console.log(`  ✅ 包含 @ldesign/lottie-core 依赖`);
    } else {
      console.log(`  ❌ 缺少 @ldesign/lottie-core 依赖`);
      errors++;
    }
  } else {
    console.log(`  ❌ package.json 不存在`);
    errors++;
  }
  
  // 检查 vite.config.ts
  const viteConfigPath = path.join(packagePath, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    console.log(`  ✅ vite.config.ts 存在`);
  } else {
    console.log(`  ⚠️  vite.config.ts 不存在`);
    warnings++;
  }
  
  // 检查示例项目
  if (hasExample) {
    if (fs.existsSync(examplePath)) {
      console.log(`  ✅ example 目录存在`);
      
      const examplePkgPath = path.join(examplePath, 'package.json');
      if (fs.existsSync(examplePkgPath)) {
        console.log(`  ✅ example/package.json 存在`);
        const examplePkg = JSON.parse(fs.readFileSync(examplePkgPath, 'utf-8'));
        
        // 检查示例依赖
        const depName = `@ldesign/lottie-${name}`;
        if (examplePkg.dependencies && examplePkg.dependencies[depName]) {
          console.log(`  ✅ example 包含 ${depName} 依赖`);
        } else {
          console.log(`  ❌ example 缺少 ${depName} 依赖`);
          errors++;
        }
      } else {
        console.log(`  ❌ example/package.json 不存在`);
        errors++;
      }
      
      // 检查必要文件
      const requiredFiles = ['index.html', 'vite.config.ts', 'tsconfig.json'];
      requiredFiles.forEach(file => {
        const filePath = path.join(examplePath, file);
        if (fs.existsSync(filePath)) {
          console.log(`  ✅ example/${file} 存在`);
        } else {
          console.log(`  ❌ example/${file} 不存在`);
          errors++;
        }
      });
    } else {
      console.log(`  ❌ example 目录不存在`);
      errors++;
    }
  }
  
  console.log('');
});

console.log('\n📊 验证总结:');
console.log(`✅ 错误: ${errors}`);
console.log(`⚠️  警告: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ 验证失败，请修复以上错误');
  process.exit(1);
} else {
  console.log('\n✅ 所有检查通过！');
  process.exit(0);
}
