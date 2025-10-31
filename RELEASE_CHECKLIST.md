# 🚀 Release Checklist

使用此清单确保发布前一切就绪。

---

## 📋 Pre-Release Checklist

### 1. **代码质量检查** ✅
- [ ] 所有包构建成功
  ```bash
  pnpm build
  ```
- [ ] 所有测试通过
  ```bash
  pnpm test
  ```
- [ ] Lint 检查通过
  ```bash
  pnpm lint
  ```
- [ ] 类型检查通过
  ```bash
  pnpm type-check
  ```

### 2. **示例项目验证** ✅
- [ ] 所有示例项目构建成功
  ```bash
  pnpm verify:examples
  ```
- [ ] 手动测试关键示例
  - [ ] Vue 示例 (Port 3100)
  - [ ] React 示例 (Port 3101)
  - [ ] Preact 示例 (Port 3102)
  - [ ] Svelte 示例 (Port 3103)
  - [ ] Qwik 示例 (Port 3104)

### 3. **文档完整性** 📚
- [ ] README.md 更新
- [ ] CHANGELOG.md 记录变更
- [ ] API 文档生成
  ```bash
  pnpm docs:build
  ```
- [ ] 迁移指南（如有破坏性变更）
- [ ] 示例代码更新

### 4. **包配置检查** 📦
- [ ] package.json 版本号正确
- [ ] package.json 依赖版本正确
- [ ] exports 字段配置正确
- [ ] files 字段包含所有必要文件
- [ ] README、LICENSE 等文件存在

### 5. **性能测试** ⚡
- [ ] Bundle 大小合理
  ```bash
  # 检查每个包的大小
  ls -lh packages/*/dist/*.js
  ```
- [ ] 加载性能测试
- [ ] 内存泄漏测试
  ```bash
  pnpm test:memory
  ```
- [ ] Worker 功能验证

### 6. **浏览器兼容性** 🌐
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)
- [ ] 移动浏览器测试

### 7. **版本管理** 🏷️
- [ ] 使用 Changesets 管理版本
  ```bash
  pnpm changeset
  ```
- [ ] 版本号遵循 Semver
  - **Major:** 破坏性变更
  - **Minor:** 新功能，向后兼容
  - **Patch:** Bug 修复
- [ ] 更新 CHANGELOG.md

---

## 🔄 Release Process

### Step 1: 版本规划
```bash
# 添加 changeset
pnpm changeset

# 选择要发布的包
# 选择版本类型 (major/minor/patch)
# 编写变更说明
```

### Step 2: 版本更新
```bash
# 更新版本号和 CHANGELOG
pnpm version

# 检查变更
git diff
```

### Step 3: 最终构建
```bash
# 清理
pnpm clean

# 重新安装依赖
pnpm install

# 构建所有包
pnpm build

# 最终验证
pnpm verify:examples
pnpm test
```

### Step 4: Git 提交
```bash
# 提交变更
git add .
git commit -m "chore: release vX.X.X"

# 推送到远程
git push origin main
```

### Step 5: 发布到 npm
```bash
# 使用 Changesets 发布
pnpm release

# 或手动发布
cd packages/core && npm publish
cd packages/vue && npm publish
# ... 其他包
```

### Step 6: 创建 GitHub Release
```bash
# 创建 Git tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0

# 在 GitHub 上创建 Release
# 包含 CHANGELOG 内容
```

---

## 📊 Post-Release Checklist

### 1. **验证发布**
- [ ] npm 上的包可以正常访问
  ```bash
  npm view @ldesign/lottie-core
  ```
- [ ] 从 npm 安装测试
  ```bash
  npm install @ldesign/lottie-core@latest
  ```
- [ ] 包的依赖解析正确

### 2. **文档更新**
- [ ] 文档网站更新
- [ ] npm README 显示正确
- [ ] 示例链接正常工作

### 3. **通知**
- [ ] 发布公告（如适用）
- [ ] 更新项目网站
- [ ] 社交媒体分享

### 4. **监控**
- [ ] 监控错误报告
- [ ] 查看下载统计
- [ ] 收集用户反馈

---

## 🐛 Rollback Plan

如果发现严重问题需要回滚：

```bash
# 1. 标记为 deprecated
npm deprecate @ldesign/lottie-core@2.0.0 "Please use version 1.9.x instead"

# 2. 发布 patch 版本修复
# 或
# 3. 发布新的 major 版本
```

---

## 📝 版本记录

### v2.0.0 (当前)
- ✅ Blob URL Worker 实现
- ✅ 5个框架包构建成功
- ✅ 完整类型定义
- ✅ 示例项目验证通过

### 待发布功能
- 📝 Solid.js 完整支持
- 📝 Angular 示例项目
- 📝 Visual regression tests
- 📝 Performance benchmarks

---

## 🔗 Useful Links

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

<div align="center">

**准备好发布时，请确保所有复选框都已勾选！** ✅

</div>
