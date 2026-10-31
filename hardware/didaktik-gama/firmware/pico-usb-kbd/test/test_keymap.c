// Test převodu kláves na počítači: cc -I../src test_keymap.c ../src/keymap.c && ./a.out
#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "keymap.h"

static zx_keys_t k(uint8_t mod, uint8_t a, uint8_t b) {
    uint8_t codes[6] = {a, b, 0, 0, 0, 0};
    zx_keys_t out;
    keymap_compute(mod, codes, &out);
    return out;
}
static int has(const zx_keys_t *z, int row, int bit) { return (z->rows[row] >> bit) & 1; }
static int count(const zx_keys_t *z) {
    int n = 0;
    for (int r = 0; r < ZX_ROWS; r++)
        for (int b = 0; b < 5; b++) n += has(z, r, b);
    return n;
}

int main(void) {
    zx_keys_t z;
    z = k(0, 0x14, 0);              // q
    assert(has(&z, 2, 0) && count(&z) == 1);
    z = k(0x02, 0x14, 0);           // Shift+q = CAPS SHIFT + Q
    assert(has(&z, 2, 0) && has(&z, 0, 0) && count(&z) == 2);
    z = k(0, 0x1E, 0);              // 1
    assert(has(&z, 3, 0) && count(&z) == 1);
    z = k(0x02, 0x1E, 0);           // Shift+1 = '!' = SS+1
    assert(has(&z, 7, 1) && has(&z, 3, 0) && !has(&z, 0, 0) && count(&z) == 2);
    z = k(0, 0x36, 0);              // ',' = SS+N
    assert(has(&z, 7, 1) && has(&z, 7, 3) && count(&z) == 2);
    z = k(0, 0x2A, 0);              // Backspace = CS+0
    assert(has(&z, 0, 0) && has(&z, 4, 0) && count(&z) == 2);
    z = k(0, 0x50, 0);              // šipka vlevo = CS+5
    assert(has(&z, 0, 0) && has(&z, 3, 4));
    z = k(0, 0x28, 0x2C);           // Enter + mezera
    assert(has(&z, 6, 0) && has(&z, 7, 0) && count(&z) == 2);
    z = k(0x05, 0x4C, 0);           // Ctrl+Alt+Del
    assert(z.reset && count(&z) == 0);

    // tabulka: Q stisknuto, čte se řada A10 (adresa A8..A15 = 1111 1011)
    uint8_t lut[256];
    z = k(0, 0x14, 0);
    keymap_build_lut(&z, lut);
    assert(lut[0xFB] == 0x01);      // jen řada A10 -> D0
    assert(lut[0xFE] == 0x00);      // řada A8 -> nic
    assert(lut[0x00] == 0x01);      // všechny řady najednou
    assert(lut[0xFF] == 0x00);      // žádná řada
    puts("keymap: všechny testy prošly");
    return 0;
}
