@echo off
REM Sestavi samostatny Prekladac.exe do slozky dist
cd /d "%~dp0"
python -m pip install -r requirements.txt pyinstaller || goto :err
python tools\make_version_info.py build\version_info.txt || goto :err
for /f "delims=" %%i in ('python -c "import sentencepiece,os;print(os.path.normpath(os.path.join(os.path.dirname(sentencepiece.__file__),os.pardir,'sentencepiece.libs')))"') do set SPLIBS=%%i
python -m PyInstaller --noconfirm --onedir --windowed --name Prekladac --add-binary "%SPLIBS%;sentencepiece.libs" --version-file build\version_info.txt --icon assets\icon.ico --add-data "assets;assets" --collect-all pypdfium2 --collect-all pypdfium2_raw --collect-all ctranslate2 --collect-all sentencepiece --collect-data sacremoses --hidden-import comtypes.client app.py || goto :err
echo.
echo Hotovo: dist\Prekladac\Prekladac.exe
pause
exit /b 0
:err
echo Sestaveni selhalo.
pause
exit /b 1
