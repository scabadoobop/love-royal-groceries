@echo off
echo 👑 Deploying Royal Groceries Frontend to GitHub Pages...
echo.

echo 📦 Building project...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Deploying to GitHub Pages...
call npm run deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Frontend deployed successfully!
    echo.
    echo 📝 Next steps:
    echo 1. Wait 1-2 minutes for GitHub Pages to update
    echo 2. Visit your site at: https://YOUR_USERNAME.github.io/love-royal-groceries
    echo 3. Make sure your backend is running and configured
    echo.
) else (
    echo ❌ Deployment failed!
)

pause


