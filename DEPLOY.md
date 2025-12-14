# 📦 部署到 GitHub 指南

本指南将帮助您将"账掌柜"项目部署到 GitHub。

## ⚠️ 重要提示

在部署之前，请注意：

1. **API 密钥安全**：代码中包含 DeepSeek API 密钥。如果这是您个人的测试密钥，可以保留；如果是生产环境密钥，建议：
   - 在 GitHub 仓库设置中添加 Secrets（Settings → Secrets and variables → Actions）
   - 将 API 密钥移到环境变量
   - 使用 `.env` 文件（已在 `.gitignore` 中排除）

2. **检查敏感信息**：确保以下文件不会被提交：
   - `.env` 文件（已配置）
   - `node_modules/`（已配置）
   - 个人证书和密钥文件（已配置）

## 🚀 部署步骤

### 方法一：使用 PowerShell 脚本（推荐）

1. **运行部署脚本**：
   ```powershell
   .\deploy-to-github.ps1
   ```

2. **按照提示操作**：
   - 如果还没有 GitHub 仓库，脚本会引导您创建
   - 输入您的 GitHub 仓库地址
   - 脚本会自动执行 Git 操作

### 方法二：手动部署

#### 1. 在 GitHub 上创建新仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `zhangzhanggui`（或您喜欢的名称）
   - Description: `AI智能记账助手 - 面向理发店个体户的ChatBI应用`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

#### 2. 在本地配置 Git

```powershell
# 检查当前状态
git status

# 如果工作区有未提交的更改，先提交
git add .
git commit -m "准备部署到GitHub"

# 添加远程仓库（将 YOUR_USERNAME 和 YOUR_REPO 替换为您的实际信息）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 或者使用 SSH（如果您配置了 SSH 密钥）
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 3. 验证部署

1. 访问您的 GitHub 仓库页面
2. 确认所有文件都已上传
3. 检查 README.md 是否正确显示

## 📋 部署检查清单

- [ ] 已检查 `.gitignore` 文件，确保敏感信息不会被提交
- [ ] 已创建 `.env.example` 文件（如果使用环境变量）
- [ ] 已检查代码中是否有硬编码的密钥或密码
- [ ] 已创建 GitHub 仓库
- [ ] 已配置 Git 远程仓库
- [ ] 已推送代码到 GitHub
- [ ] 已验证 GitHub 仓库中的文件完整性

## 🔐 环境变量配置（可选）

如果您想使用环境变量管理 API 密钥：

1. **创建 `.env` 文件**（复制 `.env.example`）：
   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 文件**，填入您的 API 密钥：
   ```
   DEEPSEEK_API_KEY=sk-your-actual-api-key
   ```

3. **更新代码**以使用环境变量（已完成）

4. **对于 Expo 项目**，如果环境变量不生效，可能需要：
   - 使用 `EXPO_PUBLIC_` 前缀：`EXPO_PUBLIC_DEEPSEEK_API_KEY`
   - 或者使用 `babel-plugin-dotenv` 插件

## 🐛 常见问题

### 问题1: 推送时提示需要身份验证

**解决方案**：
- 使用 Personal Access Token（推荐）
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. 生成新 token，勾选 `repo` 权限
  3. 使用 token 作为密码：`git push`
- 或配置 SSH 密钥

### 问题2: 路径包含中文字符导致命令失败

**解决方案**：
- 使用部署脚本（会自动处理路径问题）
- 或使用 Git Bash 替代 PowerShell

### 问题3: 推送时提示 "remote origin already exists"

**解决方案**：
```powershell
# 查看现有远程仓库
git remote -v

# 删除旧的远程仓库
git remote remove origin

# 添加新的远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

## 📝 后续操作

部署成功后，您可以：

1. **设置 GitHub Pages**（如果是 Web 应用）
2. **配置 GitHub Actions** 实现自动化部署
3. **添加 GitHub Issues 模板**
4. **设置分支保护规则**
5. **添加协作者**

## 🆘 需要帮助？

如果遇到问题，请：
1. 检查 Git 错误消息
2. 查看 [GitHub 文档](https://docs.github.com)
3. 提交 Issue 到项目仓库

---

祝部署顺利！🎉
