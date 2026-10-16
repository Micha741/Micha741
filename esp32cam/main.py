# Joy-Car + pico:ed: kamera a ovladani pres Wi-Fi
# Deska: Freenove ESP32-S3 WROOM (s kamerou), MicroPython s modulem "camera"
# (firmware pro ESP32-S3 z navodu Freenove) + picoweb.
# Thonny: ulozit na ESP32 jako main.py.
#
# Propojeni s pico:ed (seriova linka, obe desky maji 3,3 V logiku):
#   ESP32-S3 GPIO14 (RX)  <-  pico:ed P2  (TX)  - velka ploska na okraji pico:ed
#   ESP32-S3 GPIO21 (TX)  ->  pico:ed P13 (RX)  - signal konektoru serva 2 na Joy-Caru
#   ESP32-S3 GND          --  pico:ed GND
#
# Po spusteni otevri v prohlizeci adresu, kterou ESP32 vypise
# v Thonny ("network config: ('192.168.x.x', ...)").

import picoweb
import utime
import camera
import gc
from machine import UART

SSID = "Doma"          # Enter your WiFi name
PASSWORD = "*****"     # Enter your WiFi password

# serial link to pico:ed
uart = UART(1, baudrate=115200, tx=21, rx=14, rxbuf=1024)
status_line = b""      # last status from pico:ed, e.g. b"D:23.5;M:AUTO;L:1;R:1"
rx_buf = b""


def read_pico():
    global status_line, rx_buf
    n = uart.any()
    if n:
        rx_buf += uart.read(n)
        if len(rx_buf) > 300:
            rx_buf = rx_buf[-300:]
        while b"\n" in rx_buf:
            line, rx_buf = rx_buf.split(b"\n", 1)
            line = line.strip()
            if line:
                status_line = line


# Let ESP32 connect to wifi.
def wifi_connect():
    import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('connecting to network...')
        wlan.connect(SSID, PASSWORD)
    start = utime.time()
    while not wlan.isconnected():
        utime.sleep(1)
        if utime.time() - start > 5:
            print("connect timeout!")
            break
    if wlan.isconnected():
        print('network config:', wlan.ifconfig())


# Initializing the Camera
def camera_init():
    camera.deinit()
    # camera pins of the Freenove ESP32-S3 WROOM (see its pinout: CAM_Y2..Y9 etc.)
    camera.init(0, d0=11, d1=9, d2=8, d3=10, d4=12, d5=18, d6=17, d7=16,
                format=camera.JPEG, framesize=camera.FRAME_VGA,
                xclk_freq=camera.XCLK_20MHz,
                href=7, vsync=6, reset=-1, pwdn=-1,
                sioc=5, siod=4, xclk=15, pclk=13, fb_location=camera.PSRAM)
    camera.framesize(camera.FRAME_VGA)
    camera.flip(1)
    camera.mirror(1)
    camera.saturation(0)
    camera.brightness(0)
    camera.contrast(0)
    camera.quality(10)
    camera.speffect(camera.EFFECT_NONE)
    camera.whitebalance(camera.WB_NONE)


INDEX_HTML = """<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Joy-Car</title>
<style>
  body { margin: 0; font-family: sans-serif; background: #111; color: #eee; text-align: center; }
  #wrap { position: relative; display: inline-block; max-width: 100%; }
  #cam { width: 100%; max-width: 640px; display: block; background: #000;
         transform: rotate(180deg); }
  #dist { position: absolute; top: 8px; left: 8px; padding: 4px 10px; border-radius: 6px;
          background: rgba(0,0,0,.6); font-size: 22px; font-weight: bold; }
  #mode { position: absolute; top: 8px; right: 8px; padding: 4px 10px; border-radius: 6px;
          background: rgba(0,0,0,.6); font-size: 16px; }
  .near { color: #ff5050; }
  .pad { display: grid; grid-template-columns: repeat(3, 80px); gap: 10px;
         justify-content: center; margin: 16px auto; }
  button { height: 70px; font-size: 30px; border: 0; border-radius: 12px;
           background: #333; color: #fff; touch-action: none; user-select: none; }
  button:active { background: #2a7; }
  .wide { grid-column: span 3; height: 50px; font-size: 18px; }
</style>
</head>
<body>
<div id="wrap">
  <img id="cam" src="/video" alt="kamera">
  <div id="dist">-- cm</div>
  <div id="mode">--</div>
</div>
<div class="pad">
  <span></span><button data-c="F">&#9650;</button><span></span>
  <button data-c="L">&#9664;</button><button data-c="S">&#9632;</button><button data-c="R">&#9654;</button>
  <span></span><button data-c="B">&#9660;</button><span></span>
  <button class="wide" id="auto">Automaticka jizda</button>
</div>
<script>
  function send(c) { fetch('/cmd?c=' + c).catch(function () {}); }
  var timer = null;
  function press(c) {
    release();
    send(c);
    // repeat while held: pico:ed stops the car if commands stop coming
    if (c !== 'S') timer = setInterval(function () { send(c); }, 300);
  }
  function release() {
    if (timer) { clearInterval(timer); timer = null; send('S'); }
  }
  document.querySelectorAll('button[data-c]').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(b.dataset.c); });
    b.addEventListener('pointerup', release);
    b.addEventListener('pointerleave', release);
  });
  document.getElementById('auto').addEventListener('click', function () { send('A'); });
  setInterval(function () {
    fetch('/status').then(function (r) { return r.text(); }).then(function (t) {
      var d = /D:([0-9.]+)/.exec(t), m = /M:(\\w+)/.exec(t);
      var el = document.getElementById('dist');
      if (d) {
        var v = parseFloat(d[1]);
        el.textContent = v >= 999 ? 'volno' : v.toFixed(0) + ' cm';
        el.className = v < 20 ? 'near' : '';
      }
      if (m) document.getElementById('mode').textContent = m[1] === 'AUTO' ? 'AUTO' : 'RUCNE';
    }).catch(function () {});
  }, 500);
</script>
</body>
</html>
"""


def index(req, resp):
    yield from picoweb.start_response(resp)
    yield from resp.awrite(INDEX_HTML)


# /cmd?c=F  (F/B/L/R = drive, S = stop, A = automatic mode, M = manual mode)
def cmd(req, resp):
    qs = req.qs or ""
    c = qs[2:3] if qs.startswith("c=") else ""
    if c and c in "FBLRSAM":
        uart.write(c + "\n")
        yield from picoweb.start_response(resp, content_type="text/plain")
        yield from resp.awrite("OK")
    else:
        yield from picoweb.http_error(resp, "400")


def status(req, resp):
    read_pico()
    yield from picoweb.start_response(resp, content_type="text/plain",
                                      headers={"Cache-Control": "no-store"})
    yield from resp.awrite(status_line)


# Send camera pictures
def send_frame():
    buf = camera.capture()
    yield (b'--frame\r\n'
           b'Content-Type: image/jpeg\r\n\r\n'
           + buf + b'\r\n')
    del buf
    gc.collect()


# Video transmission
def video(req, resp):
    yield from picoweb.start_response(resp, content_type="multipart/x-mixed-replace; boundary=frame")
    while True:
        yield from resp.awrite(next(send_frame()))
        gc.collect()


ROUTES = [
    ("/", index),
    ("/video", video),
    ("/cmd", cmd),
    ("/status", status),
]


if __name__ == '__main__':
    import ulogging as logging
    logging.basicConfig(level=logging.INFO)
    camera_init()
    wifi_connect()
    app = picoweb.WebApp(__name__, ROUTES)
    app.run(debug=0, port=80, host="0.0.0.0")
