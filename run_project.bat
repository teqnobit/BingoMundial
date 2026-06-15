@echo off
echo ==================================================
echo Iniciando BingoMundial con Ngrok...
echo ==================================================

:: 1. Iniciar el Backend en una nueva ventana de PowerShell
echo Iniciando Backend (Puerto 8000)...
start "BingoMundial Backend" powershell -NoExit -Command "cd 'c:\Users\Ariel\Documents\BingoMundial\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 2. Iniciar el Frontend en una nueva ventana de PowerShell
echo Iniciando Frontend (Puerto 5173)...
start "BingoMundial Frontend" powershell -NoExit -Command "cd 'c:\Users\Ariel\Documents\BingoMundial\frontend'; npm run dev"

:: 3. Iniciar Ngrok en una nueva ventana de PowerShell
echo Iniciando Ngrok...
start "Ngrok Tunnel" powershell -NoExit -Command "cd 'c:\Users\Ariel\Documents\BingoMundial'; if (Test-Path .\ngrok.exe) { .\ngrok.exe http 5173 } else { Write-Host 'ngrok.exe no se encuentra en el directorio raiz de BingoMundial. Por favor, descargalo y guardalo aqui.' -ForegroundColor Red }"

echo ==================================================
echo Se han abierto las 3 ventanas de terminal correspondientes.
echo Mantenlas abiertas para que todo siga funcionando.
echo ==================================================
pause
