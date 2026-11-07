@echo off
REM Spusti prekladac (vyzaduje Python 3.10+ a nainstalovane zavislosti)
cd /d "%~dp0"
python app.py %*
