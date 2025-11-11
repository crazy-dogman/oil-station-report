# 部署到 GitHub Pages 指南（Vite 项目）

本文档说明：项目不是单文件 HTML，而是 Vite 构建后的静态站点。你可以在两种方式中二选一完成部署。

- 方式A（简单）：docs 目录法（推荐给初次部署）
- 方式B（自动化）：GitHub Actions 自动构建部署

---

## 一、准备工作

- 安装 Node.js ≥ 18（建议 LTS）
- 在本机可以执行 `npm` 命令
- 有一个 GitHub 仓库（下文用 `yourname/your-repo` 表示）

项目中关键目录/文件：
- `index.html`
- `src/`、`public/`、`package.json`、`package-lock.json`
- `vite` 构建后产物：`dist/`
- 文档：`README.md`、`DEPLOY_TO_GITHUB_PAGES.md`

不需要上传：`node_modules/`（会由 GitHub/本地 `npm install` 自动安装）

> 若你尚未初始化仓库：
>
> ```bash
> git init
> git add .
> git commit -m "init"
> git branch -M main
> git remote add origin https://github.com/yourname/your-repo.git
> git push -u origin main
> ```

---

## 二、构建站点

```bash
# 安装依赖
npm install

# 本地预览（可选）
npm run dev

# 生产构建（生成 dist/ ）
npm run build
```

如遇 WSL/部分 Linux 环境 Rollup 可选依赖错误（`@rollup/rollup-linux-x64-gnu`）：

```bash
# 解决：清理并重装依赖
rm -rf node_modules package-lock.json
npm install
npm run build
```

> LAN 预览给手机/自动化使用：`npm run dev -- --host`

---

## 三、方式A：docs 目录法（最简单）

1) 准备 `docs/`

```bash
rm -rf docs && mkdir docs
cp -r dist/* docs/
```

2) 提交并推送

```bash
git add docs
git commit -m "docs: publish build"
git push
```

3) 开启 Pages
- 打开仓库 → Settings → Pages
- Build and deployment → Source 选择 “Deploy from a branch”
- Branch 选择 `main`，文件夹选择 `/docs`，保存
- 等待 1～3 分钟，访问提示的 URL：
  - `https://yourname.github.io/your-repo/`

> 日常更新：每次修改后执行 `npm run build` → 覆盖 `docs/` → `git add docs && git commit && git push`

---

## 四、方式B：GitHub Actions 自动部署（无需提交 docs/）

1) 添加工作流文件 `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

2) 推送代码

```bash
git add .
git commit -m "ci: add pages deploy"
git push
```

3) 打开仓库 → Settings → Pages → Source 选择 “GitHub Actions”
- 首次运行完成后，右上角会有 Pages 链接

> 日常更新：只需 `git push`，Actions 会自动构建并发布 `dist/` 到 Pages。

---

## 五、路径与资源（重要）

- 若仓库名为 `your-repo`，建议在 `vite.config.*` 设置 `base: '/your-repo/'`，或确保资源用相对/`%BASE_URL%` 引用。
- favicon 建议：
  ```html
  <link rel="icon" href="%BASE_URL%favicon.png" />
  ```
- JS/音频/图片：避免以 `/xxx` 根路径引用，可使用：
  ```js
  new URL('./audio/xiayu.mp3', import.meta.url).href
  // 或在 HTML/模板中使用 %BASE_URL%
  ```

> 本项目已尽量避免根路径引用，但若出现 404，请优先检查路径是否以 `/` 开头。

---

## 六、需要上传哪些文件？

- 需要上传：
  - `index.html`
  - `src/`、`public/`
  - `package.json`、`package-lock.json`
  - `README.md`、`DEPLOY_TO_GITHUB_PAGES.md`
  - （可选）`.github/workflows/deploy.yml`（若用 Actions 方案）
- 不需要上传：
  - `node_modules/`（应忽略）
  - `dist/`（Actions 方案下忽略；docs 方案下不用提交 dist，而是提交 `docs/`）

建议 `.gitignore` 示例：
```
node_modules/
dist/
.DS_Store
```

---

## 七、验证与排错

- 访问：`https://yourname.github.io/your-repo/`
- 打开开发者工具查看 Network/Console：
  - 若 404，多半是路径问题（以 `/` 开头导致）
  - 若空白，检查是否构建产物缺失或 BASE 设置不对
- WSL 构建失败：删除 `node_modules` 与 `package-lock.json` 后重新安装

---

## 八、常用命令备忘

```bash
# 本地开发
npm run dev
npm run dev -- --host   # 暴露LAN地址（手机/MCP可访问）

# 构建 / 预览
npm run build
npm run preview

# 发布（docs 方案）
rm -rf docs && mkdir docs && cp -r dist/* docs/
git add docs && git commit -m "docs: update build" && git push
```

---

如需我帮你把 `vite.config.*` 的 `base` 自动配置/或新增 GitHub Actions 工作流文件，请告知仓库名与偏好方案（A/B）。
