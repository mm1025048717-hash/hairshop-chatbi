@echo off
chcp 65001 >nul
echo ========================================
echo   账掌柜 - 开发环境启动
echo ========================================
echo.
cd /d "%~dp0"

echo [1/2] 启动代理服务器...
start "DeepSeek Proxy" cmd /k "node server\proxy.js"

timeout /t 2 /nobreak >nul

echo [2/2] 启动 Expo Web...
npm run web


