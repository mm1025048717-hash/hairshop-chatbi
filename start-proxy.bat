@echo off
chcp 65001 >nul
echo ========================================
echo   启动 DeepSeek API 代理服务器
echo ========================================
echo.
cd /d "%~dp0"
node server\proxy.js
pause


