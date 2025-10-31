#!/usr/bin/env node

/**
 * 构建验证脚本
 * 检查所有包的构建输出是否正确
 */

import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ROOT = join(__dirname, '..')

// 定义需要验证的包
const packages = [
  {
    name: 'core',
    path: 'packages/core',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'angular',
    path: 'packages/angular',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'solid',
    path: 'packages/solid',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'svelte',
    path: 'packages/svelte',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'qwik',
    path: 'packages/qwik',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'react',
    path: 'packages/react',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'vue',
    path: 'packages/vue',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  },
  {
    name: 'lit',
    path: 'packages/lit',
    outputs: ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts']
  }
]

console.log('🔍 验证构建输出...\n')

let hasError = false
const results = []

for (const pkg of packages) {
  const pkgPath = join(ROOT, pkg.path)
  const pkgResults = {
    name: pkg.name,
    success: true,
    files: []
  }

  console.log(`📦 检查 @ldesign/lottie-${pkg.name}`)

  for (const output of pkg.outputs) {
    const filePath = join(pkgPath, output)
    const exists = existsSync(filePath)
    
    if (exists) {
      const stats = statSync(filePath)
      const sizeKB = (stats.size / 1024).toFixed(2)
      console.log(`  ✅ ${output} (${sizeKB} KB)`)
      pkgResults.files.push({ path: output, exists: true, size: sizeKB })
    } else {
      console.log(`  ❌ ${output} - 文件不存在`)
      pkgResults.success = false
      pkgResults.files.push({ path: output, exists: false })
      hasError = true
    }
  }

  results.push(pkgResults)
  console.log('')
}

// 打印总结
console.log('📊 构建验证总结\n')
console.log('=' .repeat(60))

let successCount = 0
let failCount = 0

for (const result of results) {
  const status = result.success ? '✅' : '❌'
  const allFiles = result.files.length
  const existingFiles = result.files.filter(f => f.exists).length
  
  console.log(`${status} ${result.name.padEnd(10)} - ${existingFiles}/${allFiles} 文件`)
  
  if (result.success) {
    successCount++
  } else {
    failCount++
  }
}

console.log('=' .repeat(60))
console.log(`\n总计: ${successCount} 成功, ${failCount} 失败`)

if (hasError) {
  console.log('\n❌ 构建验证失败！请运行 pnpm build 重新构建。\n')
  process.exit(1)
} else {
  console.log('\n✅ 所有包构建输出正常！\n')
  process.exit(0)
}
