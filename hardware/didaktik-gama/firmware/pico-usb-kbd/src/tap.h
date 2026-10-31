// Generátor signálu kazety ze souboru .TAP (standardní nahrávací rutina ROM ZX Spectrum / Gama).
// Délky pulzů jsou v taktech CPU (T-stavech) při 3,5 MHz:
//   pilot 2168 T (8063 pulzů před hlavičkou, 3223 před daty), synchro 667 + 735 T,
//   bit 0 = 2x 855 T, bit 1 = 2x 1710 T, po bloku pauza 1 s.
#pragma once
#include <stdbool.h>
#include <stdint.h>

#define TAP_CPU_HZ 3500000u

typedef int (*tap_getc_fn)(void *ctx);  // další bajt souboru, -1 = konec

typedef struct {
    uint32_t tstates;  // délka pulzu
    uint8_t level;     // úroveň výstupu po dobu pulzu
} tap_pulse_t;

typedef struct {
    tap_getc_fn getc;
    void *ctx;
    int state;
    uint32_t left;     // zbývající bajty bloku / pulzy pilotu
    uint8_t byte, bit, half;
    uint8_t level;
    int first;         // první bajt bloku (příznak hlavička/data)
} tap_t;

void tap_init(tap_t *t, tap_getc_fn getc, void *ctx);
// další pulz; false = konec souboru
bool tap_next(tap_t *t, tap_pulse_t *p);
