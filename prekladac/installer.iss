; Instalátor Překladače (Inno Setup 6). Sestavuje ho .github/workflows/prekladac.yml:
;   build\app\         – Prekladac.exe a jeho knihovny (PyInstaller --onedir)
;   build\Tesseract-OCR\ – Tesseract a jazyky OCR
;   build\dict\        – český slovník Hunspell (kontrola pravopisu, návrhy slov)

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
; výchozí instalace pro všechny do C:\Program Files\Prekladac (Windows se zeptá na práva správce);
; v úvodním dialogu lze zvolit instalaci jen pro sebe bez práv správce (do %LOCALAPPDATA%\Programs)
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=commandline dialog
UninstallDisplayIcon={app}\Prekladac.exe
ChangesAssociations=yes
SetupIconFile=assets\icon.ico
; údaje souboru Prekladac-Setup.exe (Vlastnosti → Podrobnosti)
VersionInfoVersion={#AppVersion}
VersionInfoProductVersion={#AppVersion}
VersionInfoTextVersion={#AppVersion}
VersionInfoCompany=Micha741
VersionInfoCopyright=© 2026 Micha741
VersionInfoDescription=Překladač knih a dokumentů – instalátor
VersionInfoProductName=Překladač knih a dokumentů
VersionInfoProductTextVersion={#AppVersion}
UninstallDisplayName=Překladač knih a dokumentů
LicenseFile=THIRD_PARTY.txt

[Languages]
Name: "czech"; MessagesFile: "compiler:Languages\Czech.isl"

[Tasks]
Name: "desktopicon"; Description: "Vytvořit zástupce na ploše"; GroupDescription: "Zástupci:"
Name: "offlinemt"; Description: "Stáhnout offline překlad – angličtina → čeština a němčina → angličtina (asi 200 MB, překlad bez internetu; jde i později v Nastavení)"; GroupDescription: "Volitelné součásti:"; Flags: unchecked

[Files]
Source: "build\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\Tesseract-OCR\*"; DestDir: "{app}\Tesseract-OCR"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\dict\*"; DestDir: "{app}\dict"; Flags: ignoreversion
Source: "THIRD_PARTY.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
; skiny (*.skin) – dvojklikem se nainstalují do Překladače
Root: HKA; Subkey: "Software\Classes\.skin"; ValueType: string; ValueName: ""; ValueData: "Prekladac.Skin"; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.skin\OpenWithProgids"; ValueType: string; ValueName: "Prekladac.Skin"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\Prekladac.Skin"; ValueType: string; ValueName: ""; ValueData: "Skin pro Překladač"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\Prekladac.Skin\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\Prekladac.exe,0"
Root: HKA; Subkey: "Software\Classes\Prekladac.Skin\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Prekladac.exe"" ""%1"""

[Icons]
Name: "{group}\Překladač"; Filename: "{app}\Prekladac.exe"
Name: "{group}\Odinstalovat Překladač"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Překladač"; Filename: "{app}\Prekladac.exe"; Tasks: desktopicon

[Run]
; volitelné offline balíčky – stahují se do %APPDATA% přihlášeného uživatele (runasoriginaluser)
Filename: "{app}\Prekladac.exe"; Parameters: "--install-offline en_cs,de_en"; StatusMsg: "Stahuji offline překlad (asi 200 MB)…"; Tasks: offlinemt; Flags: runasoriginaluser waituntilterminated
Filename: "{app}\Prekladac.exe"; Description: "Spustit Překladač"; Flags: nowait postinstall skipifsilent
