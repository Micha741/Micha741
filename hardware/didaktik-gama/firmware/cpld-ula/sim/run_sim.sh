#!/bin/sh
# Simulace náhrady ULA (Icarus Verilog): testy + snímek obrazu sim/frame.ppm (a frame.png, je-li Python s PIL)
set -e
cd "$(dirname "$0")"
python3 mkscreen.py
iverilog -g2005 -o /tmp/gama_ula_sim tb_gama_ula.v ../src/gama_ula.v
vvp -n /tmp/gama_ula_sim | grep -v '^\$finish'
python3 -c "from PIL import Image; Image.open('frame.ppm').resize((896,624), Image.NEAREST).save('frame.png')" 2>/dev/null || true
