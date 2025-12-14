# 🚀 GitHub 自动化部署指南

本指南将帮助您使用自动化脚本将项目部署到 GitHub。

## 📋 前置条件

1. **安装 Git**
   - 下载地址: https://git-scm.com/download/win
   - 安装后验证: `git --version`

2. **创建 GitHub Personal Access Token (PAT)**
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限:
     - ✅ `repo` (完整仓库访问权限)
     - ✅ `workflow` (如果使用 GitHub Actions)
   - 设置过期时间 (建议 30-90 天)
   - 复制生成的 token (只显示一次，请妥善保存)

3. **创建 GitHub 仓库**
   - 在 GitHub 上创建新仓库
   - 记下仓库地址，例如: `https://github.com/username/repo-name.git`

## 🎯 快速开始

### 方法一：使用 npm 脚本 (推荐)

```bash
# 自动部署（首次运行会提示输入仓库地址）
npm run deploy

# 带自定义提交信息
npm run deploy -- -CommitMessage "更新功能"
```

### 方法二：直接运行 PowerShell 脚本

```powershell
# 基本部署
.\auto-deploy.ps1

# 指定仓库地址
.\auto-deploy.ps1 -RepoUrl "https://github.com/username/repo-name.git"

# 自定义提交信息
.\auto-deploy.ps1 -CommitMessage "添加新功能"

# 强制更新远程仓库地址
.\auto-deploy.ps1 -Force -RepoUrl "https://github.com/username/new-repo.git"
```

## ⚙️ 配置文件

项目根目录的 `deploy-config.json` 文件用于保存部署配置：

```json
{
  "github": {
    "repository": "https://github.com/username/repo-name.git",
    "branch": "main",
    "autoCommit": true,
    "commitMessagePrefix": "🚀 自动部署: "
  },
  "git": {
    "user": {
      "name": "您的名字",
      "email": "your.email@example.com"
    }
  }
}
```

### 配置说明

- **repository**: GitHub 仓库地址 (完整 URL 或 `username/repo-name` 格式)
- **branch**: 推送的分支名 (默认: main)
- **autoCommit**: 是否自动提交更改 (默认: true)
- **commitMessagePrefix**: 提交信息前缀
- **git.user**: Git 用户信息 (如果未配置，使用全局 Git 配置)

## 📝 使用流程

### 首次部署

1. **运行部署脚本**
   ```bash
   npm run deploy
   ```

2. **输入 GitHub 仓库地址**
   - 如果还未配置，脚本会提示输入
   - 支持完整 URL: `https://github.com/username/repo.git`
   - 支持简短格式: `username/repo-name` (自动补全)

3. **身份验证**
   - 如果提示输入密码，使用您的 **Personal Access Token** (不是 GitHub 密码)
   - Token 格式: `ghp_xxxxxxxxxxxxxxxxxxxx`

4. **完成部署**
   - 脚本会自动：
     - 检查 Git 状态
     - 提交更改
     - 推送到 GitHub

### 后续部署

配置完成后，后续部署更简单：

```bash
# 直接运行即可
npm run deploy
```

脚本会自动：
- ✅ 检查并提交未提交的更改
- ✅ 使用配置的仓库地址
- ✅ 推送到指定分支

## 🔐 身份验证选项

### 选项 1: Personal Access Token (推荐)

1. 生成 Token: https://github.com/settings/tokens
2. 推送时，用户名输入您的 GitHub 用户名
3. 密码输入 Token (以 `ghp_` 开头)

**优点**: 安全、可撤销、权限可控

### 选项 2: SSH 密钥

1. 生成 SSH 密钥:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. 添加 SSH 密钥到 GitHub:
   - 复制公钥: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

3. 使用 SSH 格式的仓库地址:
   ```
   git@github.com:username/repo-name.git
   ```

**优点**: 无需输入密码，更便捷

## 🔄 GitHub Actions 自动化

项目已配置 GitHub Actions 工作流 (`.github/workflows/deploy.yml`)，当代码推送到 `main` 分支时，会自动：

- ✅ 检查代码质量
- ✅ 运行 lint 检查
- ✅ 生成部署报告

## ❓ 常见问题

### Q: 推送时提示 "authentication failed"

**解决方案**:
1. 确认使用 Personal Access Token 而不是密码
2. Token 需要 `repo` 权限
3. 检查 Token 是否过期

### Q: 提示 "remote origin already exists"

**解决方案**:
- 如果想更换仓库: `.\auto-deploy.ps1 -Force -RepoUrl "新地址"`
- 或手动删除: `git remote remove origin`

### Q: 推送失败，提示需要先 pull

**解决方案**:
```bash
# 先拉取远程更改
git pull origin main --rebase

# 再推送
npm run deploy
```

### Q: 配置文件在哪里？

配置文件: `deploy-config.json` (项目根目录)

如果不存在，脚本会在首次运行时创建。

## 📚 相关文档

- [GitHub Personal Access Token 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub SSH 密钥设置](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Git 基础命令](https://git-scm.com/book/zh/v2)

---

💡 **提示**: 如果遇到问题，检查脚本输出的错误信息，通常会有详细的解决建议。
