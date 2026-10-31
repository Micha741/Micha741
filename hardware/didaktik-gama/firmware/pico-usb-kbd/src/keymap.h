// Převod USB HID klávesnice (boot protokol) na matici klávesnice ZX Spectrum / Didaktik Gama.
#pragma once
#include <stdbool.h>
#include <stdint.h>

// Půlřady matice: index = adresová linka A8..A15 (0..7), bit = datový bit D0..D4.
//   A8 : CAPS SHIFT, Z, X, C, V        A12: 0, 9, 8, 7, 6
//   A9 : A, S, D, F, G                 A13: P, O, I, U, Y
//   A10: Q, W, E, R, T                 A14: ENTER, L, K, J, H
//   A11: 1, 2, 3, 4, 5                 A15: SPACE, SYMBOL SHIFT, M, N, B
#define ZX_ROWS 8

typedef struct {
    uint8_t rows[ZX_ROWS];  // stisknuté klávesy, bit 0..4 = D0..D4
    bool reset;             // Ctrl+Alt+Del
} zx_keys_t;

// modifiers = bajt modifikátorů HID, keycodes = až 6 kódů HID (0 = nic)
void keymap_compute(uint8_t modifiers, const uint8_t keycodes[6], zx_keys_t *out);

// Tabulka pro emulaci matice: lut[adresa A8..A15] = bity D0..D4 stisknuté ve vybraných řadách
void keymap_build_lut(const zx_keys_t *keys, uint8_t lut[256]);
