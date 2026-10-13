# Diagnostika Joy-Car na pico:ed (CircuitPython)
# Ulozit docasne jako code.py na disk CIRCUITPY a otevrit v Mu okno Serial.
# 1) otestuje motory, 2) pak jen vypisuje senzory (auto stoji).

import time
import board
import busio
import digitalio
import pulseio

PWM_ADDR = 0x70
IO_ADDR = 0x38

i2c = busio.I2C(board.SCL, board.SDA, frequency=400000)
while not i2c.try_lock():
    pass

print("I2C zarizeni:", [hex(a) for a in i2c.scan()])

i2c.writeto(PWM_ADDR, bytes([0x00, 0x01]))
i2c.writeto(PWM_ADDR, bytes([0xE8, 0xAA]))


def drive(PWM0, PWM1, PWM2, PWM3):
    for channel, value in zip((0x02, 0x03, 0x04, 0x05), (PWM0, PWM1, PWM2, PWM3)):
        i2c.writeto(PWM_ADDR, bytes([channel, value]))


def test(nazev, PWM0, PWM1, PWM2, PWM3):
    print("TEST:", nazev)
    drive(PWM0, PWM1, PWM2, PWM3)
    time.sleep(1.5)
    drive(0, 0, 0, 0)
    time.sleep(1.5)


# --- 1) test motoru ---
time.sleep(3)  # cas postavit auto na zem / zvednout kola
test("dopredu (oba motory)", 40, 255, 40, 255)
test("jen levy motor dopredu", 40, 255, 0, 0)
test("jen pravy motor dopredu", 0, 0, 40, 255)

# --- 2) vypis senzoru ---
speed_left = digitalio.DigitalInOut(board.P14)
speed_right = digitalio.DigitalInOut(board.P15)

trigger = digitalio.DigitalInOut(board.P8)
trigger.direction = digitalio.Direction.OUTPUT
trigger.value = False
echo = pulseio.PulseIn(board.P12, maxlen=1, idle_state=False)
echo.pause()
echo.clear()


def get_distance():
    echo.clear()
    trigger.value = True
    time.sleep(0.00001)
    trigger.value = False
    echo.resume()
    start = time.monotonic()
    while len(echo) == 0:
        if time.monotonic() - start > 0.1:
            echo.pause()
            return 999
    echo.pause()
    duration = echo[0]
    if duration >= 65535:
        return 999
    return round(duration * 0.01715, 2)


buf = bytearray(1)
print("SENZORY (prekazka vlevo/vpravo: 0 = prekazka, 1 = volno)")
while True:
    i2c.readfrom_into(IO_ADDR, buf)
    value = buf[0]
    print(
        "bajt:", "{:08b}".format(value),
        "| prekazka L:", (value >> 5) & 1,
        "P:", (value >> 6) & 1,
        "| cara L/S/P:", (value >> 2) & 1, (value >> 3) & 1, (value >> 4) & 1,
        "| vzdalenost:", get_distance(), "cm",
    )
    time.sleep(0.5)
