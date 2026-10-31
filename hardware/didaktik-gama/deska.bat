@echo off
chcp 65001 >nul
setlocal
rem Najde Python dodávaný s KiCadem (obsahuje modul pcbnew) – KiCad 10, 9, 8 nebo 7
set "KPY="
for %%V in (10.0 9.0 8.0 7.0) do (
  if not defined KPY if exist "%ProgramFiles%\KiCad\%%V\bin\python.exe" set "KPY=%ProgramFiles%\KiCad\%%V\bin\python.exe"
)
if not defined KPY (
  echo KiCad nenalezen v "%ProgramFiles%\KiCad". Nainstalujte KiCad 10 (nebo 9) z https://www.kicad.org/download/windows/
  exit /b 1
)
cd /d "%~dp0"
rem POZOR: přepíše didaktik_gama.kicad_pcb a ula_cpld_modul.kicad_pcb (i natrasované cesty)!
choice /M "Opravdu znovu vytvořit obě desky (ztratí se vedené cesty)"
if errorlevel 2 exit /b 0
"%KPY%" gen_pcb.py
"%KPY%" gen_pcb_modul.py
