@echo off
setlocal
rem Najde Python dodávaný s KiCadem (obsahuje modul pcbnew) – KiCad 9, 8 nebo 7
set "KPY="
for %%V in (9.0 8.0 7.0) do (
  if not defined KPY if exist "%ProgramFiles%\KiCad\%%V\bin\python.exe" set "KPY=%ProgramFiles%\KiCad\%%V\bin\python.exe"
)
if not defined KPY (
  echo KiCad nenalezen v "%ProgramFiles%\KiCad". Nainstalujte KiCad 8 nebo 9 z https://www.kicad.org/download/windows/
  exit /b 1
)
cd /d "%~dp0"
rem Schéma hlavní desky a modulu ULA, netlisty, BOM, seznam k ověření, náhledy SVG
"%KPY%" gen.py
"%KPY%" gen.py modul
