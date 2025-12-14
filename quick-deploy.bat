@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub 自动部署工具
echo ========================================
echo.

REM 检查Git是否安装
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Git，请先安装 Git
    pause
    exit /b 1
)

REM 检查是否在Git仓库中
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在初始化 Git 仓库...
    git init
    git branch -M main
)

REM 检查工作区状态
echo 📋 检查工作区状态...
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo 发现未提交的更改，正在提交...
    git add .
    git commit -m "部署到GitHub: %date% %time%"
    echo ✅ 更改已提交
) else (
    echo ✅ 工作区干净
)

REM 检查远程仓库
echo.
echo 🔍 检查远程仓库配置...
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  尚未配置远程仓库
    echo.
    echo 请先创建 GitHub 仓库，然后运行以下命令：
    echo   git remote add origin https://github.com/你的用户名/仓库名.git
    echo   git push -u origin main
    echo.
    echo 或者直接提供仓库地址，我可以帮你配置：
    set /p REPO_URL="请输入 GitHub 仓库地址（直接回车跳过）: "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        echo ✅ 远程仓库已添加
        echo.
        echo 正在推送到 GitHub...
        git push -u origin main
        if %errorlevel% equ 0 (
            echo.
            echo 🎉 部署成功！
        ) else (
            echo.
            echo ❌ 推送失败，可能需要身份验证
            echo 请使用 Personal Access Token 作为密码
        )
    )
) else (
    echo ✅ 已配置远程仓库
    git remote -v
    echo.
    echo 正在推送到 GitHub...
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 部署成功！
    ) else (
        echo.
        echo ❌ 推送失败，请检查错误信息
    )
)

echo.
echo ========================================
pause
