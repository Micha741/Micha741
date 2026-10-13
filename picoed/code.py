# Joy-Car (Joy-IT) - vyhybani prekazkam + svetla
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

# initialize I2C interface for the Joy Car Mainboard (P19 = SCL, P20 = SDA)
i2c = busio.I2C(board.SCL, board.SDA, frequency=400000)
while not i2c.try_lock():
    pass

# initialize PWM controller
i2c.writeto(PWM_ADDR, bytes([0x00, 0x01]))
i2c.writeto(PWM_ADDR, bytes([0xE8, 0xAA]))

# the deceleration of a motor bias can be used to compensate for different motor speeds
biasR = 0  # deceleration of the right motor in percent
biasL = 0  # deceleration of the left motor in percent

# if a motor turns the wrong way, set True to swap its direction
reverseR = False  # right motor (PWM0, PWM1)
reverseL = True   # left motor (PWM2, PWM3) is wired the other way round


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
        i2c.writeto(PWM_ADDR, bytes([channel, value]))


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
    i2c.readfrom_into(IO_ADDR, sensor_buf)
    data = {}
    for bit in range(8):
        data[bit] = bool(sensor_buf[0] & (1 << bit))

    # after main board revision 1.3, the speed sensors are on separate pins
    if joycar_rev >= 1.3:
        data[8], data[9] = data[0], data[1]
        data[0] = speed_left.value
        data[1] = speed_right.value
    return data


# pins for ultrasonic sensor
trigger = digitalio.DigitalInOut(board.P8)
trigger.direction = digitalio.Direction.OUTPUT
trigger.value = False

echo = digitalio.DigitalInOut(board.P12)
echo.direction = digitalio.Direction.INPUT
echo.pull = digitalio.Pull.DOWN  # no sensor / no signal -> reads 0, not noise


# one measurement: length of the echo pulse in microseconds (None = no echo)
def measure_echo_us():
    trigger.value = True
    time.sleep(0.00001)
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


lights_normal()

while True:
    # get data from IO expander
    sensor_data = fetchSensorData()
    # debug output for the Serial window in Mu
    # obstacle sensors: False = obstacle, True = free
    print("IO:", "{:08b}".format(sensor_buf[0]), "IR L:", sensor_data[5], "IR P:", sensor_data[6])

    # check if both sensors detect an obstacle
    if sensor_data[5] is False and sensor_data[6] is False:
        # evade obstacle (turn right)
        drive(255, 40, 40, 255)
        blink(INDICATOR_RIGHT, 0.5)
    # check if obstacle is detected on the left
    elif sensor_data[5] is False and sensor_data[6] is True:
        # evade obstacle (turn right)
        drive(255, 40, 0, 0)
        blink(INDICATOR_RIGHT, 0.5)
    # check if obstacle is detected on the right
    elif sensor_data[6] is False and sensor_data[5] is True:
        # evade obstacle (turn left)
        drive(0, 0, 255, 40)
        blink(INDICATOR_LEFT, 0.5)
    else:
        # drive forwards
        drive(40, 255, 40, 255)

    # check if there is more than 20cm otherwise do this routine
    distance = get_distance()
    print("distance:", distance, "cm")
    if distance < 20:
        # stop the JoyCar
        drive(0, 0, 0, 0)
        lights_brake()
        time.sleep(0.5)
        # set servomotor to the far right and measure distance
        servo(1, 0)
        time.sleep(0.5)
        distance_right = get_distance()
        # set servomotor to the far left and measure distance
        servo(1, 180)
        time.sleep(0.5)
        distance_left = get_distance()
        # set servomotor back in the middle
        servo(1, 90)
        time.sleep(0.5)
        if distance_left < distance_right:
            # turn right
            drive(255, 0, 0, 255)
            blink(INDICATOR_RIGHT, 0.5)
        else:
            # turn left
            drive(0, 255, 255, 0)
            blink(INDICATOR_LEFT, 0.5)
