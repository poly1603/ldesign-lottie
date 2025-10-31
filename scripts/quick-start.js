#!/usr/bin/env node

/**
 * 快速开始脚本
 * 帮助用户快速选择和使用框架
 */

console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🎨 Lottie 多框架支持 - 快速开始                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

支持的框架：

1. 📦 Core       - 框架无关核心库
2. ⚛️  React      - React 组件和 Hooks
3. 💚 Vue        - Vue 3 Composition API
4. 🅰️  Angular    - 组件 + 指令 + 服务
5. 🔷 Solid.js   - 细粒度响应式 (最小: 5KB)
6. 🧡 Svelte     - Svelte 5 Runes
7. ⚡ Qwik       - 可恢复性架构
8. 💡 Lit        - Web Components

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 使用示例：

Angular:
  pnpm add @ldesign/lottie-angular
  <lottie-animation [path]="'assets/animation.json'"></lottie-animation>

Solid.js:
  pnpm add @ldesign/lottie-solid
  <Lottie path="/animation.json" autoplay loop />

Svelte:
  pnpm add @ldesign/lottie-svelte
  <Lottie path="/animation.json" autoplay loop />

Qwik:
  pnpm add @ldesign/lottie-qwik
  <Lottie path="/animation.json" autoplay loop />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 可用命令：

构建：
  pnpm build              # 构建所有包
  pnpm build:angular      # 构建 Angular 包
  pnpm build:solid        # 构建 Solid 包
  pnpm build:svelte       # 构建 Svelte 包
  pnpm build:qwik         # 构建 Qwik 包

验证：
  node scripts/verify-build.js  # 验证构建输出

测试：
  pnpm test               # 运行所有测试
  pnpm lint              # 代码检查
  pnpm type-check        # 类型检查

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 文档：

- FINAL_STATUS_REPORT.md          完整状态报告
- BUILD_SUCCESS_REPORT.md         构建成功报告
- DEMO_PROJECTS_GUIDE.md          演示项目指南
- packages/*/README.md             各包使用文档

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 提示：

• Solid.js 包体积最小 (5.10 KB)
• 所有包都支持 TypeScript
• 所有包都有完整的类型定义
• 可在生产环境使用

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 开始使用：

1. 选择你的框架
2. 安装对应的包
3. 查看 README.md 获取详细使用方法
4. 查看 DEMO_PROJECTS_GUIDE.md 获取示例代码

Happy Coding! 🎨

`)
