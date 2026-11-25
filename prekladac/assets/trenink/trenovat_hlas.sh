#!/usr/bin/env bash
# Trénink vlastního hlasu Piper v tomto počítači (Windows → WSL Ubuntu, grafika NVIDIA).
# Spouští ho Překladač (Nastavení → Součásti → Vlastní hlas → Trénovat v tomto počítači).
#
#   bash trenovat_hlas.sh --system              # jednou jako root: balíčky Ubuntu (espeak-ng, překladač C…)
#   bash trenovat_hlas.sh SLOŽKA                # instalace (jen poprvé) + trénink; po přerušení pokračuje
#   bash trenovat_hlas.sh SLOŽKA --export       # hlas z dosavadního průběhu (ukázka kdykoli, i během tréninku)
#   bash trenovat_hlas.sh SLOŽKA --znovu        # začít znovu od Jirky (nové nahrávky)
#   volitelně: --epochy 1500   --davka 8
#
# SLOŽKA (cesta ve WSL, např. /mnt/c/Users/…/trenink_hlasu/muj_hlas) obsahuje ZIP ze studia.
# Hotový hlas se uloží do SLOŽKA/hotovo/ (jméno.onnx + jméno.onnx.json) a Překladač ho načte.
set -euo pipefail
export PATH="$PATH:/usr/lib/wsl/lib"  # nvidia-smi ve WSL (Ubuntu i Debian)
export PIP_RETRIES=10 PIP_DEFAULT_TIMEOUT=60  # velké balíčky (PyTorch): při výpadku spojení zkoušet déle

if [[ "${1:-}" == "--system" ]]; then
  if command -v espeak-ng > /dev/null && command -v cmake > /dev/null && command -v git > /dev/null \
      && python3 -c "import venv, ensurepip" 2> /dev/null; then
    exit 0  # už nainstalováno
  fi
  echo "== Instaluji balíčky Linuxu (jen poprvé, 5–15 minut – průběh se vypisuje) =="
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y espeak-ng build-essential cmake ninja-build git curl ca-certificates python3 python3-venv python3-dev python3-pip unzip
  echo "✓ Balíčky Linuxu jsou nainstalované."
  exit 0
fi

SLOZKA="${1:?Chybí složka s nahrávkami (ZIP ze studia).}"
shift
EPOCHY=2000
DAVKA=""
MODE=trenink
while [[ $# -gt 0 ]]; do
  case "$1" in
    --export) MODE=export ;;
    --znovu) MODE=znovu ;;
    --epochy) EPOCHY="$2"; shift ;;
    --davka) DAVKA="$2"; shift ;;
    *) echo "Neznámá volba: $1"; exit 2 ;;
  esac
  shift
done

HOME_T="$HOME/piper-trenink"          # rychlý disk Linuxu: instalace, data, průběh
VENV="$HOME_T/venv"
REPO="$HOME_T/piper1-gpl"
mkdir -p "$HOME_T" "$SLOZKA/hotovo"
LOG="$SLOZKA/trenink.log"

if ! command -v nvidia-smi > /dev/null 2>&1; then
  echo "⚠ Grafická karta NVIDIA není ve WSL vidět (nvidia-smi chybí)."
  echo "  Nainstalujte ve Windows aktuální ovladač NVIDIA (GeForce Experience nebo nvidia.com) a restartujte počítač."
  exit 1
fi
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# ---------------------------------------------------------------- instalace (jen poprvé, asi 10 minut)
if [[ ! -f "$HOME_T/.hotovo-instalace" ]]; then
  echo "== Instalace trénování Piper (jen poprvé, asi 10 minut) =="
  for p in espeak-ng cmake git; do
    command -v "$p" > /dev/null || { echo "⚠ Chybí $p – spusťte nejdřív: bash trenovat_hlas.sh --system (jako root)"; exit 1; }
  done
  if ! getent hosts pypi.org > /dev/null; then
    echo "⚠ Linux (WSL) nemá připojení k internetu (nefunguje DNS). Návod: v Debianu"
    echo "  echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf   a zkuste to znovu."
    exit 1
  fi
  python3 -m venv "$VENV"
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  pip install -q --upgrade pip wheel
  echo "Stahuji Piper…"
  [[ -d "$REPO/.git" ]] || { rm -rf "$REPO"; git clone -q https://github.com/OHF-Voice/piper1-gpl.git "$REPO"; }
  cd "$REPO"
  echo "Stahuji PyTorch a knihovny (asi 3–4 GB) – průběh se vypisuje:"
  pip install --progress-bar on -e '.[train]' 2>&1 | grep --line-buffered -E 'Collecting|Downloading|Installing|Successfully|ERROR|error' || true
  python3 -c 'import torch, lightning' 2>/dev/null || { echo "❌ Instalace knihoven se nepovedla – spusťte příkaz znovu (naváže)."; exit 1; }
  echo "Sestavuji součásti…"
  ./build_monotonic_align.sh > "$HOME_T/build.log" 2>&1
  pip install -q scikit-build && python3 setup.py build_ext --inplace >> "$HOME_T/build.log" 2>&1 || true
  python3 - <<'PY'
# espeakbridge (převod textu na hlásky): když se nesestavil, vezme se hotový z oficiálního balíčku Piper
import glob, os, re, shutil, subprocess, sys, tempfile, zipfile
src = os.path.join(os.getcwd(), 'src', 'piper')
if not glob.glob(src + '/espeakbridge*.so'):
    ver = re.search(r'version="([^"]+)"', open('setup.py', encoding='utf-8').read())
    pkg = 'piper-tts==' + ver.group(1) if ver else 'piper-tts'
    tmp = tempfile.mkdtemp()
    subprocess.run([sys.executable, '-m', 'pip', 'download', pkg, '--no-deps', '-q', '-d', tmp], check=True)
    z = zipfile.ZipFile(glob.glob(tmp + '/piper_tts-*.whl')[0])
    for n in z.namelist():
        if n.startswith('piper/espeakbridge') or n.startswith('piper/espeak-ng-data/'):
            z.extract(n, tmp + '/x')
    shutil.copy(glob.glob(tmp + '/x/piper/espeakbridge*.so')[0], src)
    shutil.rmtree(src + '/espeak-ng-data', ignore_errors=True)
    shutil.copytree(tmp + '/x/piper/espeak-ng-data', src + '/espeak-ng-data')
PY
  python3 -c "
import torch
from piper.phonemize_espeak import EspeakPhonemizer
assert torch.cuda.is_available(), 'PyTorch nevidí grafiku NVIDIA'
print('✓ Instalace hotová:', torch.cuda.get_device_name(0), '·', EspeakPhonemizer().phonemize('cs', 'Dobrý den.')[0][:6])
"
  pip install -q piper-tts huggingface_hub
  touch "$HOME_T/.hotovo-instalace"
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"
cd "$HOME_T"

# ---------------------------------------------------------------- data: všechny ZIPy ve složce → jeden vstup
VOICE=$(python3 - "$SLOZKA" "$HOME_T/data" <<'PY'
import glob, hashlib, os, shutil, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
zips = sorted(glob.glob(src + '/*.zip'), key=os.path.getmtime)
if not zips:
    sys.exit('Ve složce není žádný ZIP s nahrávkami – v Překladači ho vytvoří tlačítko Trénovat v tomto počítači.')
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out + '/wavs')
lines, seen, names = [], set(), []
for k, z in enumerate(zips):
    tmp = f'{out}/_zip{k}'
    zipfile.ZipFile(z).extractall(tmp)
    for meta in glob.glob(tmp + '/*/metadata.csv'):
        base = os.path.dirname(meta)
        names.append(os.path.basename(base))
        for line in open(meta, encoding='utf-8'):
            wav, _, text = line.rstrip('\n').partition('|')
            if not text or text.lower() in seen or not os.path.isfile(f'{base}/wavs/{wav}'):
                continue
            seen.add(text.lower())
            new = f'{len(lines) + 1:05d}.wav'
            shutil.copy(f'{base}/wavs/{wav}', f'{out}/wavs/{new}')
            lines.append(f'{new}|{text}')
    shutil.rmtree(tmp)
body = '\n'.join(lines) + '\n'
open(out + '/metadata.csv', 'w', encoding='utf-8').write(body)
open(out + '/otisk', 'w').write(hashlib.sha1(body.encode()).hexdigest())
voice = names[-1] if names else 'muj_hlas'
print(f'ZIPů: {len(zips)} · hlas: {voice} · vět: {len(lines)}', file=sys.stderr)
print(voice)
PY
)
WORK="$HOME_T/prace/$VOICE"
mkdir -p "$WORK"

export_voice() {
  local ck
  ck=$(ls -t "$WORK"/lightning_logs/*/checkpoints/last.ckpt 2>/dev/null | head -1 || true)
  if [[ -z "$ck" ]]; then
    echo "⚠ Zatím není uložený žádný průběh – nechte trénink běžet aspoň jednu epochu."
    return 1
  fi
  echo "== Export hlasu z: $ck =="
  python3 -m piper.train.export_onnx --checkpoint "$ck" --output-file "$SLOZKA/hotovo/$VOICE.onnx"
  cp "$WORK/$VOICE.onnx.json" "$SLOZKA/hotovo/$VOICE.onnx.json"
  python3 - "$SLOZKA/hotovo/$VOICE.onnx.json" "$VOICE" <<'PY'
import json, sys
p, name = sys.argv[1], sys.argv[2]
c = json.load(open(p, encoding='utf-8'))
c['dataset'] = name
json.dump(c, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
PY
  echo "Dobrý den, tohle je můj vlastní hlas v Překladači." | piper -m "$SLOZKA/hotovo/$VOICE.onnx" -f "$SLOZKA/hotovo/ukazka.wav" > /dev/null 2>&1 || true
  echo "✓ Hlas uložen: $SLOZKA/hotovo/$VOICE.onnx (ukázka: hotovo/ukazka.wav)"
  echo "  V Překladači klikněte na „📥 Načíst natrénovaný hlas“."
}

if [[ "$MODE" == "export" ]]; then
  export_voice
  exit $?
fi

# ---------------------------------------------------------------- výchozí hlas Jirka (stáhne se jen jednou)
JIRKA="$HOME_T/jirka-start.ckpt"
if [[ ! -f "$JIRKA" ]]; then
  echo "== Stahuji výchozí hlas Jirka (849 MB, jen jednou) =="
  python3 - "$JIRKA" <<'PY'
import os, shutil, sys
from huggingface_hub import hf_hub_download
path = 'cs/cs_CZ/jirka/medium/epoch=2099-step=92400.ckpt'
last = None
for typ in ('model', 'dataset'):
    try:
        f = hf_hub_download('rhasspy/piper-checkpoints', path, repo_type=typ, token=False)
        shutil.copy(f, sys.argv[1] + '.part')
        os.replace(sys.argv[1] + '.part', sys.argv[1])
        break
    except Exception as e:  # noqa: BLE001
        last = e
else:
    sys.exit(f'Jirku se nepodařilo stáhnout: {last}')
PY
fi

# nové nahrávky (jiný otisk dat) nebo --znovu → začít od Jirky
if [[ "$MODE" == "znovu" ]] || { [[ -f "$WORK/otisk" ]] && ! cmp -s "$WORK/otisk" "$HOME_T/data/otisk"; }; then
  echo "== Začínám znovu od Jirky (nové nahrávky nebo --znovu) =="
  rm -rf "$WORK/lightning_logs" "$HOME_T/cache"
fi
cp "$HOME_T/data/otisk" "$WORK/otisk"

if [[ -z "$DAVKA" ]]; then  # podle paměti grafiky: 8 GB → 12, 12 GB a víc → 16, méně → 8
  MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)
  if (( MEM >= 11000 )); then DAVKA=16; elif (( MEM >= 7500 )); then DAVKA=12; else DAVKA=8; fi
fi

echo "Epoch $EPOCHY. Přerušit: Ctrl+C (průběh zůstane, příště se pokračuje)."
echo "Ukázku hlasu si můžete kdykoli udělat v Překladači tlačítkem „🔊 Ukázka z průběhu“."
while true; do
  LAST=$(ls -t "$WORK"/lightning_logs/*/checkpoints/last.ckpt 2>/dev/null | head -1 || true)
  if [[ -n "$LAST" ]]; then
    echo "== Pokračuji z: $LAST (dávka $DAVKA) =="
    START=(--ckpt_path "$LAST")
  else
    echo "== Začínám z hlasu Jirka (dávka $DAVKA) =="
    START=(--model.warmstart_ckpt "$JIRKA")
  fi
  set +e
  python3 -m piper.train fit \
    --data.voice_name "$VOICE" --data.csv_path "$HOME_T/data/metadata.csv" --data.audio_dir "$HOME_T/data/wavs" \
    --model.sample_rate 22050 --data.espeak_voice cs --data.cache_dir "$HOME_T/cache" \
    --data.config_path "$WORK/$VOICE.onnx.json" --data.batch_size "$DAVKA" \
    --trainer.max_epochs "$EPOCHY" --trainer.default_root_dir "$WORK" "${START[@]}" 2>&1 \
    | tee "$LOG" | grep --line-buffered -E "Epoch|Error|error|CUDA out of memory"
  RC=${PIPESTATUS[0]}
  set -e
  if grep -q "CUDA out of memory" "$LOG" && (( DAVKA > 4 )); then
    DAVKA=$(( DAVKA > 8 ? 8 : DAVKA / 2 ))
    echo "⚠ Grafice došla paměť – zkouším znovu s menší dávkou ($DAVKA)."
    continue
  fi
  break
done
if [[ $RC -ne 0 ]]; then
  echo "❌ Trénink skončil chybou (kód $RC). Konec výpisu (celý v trenink.log):"
  tail -n 30 "$LOG"
  exit $RC
fi
echo "✓ Trénink doběhl ($EPOCHY epoch)."
export_voice
