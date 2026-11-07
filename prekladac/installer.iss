; Instalátor Překladače (Inno Setup 6). Sestavuje ho .github/workflows/prekladac.yml:
;   build\app\         – Prekladac.exe a jeho knihovny (PyInstaller --onedir)
;   build\Calibre2\    – Calibre (ebook-convert.exe, calibre-customize.exe…)
;   build\Tesseract-OCR\ – Tesseract a jazyky OCR

#ifndef AppVersion
  #define AppVersion "1.0"
#endif

[Setup]
AppId={{6C0D3E52-6B54-4C0B-9F1E-5F0E8F4B7A11}
AppName=Překladač knih a dokumentů
AppVersion={#AppVersion}
AppPublisher=Micha741
AppPublisherURL=https://github.com/Micha741/Micha741/tree/main/prekladac
DefaultDirName={autopf}\Prekladac
DefaultGroupName=Překladač
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=Prekladac-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; instalace bez práv správce (do %LOCALAPPDATA%\Programs); správce si může zvolit instalaci pro všechny
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\Prekladac.exe
UninstallDisplayName=Překladač knih a dokumentů
LicenseFile=THIRD_PARTY.txt

[Languages]
Name: "czech"; MessagesFile: "compiler:Languages\Czech.isl"

[Tasks]
Name: "desktopicon"; Description: "Vytvořit zástupce na ploše"; GroupDescription: "Zástupci:"

[Files]
Source: "build\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\Calibre2\*"; DestDir: "{app}\Calibre2"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\Tesseract-OCR\*"; DestDir: "{app}\Tesseract-OCR"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "THIRD_PARTY.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Překladač"; Filename: "{app}\Prekladac.exe"
Name: "{group}\Odinstalovat Překladač"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Překladač"; Filename: "{app}\Prekladac.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Prekladac.exe"; Description: "Spustit Překladač"; Flags: nowait postinstall skipifsilent
