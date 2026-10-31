// Test FAT a přehrávače .TAP na počítači:
//   python3 mkfat.py 16 1 /tmp/fat16.img HRA.TAP=data.tap ...  (viz run_tests.sh)
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "fat.h"
#include "tap.h"

static FILE *img;
static bool rd(uint32_t lba, uint8_t *buf, void *ctx) {
    (void)ctx;
    if (fseek(img, (long)lba * 512, SEEK_SET)) return false;
    return fread(buf, 1, 512, img) == 512;
}

// .TAP v paměti
static const uint8_t *mem; static size_t mem_len, mem_pos;
static int mem_getc(void *ctx) { (void)ctx; return mem_pos < mem_len ? mem[mem_pos++] : -1; }
static int file_getc(void *ctx) { return fat_getc((fat_file_t *)ctx); }

// dekodér pulzů jako nahrávací rutina: vrací počet bajtů, ověřuje pilot/synchro
static size_t decode(tap_getc_fn g, void *ctx, uint8_t *out, int *blocks) {
    tap_t t; tap_pulse_t p; size_t n = 0; int pilot = 0, phase = 0, bits = 0, half = 0; uint8_t b = 0;
    uint32_t prev = 0;
    *blocks = 0;
    tap_init(&t, g, ctx);
    while (tap_next(&t, &p)) {
        if (p.tstates == TAP_CPU_HZ) { assert(phase == 2 && bits == 0 && half == 0); phase = 0; pilot = 0; (*blocks)++; continue; }
        if (phase == 0) {
            if (p.tstates == 2168) { pilot++; continue; }
            assert(p.tstates == 667 && (pilot == 8063 || pilot == 3223)); phase = 1; continue;
        }
        if (phase == 1) { assert(p.tstates == 735); phase = 2; continue; }
        assert(p.tstates == 855 || p.tstates == 1710);
        if (half == 0) { prev = p.tstates; half = 1; continue; }
        assert(p.tstates == prev); half = 0;
        b = (uint8_t)(b << 1 | (prev == 1710)); if (++bits == 8) { out[n++] = b; bits = 0; }
    }
    return n;
}

int main(int argc, char **argv) {
    // 1) generátor z paměti: hlavička (flag 0, 19 B) + data (flag FF, 4 B)
    static uint8_t tapbuf[64];
    size_t L = 0;
    tapbuf[L++] = 19; tapbuf[L++] = 0;
    for (int i = 0; i < 19; i++) tapbuf[L++] = (uint8_t)(i == 0 ? 0x00 : 0x40 + i);
    tapbuf[L++] = 4; tapbuf[L++] = 0;
    tapbuf[L++] = 0xFF; tapbuf[L++] = 0xA5; tapbuf[L++] = 0x5A; tapbuf[L++] = 0x01;
    mem = tapbuf; mem_len = L; mem_pos = 0;
    uint8_t out[70000]; int blocks;
    size_t n = decode(mem_getc, NULL, out, &blocks);
    assert(blocks == 2 && n == 23);
    assert(out[0] == 0 && out[19] == 0xFF && out[20] == 0xA5 && out[22] == 0x01);
    puts("tap: generátor OK");

    // 2) FAT obrazy z argumentů: obraz očekávaný_soubor_1 ...
    for (int a = 1; a < argc; a += 2) {
        img = fopen(argv[a], "rb"); assert(img);
        fat_fs_t fs; assert(fat_mount(&fs, rd, NULL));
        fat_entry_t e[16];
        const int cnt = fat_list(&fs, "TAP", e, 16);
        assert(cnt == 2 && strcmp(e[0].name, "AHRA.TAP") == 0 && strcmp(e[1].name, "ZDEMO.TAP") == 0);
        FILE *ref = fopen(argv[a + 1], "rb"); assert(ref);
        static uint8_t want[70000]; size_t wl = fread(want, 1, sizeof want, ref); fclose(ref);
        fat_file_t f; fat_open(&fs, &e[0], &f);
        for (size_t i = 0; i < wl; i++) assert(fat_getc(&f) == want[i]);
        assert(fat_getc(&f) == -1);
        // přehrání souboru z FAT přes generátor
        fat_open(&fs, &e[0], &f);
        mem = want; mem_len = wl; mem_pos = 0;
        uint8_t o1[70000], o2[70000]; int b1, b2;
        size_t n1 = decode(file_getc, &f, o1, &b1), n2 = decode(mem_getc, NULL, o2, &b2);
        assert(n1 == n2 && b1 == b2 && memcmp(o1, o2, n1) == 0);
        printf("fat%d: %s OK (typ FAT%d, %d bloků, %zu B dat)\n", fs.type, argv[a], fs.type, b1, n1);
        fclose(img);
    }
    return 0;
}
