# 使用 Personal Access Token 快速部署脚本
# 使用方法: .\deploy-with-token.ps1 -RepoUrl "仓库地址" -Token "您的token"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$CommitMessage = ""
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🚀 GitHub 快速部署 (使用 Token)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 获取项目目录
$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = Get-Location
}
Set-Location $projectDir

# 检查 Git
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: Git 未安装" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装或无法访问" -ForegroundColor Red
    exit 1
}

# 初始化仓库（如果需要）
if (-not (Test-Path ".git")) {
    Write-Host "`n📦 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✅ Git 仓库已初始化" -ForegroundColor Green
}

# 检查并提交更改
Write-Host "`n📋 检查工作区状态..." -ForegroundColor Yellow
$statusOutput = git status --porcelain
if ($statusOutput) {
    Write-Host "发现未提交的更改，正在提交..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "🚀 自动部署: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git add .
    git commit -m $CommitMessage
    Write-Host "✅ 更改已提交" -ForegroundColor Green
} else {
    Write-Host "✅ 工作区干净" -ForegroundColor Green
}

# 配置远程仓库
Write-Host "`n🔍 配置远程仓库..." -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes -match "origin") {
    git remote set-url origin $RepoUrl
    Write-Host "✅ 已更新远程仓库地址" -ForegroundColor Green
} else {
    git remote add origin $RepoUrl
    Write-Host "✅ 已添加远程仓库" -ForegroundColor Green
}

# 使用 Token 推送
Write-Host "`n🚀 正在推送到 GitHub..." -ForegroundColor Yellow

# 提取用户名（从 URL 或 token）
$username = ""
if ($RepoUrl -match "github\.com[:/]([^/]+)") {
    $username = $Matches[1]
} else {
    $username = Read-Host "请输入您的 GitHub 用户名"
}

# 构建带 token 的 URL
$repoUrlWithToken = $RepoUrl -replace "https://", "https://${Token}@"
$repoUrlWithToken = $repoUrlWithToken -replace "git@github.com:", "https://${Token}@github.com/"

Write-Host "正在推送到: $RepoUrl" -ForegroundColor Cyan

# 设置 credential helper（临时）
$env:GIT_TERMINAL_PROMPT = "0"
git remote set-url origin $repoUrlWithToken

# 推送
try {
    git push -u origin main 2>&1 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 部署成功！" -ForegroundColor Green
        Write-Host "您的代码已推送到: $RepoUrl" -ForegroundColor Cyan
        
        # 恢复原始 URL（移除 token）
        git remote set-url origin $RepoUrl
    } else {
        Write-Host "`n❌ 推送失败" -ForegroundColor Red
        # 恢复原始 URL
        git remote set-url origin $RepoUrl
        exit 1
    }
} catch {
    Write-Host "`n❌ 推送失败: $_" -ForegroundColor Red
    # 恢复原始 URL
    git remote set-url origin $RepoUrl
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ 部署完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
