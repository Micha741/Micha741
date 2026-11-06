@echo off
REM Sestavi samostatny Prekladac.exe do slozky dist
cd /d "%~dp0"
python -m pip install -r requirements.txt pyinstaller || goto :err
python -m PyInstaller --noconfirm --onefile --windowed --name Prekladac --collect-all tkinterdnd2 --collect-all pypdfium2 --collect-all pypdfium2_raw app.py || goto :err
echo.
echo Hotovo: dist\Prekladac.exe
pause
exit /b 0
:err
echo Sestaveni selhalo.
pause
exit /b 1
