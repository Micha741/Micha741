# Joy-Car (Joy-IT) - vyhybani prekazkam + svetla + sipky na displeji pico:ed
# Verze pro ELECFREAKS pico:ed s firmwarem CircuitPython.
# Editor Mu 1.2: rezim "CircuitPython", ulozit jako code.py na disk CIRCUITPY.
#
# Piny pico:ed (stejne oznaceni jako na micro:bitu):
#   P19 = SCL, P20 = SDA  -> I2C k desce Joy-Car (motory, IR senzory)
#   P8  = trigger, P12 = echo -> ultrazvuk
#   P14, P15 -> snimace rychlosti (od revize 1.3)
#   P1, P13  -> serva
#   P0       -> RGB LED svetla (8x NeoPixel)

import time
import board
import busio
import digitalio
import pwmio
import neopixel_write

# define here your Joy Car Mainboard Revision
joycar_rev = 1.3

PWM_ADDR = 0x70  # PWM radic motoru
IO_ADDR = 0x38   # IO expander se senzory

# The ELECFREAKS "picoed" library (display, buttons, buzzer) opens the
# P19/P20 I2C bus itself when imported, so it must be imported first and
# its bus shared with the Joy-Car board. Without the library we open the bus.
try:
    import picoed
    i2c = picoed.i2c
    display = picoed.display
except Exception as e:
    print("knihovna picoed neni dostupna, displej nebude:", e)
    i2c = busio.I2C(board.SCL, board.SDA)
    display = None


# the bus may be shared with the display (pico:ed V1), so lock it per use
def i2c_write(addr, data):
    while not i2c.try_lock():
        pass
    try:
        i2c.writeto(addr, data)
    finally:
        i2c.unlock()


def i2c_read_into(addr, buf):
    while not i2c.try_lock():
        pass
    try:
        i2c.readfrom_into(addr, buf)
    finally:
        i2c.unlock()


# initialize PWM controller
i2c_write(PWM_ADDR, bytes([0x00, 0x01]))
i2c_write(PWM_ADDR, bytes([0xE8, 0xAA]))

# the deceleration of a motor bias can be used to compensate for different motor speeds
biasR = 0  # deceleration of the right motor in percent
biasL = 0  # deceleration of the left motor in percent

# if a motor turns the wrong way, set True to swap its direction
reverseR = False  # right motor (PWM0, PWM1): PWM0=40 PWM1=255 drives forward (tested)
reverseL = True   # left motor (PWM2, PWM3): if the car spins on the spot, change this


# control motors using the PWM controller
# PWM0 and PWM1 for the right motor and PWM2 and PWM3 for the left motor
def drive(PWM0, PWM1, PWM2, PWM3):
    if reverseR:
        PWM0, PWM1 = PWM1, PWM0
    if reverseL:
        PWM2, PWM3 = PWM3, PWM2
    factorR = (100 - biasR) / 100
    factorL = (100 - biasL) / 100
    values = (
        int(PWM0 * factorR),
        int(PWM1 * factorR),
        int(PWM2 * factorL),
        int(PWM3 * factorL),
    )
    # transmit value for PWM channel (0-255) to PWM controller
    for channel, value in zip((0x02, 0x03, 0x04, 0x05), values):
        i2c_write(PWM_ADDR, bytes([channel, value]))


# --- RGB LED lights (8x NeoPixel on P0) ---
# LED numbers - if a different LED lights up than expected, change them here
HEADLIGHTS = (0, 3)       # predni svetla
BACKLIGHTS = (5, 6)       # zadni svetla
INDICATOR_LEFT = (1, 4)   # levy blinkr
INDICATOR_RIGHT = (2, 7)  # pravy blinkr

WHITE = (60, 60, 60)
RED_DIM = (40, 0, 0)
RED = (255, 0, 0)
ORANGE = (255, 80, 0)
OFF = (0, 0, 0)

led_pin = digitalio.DigitalInOut(board.P0)
led_pin.direction = digitalio.Direction.OUTPUT
pixels = [OFF] * 8


def show_leds():
    buf = bytearray()
    for r, g, b in pixels:
        buf += bytes([g, r, b])  # NeoPixel expects GRB order
    neopixel_write.neopixel_write(led_pin, buf)


def set_leds(indices, color):
    for i in indices:
        pixels[i] = color


def lights_normal():
    set_leds(range(8), OFF)
    set_leds(HEADLIGHTS, WHITE)
    set_leds(BACKLIGHTS, RED_DIM)
    show_leds()


def lights_brake():
    set_leds(BACKLIGHTS, RED)
    show_leds()


# blink the indicator for the given time (replaces time.sleep while turning)
def blink(indicator, seconds):
    end = time.monotonic() + seconds
    on = True
    while time.monotonic() < end:
        set_leds(indicator, ORANGE if on else OFF)
        show_leds()
        on = not on
        time.sleep(0.25)
    lights_normal()


# speed sensors (revision 1.3 and newer)
speed_left = digitalio.DigitalInOut(board.P14)
speed_right = digitalio.DigitalInOut(board.P15)

sensor_buf = bytearray(1)


# get all sensor data
# bit 0 = SpeedLeft, bit 1 = SpeedRight, bit 2 = LineTrackerLeft,
# bit 3 = LineTrackerMiddle, bit 4 = LineTrackerRight,
# bit 5 = ObstclLeft, bit 6 = ObstclRight, bit 7 = free pin(7)
# (bit 8 = free (pin0) bit 9 = free (pin1)) - just with revision 1.3 or newer
def fetchSensorData():
    i2c_read_into(IO_ADDR, sensor_buf)
    data = {}
    for bit in range(8):
        data[bit] = bool(sensor_buf[0] & (1 << bit))

    # after main board revision 1.3, the speed sensors are on separate pins
    if joycar_rev >= 1.3:
        data[8], data[9] = data[0], data[1]
        data[0] = speed_left.value
        data[1] = speed_right.value
    return data


# set to True once a working ultrasonic sensor is connected
USE_ULTRASONIC = False

# pins for ultrasonic sensor
trigger = digitalio.DigitalInOut(board.P8)
trigger.direction = digitalio.Direction.OUTPUT
trigger.value = False

echo = digitalio.DigitalInOut(board.P12)
echo.direction = digitalio.Direction.INPUT
echo.pull = digitalio.Pull.DOWN  # no sensor / no signal -> reads 0, not noise


# one measurement: length of the echo pulse in microseconds (None = no echo)
def measure_echo_us():
    # trigger pulse must be at least 10 us; time.sleep() is too coarse for that,
    # so wait actively (about 20-50 us)
    trigger.value = True
    t = time.monotonic_ns()
    while time.monotonic_ns() - t < 20000:
        pass
    trigger.value = False
    t0 = time.monotonic_ns()
    while not echo.value:
        if time.monotonic_ns() - t0 > 30000000:  # 30 ms without echo
            return None
    start = time.monotonic_ns()
    while echo.value:
        if time.monotonic_ns() - start > 30000000:
            return None
    return (time.monotonic_ns() - start) / 1000


# distance from ultrasonic sensor in cm (999 = nothing measured)
# median of 3 measurements, pulses shorter than ~2 cm are ignored as noise
def get_distance():
    if not USE_ULTRASONIC:
        return 999
    values = []
    for _ in range(3):
        us = measure_echo_us()
        if us is not None and us > 120:
            # speed of sound 343 m/s, there and back -> 0.01715 cm/us
            values.append(us * 0.01715)
        time.sleep(0.01)
    if not values:
        return 999
    values.sort()
    return round(values[len(values) // 2], 1)


# servos: 100 Hz (10 ms period), pulse 1-2 ms
servo1 = pwmio.PWMOut(board.P1, frequency=100, duty_cycle=0)
servo2 = pwmio.PWMOut(board.P13, frequency=100, duty_cycle=0)


# method to change position of servo motors (0-180 degrees)
def servo(channel, position):
    if position < 0 or position > 180:
        return "position not in range"
    pulse_ms = 1 + position / 180
    duty = int(pulse_ms / 10 * 65535)
    if channel == 1:
        servo1.duty_cycle = duty
    elif channel == 2:
        servo2.duty_cycle = duty


# --- LED matrix directly on pico:ed (17 x 7), `display` from picoed above ---

ICONS = {
    "forward": (
        "...#...",
        "..###..",
        ".#.#.#.",
        "#..#..#",
        "...#...",
        "...#...",
        "...#...",
    ),
    "back": (
        "...#...",
        "...#...",
        "...#...",
        "#..#..#",
        ".#.#.#.",
        "..###..",
        "...#...",
    ),
    "right": (
        "...#...",
        "....#..",
        ".....#.",
        "#######",
        ".....#.",
        "....#..",
        "...#...",
    ),
    "left": (
        "...#...",
        "..#....",
        ".#.....",
        "#######",
        ".#.....",
        "..#....",
        "...#...",
    ),
    "stop": (
        "#.....#",
        ".#...#.",
        "..#.#..",
        "...#...",
        "..#.#..",
        ".#...#.",
        "#.....#",
    ),
}
DISPLAY_BRIGHTNESS = 40  # 0-255
# pico:ed sits in the Joy-Car upside down relative to the driving direction,
# so the icons are rotated by 180 degrees; set False if arrows point the wrong way
DISPLAY_ROTATE_180 = True
current_icon = None


def show_icon(name):
    global display, current_icon
    if display is None or name == current_icon:
        return
    current_icon = name
    try:
        display.fill(0)
        x0 = (17 - 7) // 2  # center the 7x7 icon on the 17x7 display
        for y, row in enumerate(ICONS[name]):
            for x, ch in enumerate(row):
                if ch == "#":
                    px, py = x0 + x, y
                    if DISPLAY_ROTATE_180:
                        px, py = 16 - px, 6 - py
                    display.pixel(px, py, DISPLAY_BRIGHTNESS)
    except Exception as e:
        print("chyba displeje, vypinam ho:", e)
        display = None


# set to False to ignore the IR obstacle sensors (e.g. to test driving straight)
USE_IR_SENSORS = True

# --- driving manoeuvres ---
SPEED_FORWARD = (40, 255, 40, 255)
SPEED_BACK = (255, 40, 255, 40)
TURN_RIGHT = (255, 40, 40, 255)
TURN_LEFT = (40, 255, 255, 40)

# how long to reverse after hitting an obstacle; about 3-5 cm,
# make it longer/shorter if the car backs up too much or too little
REVERSE_TIME = 0.3
TURN_TIME = 0.5


def stop():
    drive(0, 0, 0, 0)
    lights_brake()
    show_icon("stop")


def reverse():
    show_icon("back")
    drive(*SPEED_BACK)
    time.sleep(REVERSE_TIME)
    stop()
    time.sleep(0.2)


def turn(direction):
    if direction == "right":
        show_icon("right")
        drive(*TURN_RIGHT)
        blink(INDICATOR_RIGHT, TURN_TIME)
    else:
        show_icon("left")
        drive(*TURN_LEFT)
        blink(INDICATOR_LEFT, TURN_TIME)
    drive(0, 0, 0, 0)


lights_normal()

# --- calibrate IR obstacle sensors ---
# Some sensors report False for an obstacle, some True. At start-up the car
# stands still with NOTHING in front of it and remembers what "free" looks like;
# later an obstacle is whatever differs from that.
show_icon("stop")
print("kalibrace IR cidel - pred autem nesmi nic byt...")
time.sleep(1)
votes_left = 0
votes_right = 0
SAMPLES = 20
for _ in range(SAMPLES):
    d = fetchSensorData()
    votes_left += 1 if d[5] else 0
    votes_right += 1 if d[6] else 0
    time.sleep(0.05)
FREE_LEFT = votes_left > SAMPLES // 2
FREE_RIGHT = votes_right > SAMPLES // 2
print("volno znamena: IR L =", FREE_LEFT, "IR P =", FREE_RIGHT,
      "(hlasu", votes_left, "/", votes_right, "z", SAMPLES, ")")

while True:
    # get data from IO expander
    sensor_data = fetchSensorData()
    # an obstacle counts only when the sensor reports it 3 times in a row,
    # so single noisy readings do not make the car turn
    obstacle_left = USE_IR_SENSORS and sensor_data[5] != FREE_LEFT
    obstacle_right = USE_IR_SENSORS and sensor_data[6] != FREE_RIGHT
    for _ in range(2):
        if not (obstacle_left or obstacle_right):
            break
        time.sleep(0.01)
        again = fetchSensorData()
        obstacle_left = obstacle_left and again[5] != FREE_LEFT
        obstacle_right = obstacle_right and again[6] != FREE_RIGHT
    distance = get_distance()
    # debug output for the Serial window in Mu
    print("IO:", "{:08b}".format(sensor_buf[0]), "IR L:", sensor_data[5],
          "IR P:", sensor_data[6], "| distance:", distance, "cm")

    if obstacle_left or obstacle_right:
        # hit an obstacle: stop, back up a little, turn away from it
        print("PREKAZKA:", "vlevo" if obstacle_left else "", "vpravo" if obstacle_right else "")
        stop()
        time.sleep(0.2)
        reverse()
        if obstacle_right and not obstacle_left:
            turn("left")
        else:
            turn("right")
        lights_normal()
    elif distance < 20:
        # ultrasonic: obstacle ahead, back up and look left/right with the servo
        stop()
        time.sleep(0.2)
        reverse()
        servo(1, 0)
        time.sleep(0.5)
        distance_right = get_distance()
        servo(1, 180)
        time.sleep(0.5)
        distance_left = get_distance()
        servo(1, 90)
        time.sleep(0.5)
        if distance_left < distance_right:
            turn("right")
        else:
            turn("left")
        lights_normal()
    else:
        # drive forwards
        show_icon("forward")
        drive(*SPEED_FORWARD)
        time.sleep(0.05)
