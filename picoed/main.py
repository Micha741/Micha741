# Joy-Car (Joy-IT) - vyhybani prekazkam
# Verze pro ELECFREAKS pico:ed s firmwarem MicroPython.
# Editor Mu 1.2: rezim "RP2040", na desku ulozit jako main.py.
#
# Piny pico:ed -> GPIO cipu RP2040:
#   P19 = GP19 (SCL), P20 = GP18 (SDA) -> I2C k desce Joy-Car
#   P8  = GP8 (trigger), P12 = GP12 (echo) -> ultrazvuk
#   P14 = GP14, P15 = GP15 -> snimace rychlosti (od revize 1.3)
#   P1  = GP27, P13 = GP13 -> serva

import gc
from time import sleep, sleep_us
from machine import I2C, Pin, PWM, time_pulse_us

# define here your Joy Car Mainboard Revision
joycar_rev = 1.3

PWM_ADDR = 0x70  # PWM radic motoru
IO_ADDR = 0x38   # IO expander se senzory

# initialize I2C interface for the Joy Car Mainboard
i2c = I2C(1, scl=Pin(19), sda=Pin(18), freq=400000)

# initialize PWM controller
i2c.writeto(PWM_ADDR, b"\x00\x01")
i2c.writeto(PWM_ADDR, b"\xE8\xAA")

# the deceleration of a motor bias can be used to compensate for different motor speeds
biasR = 0  # deceleration of the right motor in percent
biasL = 0  # deceleration of the left motor in percent


# control motors using the PWM controller
# PWM0 and PWM1 for the left motor and PWM2 and PWM3 for the right motor
def drive(PWM0, PWM1, PWM2, PWM3):
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


# speed sensors (revision 1.3 and newer)
speed_left = Pin(14, Pin.IN)
speed_right = Pin(15, Pin.IN)


# get all sensor data
# bit 0 = SpeedLeft, bit 1 = SpeedRight, bit 2 = LineTrackerLeft,
# bit 3 = LineTrackerMiddle, bit 4 = LineTrackerRight,
# bit 5 = ObstclLeft, bit 6 = ObstclRight, bit 7 = free pin(7)
# (bit 8 = free (pin0) bit 9 = free (pin1)) - just with revision 1.3 or newer
def fetchSensorData():
    value = i2c.readfrom(IO_ADDR, 1)[0]
    data = {}
    for bit in range(8):
        data[bit] = bool(value & (1 << bit))

    # after main board revision 1.3, the speed sensors are on separate pins
    if joycar_rev >= 1.3:
        data[8], data[9] = data[0], data[1]
        data[0] = bool(speed_left.value())
        data[1] = bool(speed_right.value())
    return data


# pins for ultrasonic sensor
trigger = Pin(8, Pin.OUT)
echo = Pin(12, Pin.IN)
trigger.value(0)


# distance from ultrasonic sensor in cm (999 = nothing measured)
def get_distance():
    gc.collect()
    # short impulse onto the trigger pin
    trigger.value(1)
    sleep_us(10)
    trigger.value(0)
    # measure how long the echo pin is high (timeout 30 ms)
    duration = time_pulse_us(echo, 1, 30000)
    if duration < 0:
        return 999
    # speed of sound 343 m/s, there and back
    distance = ((duration / 1000000) * 34300) / 2
    return round(distance, 2)


# servos: 100 Hz (10 ms period), pulse 1-2 ms
servo1 = PWM(Pin(27))  # P1
servo1.freq(100)
servo2 = PWM(Pin(13))  # P13
servo2.freq(100)


# method to change position of servo motors (0-180 degrees)
def servo(channel, position):
    if position < 0 or position > 180:
        return "position not in range"
    pulse_ns = int(1000000 + position * 1000000 / 180)
    if channel == 1:
        servo1.duty_ns(pulse_ns)
    elif channel == 2:
        servo2.duty_ns(pulse_ns)


while True:
    # get data from IO expander
    sensor_data = fetchSensorData()

    # check if both sensors detect an obstacle
    if sensor_data[5] is False and sensor_data[6] is False:
        drive(255, 40, 40, 255)
        sleep(0.5)
    # check if obstacle is detected on the left
    elif sensor_data[5] is False and sensor_data[6] is True:
        drive(255, 40, 0, 0)
        sleep(0.5)
    # check if obstacle is detected on the right
    elif sensor_data[6] is False and sensor_data[5] is True:
        drive(0, 0, 255, 40)
        sleep(0.5)
    else:
        # drive forwards
        drive(40, 255, 40, 255)

    # check if there is more than 20cm otherwise do this routine
    if get_distance() < 20:
        # stop the JoyCar
        drive(0, 0, 0, 0)
        sleep(0.5)
        # set servomotor to the far right and measure distance
        servo(1, 0)
        sleep(0.5)
        distance_right = get_distance()
        # set servomotor to the far left and measure distance
        servo(1, 180)
        sleep(0.5)
        distance_left = get_distance()
        # set servomotor back in the middle
        servo(1, 90)
        sleep(0.5)
        if distance_left < distance_right:
            # turn right
            drive(255, 0, 0, 255)
            sleep(0.5)
        else:
            # turn left
            drive(0, 255, 255, 0)
            sleep(0.5)
