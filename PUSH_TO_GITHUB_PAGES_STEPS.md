# 从本地首次推送到 GitHub，并用 GitHub Actions 自动发布到 GitHub Pages（一步一步）

本指南适用于当前项目（oil-station-report），帮助你从“本地未关联远端”的状态，到“推送到 GitHub 并自动发布到 Pages”。

仓库地址（远端）：
- https://github.com/crazy-dogman/oil-station-report

---

## 0. 前置检查（只看一眼即可）
- 请确保以下文件已存在（我已为你添加/修改）：
  - `.github/workflows/deploy.yml`（Actions 自动发布工作流）
  - `vite.config.js`（`base: '/oil-station-report/'`，用于 Pages 路径）
  - `index.html`（`<link rel="icon" href="%BASE_URL%favicon.png">`，避免 Pages 404）
- `.gitignore` 已忽略 `node_modules/` 与 `dist/`（Actions 方案无需提交构建产物）

---

## 1. 打开命令行并进入项目根目录
```bash
cd "E:/code/star/new oil"
```

> Windows 路径注意带空格；PowerShell 同样支持上述写法。

---

## 2. 初始化本地 Git 仓库（若未初始化）
```bash
git init
```

将默认分支命名为 `main`（如果已是 main，可跳过）：
```bash
git branch -M main
```

### 2.5 配置 Git 用户信息（解决 Author identity unknown）
首次提交如果提示 Author identity unknown，请设置你的 Git 身份（建议全局设置）：

PowerShell / CMD（全局设置，推荐）：
```powershell
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub绑定邮箱"
```

仅在当前仓库设置（不影响其他项目）：
```powershell
git config user.name "你的GitHub用户名"
git config user.email "你的GitHub绑定邮箱"
```

查看已生效配置：
```powershell
git config --list
```

Windows 上若看到 “LF will be replaced by CRLF” 警告属正常；如需统一换行符，可执行（可选）：
```powershell
git config --global core.autocrlf true
```

---

## 3. 查看状态并添加需要提交的文件
```bash
git status
```

一次性添加本项目需要的文件（PowerShell/CMD 请“一行执行”，不要用反斜杠续行）：

PowerShell / CMD（单行）：
```powershell
git add index.html vite.config.js .github/workflows/deploy.yml src public package.json package-lock.json README.md DEPLOY_TO_GITHUB_PAGES.md PUSH_TO_GITHUB_PAGES_STEPS.md .gitignore
```

（可选）Bash/Linux/macOS 可用续行写法：
```bash
git add index.html vite.config.js .github/workflows/deploy.yml \
  src public package.json package-lock.json README.md DEPLOY_TO_GITHUB_PAGES.md PUSH_TO_GITHUB_PAGES_STEPS.md .gitignore
```

（可选）忽略本地的备份依赖目录，防止误提交过大体积：
PowerShell：
```powershell
Add-Content .gitignore "node_modules.*"
```
CMD：
```cmd
echo node_modules.*>> .gitignore
```
然后再次执行上面的 git add 命令。

首个提交：
```bash
git commit -m "ci(pages): add actions deploy + set base + fix favicon"
```

如果刚刚因未设置用户名/邮箱而提交失败，完成 2.5 后直接再次执行上面的 commit 命令即可，无需重新 `git add`。

> 若你还有其他改动，也可以使用 `git add -A` 一次性加入全部（前提是 `.gitignore` 正常工作）。

---

## 4. 关联远端仓库
将远端命名为 `origin`：
```bash
git remote add origin https://github.com/crazy-dogman/oil-station-report.git
```

如果提示 `origin 已存在`，改为：
```bash
git remote set-url origin https://github.com/crazy-dogman/oil-station-report.git
```

---

## 5. 首次推送到 GitHub
```bash
git push -u origin main
```

> 首次推送可能会弹出 GitHub 登录或令牌认证（PAT）。按提示完成即可。

若需要使用 PAT（个人访问令牌）：
- GitHub 个人头像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- 勾选至少 `repo` 权限
- 推送时在密码处粘贴该 token

---

## 6. 启用 GitHub Pages（选择 Actions）
1) 打开仓库网页 → `Settings` → `Pages`
2) `Build and deployment` → `Source` 选择 “GitHub Actions”
3) 保存设置

---

## 7. 等待自动部署并访问页面
- 打开仓库 `Actions` 页面，找到 "Deploy to GitHub Pages" 工作流
- 等待两个 Job（`build`、`deploy`）都变成绿色
- 发布完成后，访问地址：
  - `https://crazy-dogman.github.io/oil-station-report/`

> 首次生效可能需要 1～3 分钟；若样式异常，尝试刷新或用隐私模式访问。

---

## 8. 日常更新流程
每次修改代码后：
```bash
git status
# 选择性添加更改
git add -A
# 提交信息建议清晰
git commit -m "feat: xxx / fix: yyy"
# 推送触发自动部署
git push
```

GitHub Actions 会自动：安装依赖 → 构建 → 发布到 Pages。

---

## 9. 常见问题（速查）
- 提示 `non-fast-forward` 无法推送：
  ```bash
  git pull --rebase origin main
  git push
  ```
- `origin` 已存在：
  ```bash
  git remote set-url origin https://github.com/crazy-dogman/oil-station-report.git
  ```
- Pages 404 或资源加载失败：
  - 确认存在 `vite.config.js` 且 `base: '/oil-station-report/'`
  - 确认 HTML/静态资源不要用根路径 `/xxx`，改用 `%BASE_URL%` 或相对路径
- 本地 WSL 构建失败（Rollup 可选依赖）：
  - 这不影响 Actions 构建；若需本地构建，可尝试：
    ```bash
    rm -rf node_modules package-lock.json
    npm install
    npm run build
    ```

---

如需我把 README 增加“通过 Actions 部署”的一段说明，或把工作流触发分支改为你的默认分支，请告诉我。
