# 全自动 GitHub 部署脚本
# 使用方法: .\auto-deploy.ps1
# 支持配置文件: deploy-config.json

param(
    [string]$RepoUrl = "",
    [string]$CommitMessage = "",
    [switch]$Force = $false
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🚀 全自动 GitHub 部署工具" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 获取项目目录
$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = Get-Location
}
Set-Location $projectDir

# 读取配置文件
$configPath = Join-Path $projectDir "deploy-config.json"
$config = $null
if (Test-Path $configPath) {
    try {
        $configContent = Get-Content $configPath -Raw -Encoding UTF8
        $config = $configContent | ConvertFrom-Json
        Write-Host "✅ 已加载配置文件" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  配置文件格式错误，将使用默认设置" -ForegroundColor Yellow
    }
}

# 检查 Git 是否安装
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: Git 未安装" -ForegroundColor Red
        Write-Host "请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装或无法访问" -ForegroundColor Red
    exit 1
}

# 配置 Git 用户信息（如果需要）
if ($config -and $config.git.user.name -and $config.git.user.email) {
    $currentName = git config user.name 2>&1
    $currentEmail = git config user.email 2>&1
    if (-not $currentName -or $currentName -match "error") {
        git config user.name $config.git.user.name
        Write-Host "✅ 已配置 Git 用户名: $($config.git.user.name)" -ForegroundColor Green
    }
    if (-not $currentEmail -or $currentEmail -match "error") {
        git config user.email $config.git.user.email
        Write-Host "✅ 已配置 Git 邮箱: $($config.git.user.email)" -ForegroundColor Green
    }
}

# 检查是否在 Git 仓库中
if (-not (Test-Path ".git")) {
    Write-Host "`n📦 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    $branchName = if ($config -and $config.github.branch) { $config.github.branch } else { "main" }
    git branch -M $branchName
    Write-Host "✅ Git 仓库已初始化 (分支: $branchName)" -ForegroundColor Green
}

# 检查工作区状态
Write-Host "`n📋 检查工作区状态..." -ForegroundColor Yellow
$statusOutput = git status --porcelain
if ($statusOutput) {
    Write-Host "发现未提交的更改:" -ForegroundColor Yellow
    Write-Host $statusOutput
    
    # 自动提交
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $prefix = if ($config -and $config.github.commitMessagePrefix) { 
            $config.github.commitMessagePrefix 
        } else { 
            "部署到GitHub: " 
        }
        $CommitMessage = "$prefix$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    Write-Host "`n📝 自动提交更改..." -ForegroundColor Yellow
    git add .
    git commit -m $CommitMessage
    Write-Host "✅ 更改已提交: $CommitMessage" -ForegroundColor Green
} else {
    Write-Host "✅ 工作区干净，没有未提交的更改" -ForegroundColor Green
}

# 检查远程仓库
Write-Host "`n🔍 检查远程仓库配置..." -ForegroundColor Yellow
$remotes = git remote -v
$hasOrigin = $false

if ($remotes) {
    $hasOrigin = $remotes -match "origin"
    if ($hasOrigin) {
        Write-Host "当前远程仓库:" -ForegroundColor Cyan
        Write-Host $remotes
        $currentUrl = (git remote get-url origin 2>&1)
        Write-Host "`n✅ 已配置远程仓库: $currentUrl" -ForegroundColor Green
    }
}

# 如果没有远程仓库或提供了新的 URL，尝试从配置文件读取
if (-not $RepoUrl -and $config -and $config.github.repository) {
    $RepoUrl = $config.github.repository
    if ($RepoUrl -and -not $RepoUrl.StartsWith("http") -and -not $RepoUrl.StartsWith("git@")) {
        # 如果不是完整 URL，尝试构建
        $RepoUrl = "https://github.com/$RepoUrl.git"
    }
}

# 如果没有远程仓库或提供了新的 URL
if (-not $hasOrigin -or $RepoUrl -or $Force) {
    if ($RepoUrl) {
        # 使用提供的 URL
        if ($hasOrigin) {
            Write-Host "`n🔄 更新远程仓库地址..." -ForegroundColor Yellow
            git remote set-url origin $RepoUrl
        } else {
            Write-Host "`n➕ 添加远程仓库..." -ForegroundColor Yellow
            git remote add origin $RepoUrl
        }
        Write-Host "✅ 远程仓库已配置: $RepoUrl" -ForegroundColor Green
        
        # 保存到配置文件
        if (-not $config) {
            $config = @{
                github = @{
                    repository = $RepoUrl
                    branch = "main"
                    autoCommit = $true
                    commitMessagePrefix = "🚀 自动部署: "
                }
                git = @{
                    user = @{
                        name = ""
                        email = ""
                    }
                }
                ignorePatterns = @("node_modules", ".expo", "dist", ".env")
            }
        } elseif ($config.github.repository -ne $RepoUrl) {
            $config.github.repository = $RepoUrl
        }
        
        try {
            $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
            Write-Host "💾 已保存/更新配置文件" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  保存配置文件失败: $_" -ForegroundColor Yellow
        }
    } else {
        # 提示用户输入
        Write-Host "`n⚠️  尚未配置远程仓库" -ForegroundColor Yellow
        Write-Host "`n请提供 GitHub 仓库地址:" -ForegroundColor Cyan
        Write-Host "示例: https://github.com/username/repo-name.git" -ForegroundColor Gray
        Write-Host "或者: git@github.com:username/repo-name.git" -ForegroundColor Gray
        Write-Host "或者: username/repo-name (会自动补全为完整地址)" -ForegroundColor Gray
        
        $inputUrl = Read-Host "`n仓库地址 (直接回车跳过，稍后手动配置)"
        
        if ($inputUrl) {
            # 如果输入的是简短格式，补全为完整 URL
            if (-not $inputUrl.StartsWith("http") -and -not $inputUrl.StartsWith("git@")) {
                $inputUrl = "https://github.com/$inputUrl.git"
            }
            
            git remote add origin $inputUrl
            Write-Host "✅ 远程仓库已添加: $inputUrl" -ForegroundColor Green
            $RepoUrl = $inputUrl
            
            # 保存到配置文件
            if (-not $config) {
                $config = @{
                    github = @{
                        repository = $RepoUrl
                        branch = "main"
                        autoCommit = $true
                        commitMessagePrefix = "🚀 自动部署: "
                    }
                    git = @{
                        user = @{
                            name = ""
                            email = ""
                        }
                    }
                    ignorePatterns = @("node_modules", ".expo", "dist", ".env")
                }
            } else {
                $config.github.repository = $RepoUrl
            }
            try {
                $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
                Write-Host "💾 已保存配置到 deploy-config.json" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  保存配置文件失败: $_" -ForegroundColor Yellow
            }
        } else {
            Write-Host "`n⏭️  跳过远程仓库配置" -ForegroundColor Yellow
            Write-Host "您可以稍后使用以下命令手动配置:" -ForegroundColor Cyan
            Write-Host "   git remote add origin <您的仓库地址>" -ForegroundColor Gray
            $branchName = if ($config -and $config.github.branch) { $config.github.branch } else { "main" }
            Write-Host "   git push -u origin $branchName" -ForegroundColor Gray
            exit 0
        }
    }
}

# 推送到 GitHub
if ($RepoUrl -or $hasOrigin) {
    Write-Host "`n🚀 正在推送到 GitHub..." -ForegroundColor Yellow
    
    # 获取分支名
    $branchName = if ($config -and $config.github.branch) { $config.github.branch } else { "main" }
    
    # 尝试推送
    $pushOutput = git push -u origin $branchName 2>&1
    $pushOutputString = $pushOutput | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 部署成功！" -ForegroundColor Green
        if ($RepoUrl) {
            Write-Host "您的代码已推送到: $RepoUrl" -ForegroundColor Cyan
        } else {
            $remoteUrl = git remote get-url origin
            Write-Host "您的代码已推送到: $remoteUrl" -ForegroundColor Cyan
        }
    } else {
        Write-Host "`n❌ 推送失败" -ForegroundColor Red
        Write-Host $pushOutputString
        
        # 检查常见错误
        if ($pushOutputString -match "authentication") {
            Write-Host "`n💡 身份验证失败，请使用以下方式之一:" -ForegroundColor Yellow
            Write-Host "1. 使用 Personal Access Token (推荐)" -ForegroundColor Cyan
            Write-Host "   - GitHub → Settings → Developer settings → Personal access tokens" -ForegroundColor Gray
            Write-Host "   - 生成新 token，勾选 'repo' 权限" -ForegroundColor Gray
            Write-Host "   - 推送时使用 token 作为密码" -ForegroundColor Gray
            Write-Host "`n2. 配置 SSH 密钥" -ForegroundColor Cyan
            Write-Host "   - 参考: https://docs.github.com/en/authentication/connecting-to-github-with-ssh" -ForegroundColor Gray
        } elseif ($pushOutputString -match "remote.*already exists" -or $pushOutputString -match "rejected" -or $pushOutputString -match "non-fast-forward") {
            Write-Host "`n💡 远程仓库已存在内容，可能需要先拉取或强制推送" -ForegroundColor Yellow
            $branchName = if ($config -and $config.github.branch) { $config.github.branch } else { "main" }
            Write-Host "选项1: 先拉取再推送 (推荐)" -ForegroundColor Cyan
            Write-Host "   git pull origin $branchName --rebase" -ForegroundColor Gray
            Write-Host "   git push -u origin $branchName" -ForegroundColor Gray
            Write-Host "`n选项2: 强制推送 (谨慎使用)" -ForegroundColor Cyan
            Write-Host "   git push -u origin $branchName --force" -ForegroundColor Gray
            Write-Host "`n⚠️  注意: 强制推送会覆盖远程仓库内容" -ForegroundColor Red
        } else {
            Write-Host "`n请查看上面的错误信息并手动解决" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`n⏭️  未配置远程仓库，跳过推送" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ 部署脚本执行完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
