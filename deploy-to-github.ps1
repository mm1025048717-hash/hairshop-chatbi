# 账掌柜项目 - GitHub 部署脚本
# 使用 PowerShell 执行

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  账掌柜项目 - GitHub 部署工具" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 检查是否在 Git 仓库中
try {
    $gitStatus = git status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: 当前目录不是 Git 仓库" -ForegroundColor Red
        Write-Host "正在初始化 Git 仓库..." -ForegroundColor Yellow
        git init
        git branch -M main
    }
} catch {
    Write-Host "❌ Git 未安装或无法访问" -ForegroundColor Red
    exit 1
}

# 检查工作区状态
Write-Host "`n📋 检查工作区状态..." -ForegroundColor Yellow
$statusOutput = git status --porcelain
if ($statusOutput) {
    Write-Host "发现未提交的更改:" -ForegroundColor Yellow
    Write-Host $statusOutput
    
    $commit = Read-Host "`n是否现在提交这些更改? (Y/n)"
    if ($commit -ne "n" -and $commit -ne "N") {
        $commitMsg = Read-Host "请输入提交信息 (直接回车使用默认信息)"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "部署到GitHub: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        git add .
        git commit -m $commitMsg
        Write-Host "✅ 更改已提交" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 工作区干净，没有未提交的更改" -ForegroundColor Green
}

# 检查远程仓库
Write-Host "`n🔍 检查远程仓库配置..." -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes) {
    Write-Host "当前远程仓库:" -ForegroundColor Cyan
    Write-Host $remotes
    
    $changeRemote = Read-Host "`n是否要更改远程仓库地址? (y/N)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote remove origin
        $remotes = $null
    } else {
        Write-Host "`n✅ 使用现有远程仓库" -ForegroundColor Green
        Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
        git push -u origin main
        Write-Host "`n🎉 部署完成！" -ForegroundColor Green
        exit 0
    }
}

# 如果没有远程仓库，引导用户配置
if (-not $remotes) {
    Write-Host "`n⚠️  尚未配置远程仓库" -ForegroundColor Yellow
    Write-Host "`n请选择操作:" -ForegroundColor Cyan
    Write-Host "1. 我已创建 GitHub 仓库，输入仓库地址"
    Write-Host "2. 我还没有创建仓库，稍后手动配置"
    
    $choice = Read-Host "`n请输入选项 (1/2)"
    
    if ($choice -eq "1") {
        Write-Host "`n请输入 GitHub 仓库地址:" -ForegroundColor Yellow
        Write-Host "示例: https://github.com/username/repo-name.git" -ForegroundColor Gray
        Write-Host "或者: git@github.com:username/repo-name.git" -ForegroundColor Gray
        $repoUrl = Read-Host "`n仓库地址"
        
        if ($repoUrl) {
            try {
                git remote add origin $repoUrl
                Write-Host "✅ 远程仓库已添加" -ForegroundColor Green
                
                Write-Host "`n正在推送到 GitHub..." -ForegroundColor Yellow
                git push -u origin main
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "`n🎉 部署成功！" -ForegroundColor Green
                    Write-Host "您的代码已推送到: $repoUrl" -ForegroundColor Cyan
                } else {
                    Write-Host "`n❌ 推送失败" -ForegroundColor Red
                    Write-Host "可能的原因:" -ForegroundColor Yellow
                    Write-Host "1. 需要身份验证（使用 Personal Access Token）"
                    Write-Host "2. 仓库地址不正确"
                    Write-Host "3. 远程仓库已存在内容（需要先 pull）"
                    Write-Host "`n请查看错误信息并手动解决，或参考 DEPLOY.md 文档" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "❌ 添加远程仓库失败: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ 未输入仓库地址" -ForegroundColor Red
        }
    } else {
        Write-Host "`n📝 手动配置步骤:" -ForegroundColor Cyan
        Write-Host "1. 在 GitHub 上创建新仓库"
        Write-Host "2. 使用以下命令添加远程仓库:" -ForegroundColor Yellow
        Write-Host "   git remote add origin <您的仓库地址>"
        Write-Host "3. 推送代码:" -ForegroundColor Yellow
        Write-Host "   git push -u origin main"
        Write-Host "`n详细说明请查看 DEPLOY.md 文件" -ForegroundColor Cyan
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  部署脚本执行完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
