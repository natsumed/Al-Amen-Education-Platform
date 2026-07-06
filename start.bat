@echo off
cd /d "%~dp0"
echo =============================================
echo    Al-Aman | A*A
echo =============================================
echo.
if not exist "node_modules\" (
    echo Installation dependances...
    npm install
)
echo Generation Prisma...
npx prisma generate
echo.
echo =============================================
echo    Lancement sur http://localhost:3000
echo    Ctrl+C pour arreter
echo =============================================
echo.
echo Comptes de test:
echo   admin@edutunisia.tn / admin123
echo   teacher@edutunisia.tn / teacher123
echo   student@edutunisia.tn / student123
echo.
start http://localhost:3000 2>nul
npm run dev
pause
