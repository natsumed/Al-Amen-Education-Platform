@echo off
title EduTunisia Platform
cd /d "%~dp0"

echo.
echo  =============================================
echo    EduTunisia - Plateforme Educative
echo  =============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js non trouve. Installe Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules\" (
    echo [1/3] Installation des dependances...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] npm install a echoue.
        pause
        exit /b 1
    )
    echo        Termine.
) else (
    echo [1/3] Dependances deja installees.
)

:: Generate Prisma client
echo.
echo [2/3] Generation du client Prisma...
call npx prisma generate
echo.

:: Seed database if empty
echo [3/3] Verification de la base de donnees...
call npx tsx prisma/seed.ts 2>nul

echo.
echo  =============================================
echo    Demarrage sur http://localhost:3000
echo    Presse Ctrl+C pour arreter
echo  =============================================
echo.
echo  Comptes de test:
echo    Admin   : admin@edutunisia.tn / admin123
echo    Teacher : teacher@edutunisia.tn / teacher123
echo    Student : student@edutunisia.tn / student123
echo.

start http://localhost:3000
call npm run dev
pause
