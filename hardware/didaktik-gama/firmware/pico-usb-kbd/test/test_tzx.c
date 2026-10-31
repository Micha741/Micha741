// Test přehrávače .TZX na počítači (viz run_tests.sh)
#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "tap.h"
#include "tzx.h"

static uint8_t buf[4096];
static size_t len, pos;
static int m_getc(void *c) { (void)c; return pos < len ? buf[pos++] : -1; }
static bool m_seek(void *c, uint32_t p) { (void)c; if (p > len) return false; pos = p; return true; }
static uint32_t m_tell(void *c) { (void)c; return (uint32_t)pos; }

static void b(int v) { buf[len++] = (uint8_t)v; }
static void w(int v) { b(v & 0xFF); b(v >> 8); }
static void w3(int v) { w(v & 0xFFFF); b(v >> 16); }

static uint8_t tapb[21];
static size_t tp;
static int tg(void *c) { (void)c; return tp < sizeof tapb ? tapb[tp++] : -1; }

static tzx_t t;
static tap_pulse_t p;
static void expect(uint32_t ts, int level) {
    tzx_result_t r = tzx_next(&t, &p);
    if (r != TZX_PULSE || p.tstates != ts || (level >= 0 && p.level != level)) {
        printf("čekáno %u/%d, dostáno r=%d %u/%d\n", ts, level, r, p.tstates, p.level);
        assert(0);
    }
}

int main(void) {
    static const uint8_t hdr[19] = {0, 3, 'T', 'E', 'S', 'T', ' ', ' ', ' ', ' ', ' ', ' ', 0x10, 0, 0, 0x80, 0, 0, 0x93};
    memcpy(buf, "ZXTape!\x1A\x01\x14", 10); len = 10;
    b(0x30); b(2); b('h'); b('i');                                  // 0 text
    b(0x10); w(1000); w(19); for (int i = 0; i < 19; i++) b(hdr[i]);  // 1 standardní
    b(0x12); w(1000); w(5);                                         // 2 tón
    b(0x13); b(3); w(100); w(200); w(300);                          // 3 pulzy
    b(0x14); w(500); w(1000); b(4); w(0); w3(2); b(0x80); b(0xF0);  // 4 čistá data, poslední bajt 4 bity
    b(0x24); w(3);                                                  // 5 smyčka 3x
    b(0x12); w(50); w(1);                                           // 6
    b(0x25);                                                        // 7
    b(0x23); w(2);                                                  // 8 skok přes 9
    b(0x12); w(7777); w(1);                                         // 9 (přeskočen)
    b(0x2B); b(1); b(0); b(0); b(0); b(1);                          // 10 úroveň 1
    b(0x15); w(10); w(0); b(8); w3(1); b(0xE3);                     // 11 přímý záznam 11100011
    b(0x20); w(0);                                                  // 12 stop
    b(0x26); w(1); w(2);                                            // 13 volání bloku 15
    b(0x12); w(4444); w(1);                                         // 14
    b(0x12); w(3333); w(1);                                         // 15
    b(0x27);                                                        // 16 návrat
    b(0x19); b(4); b(0); b(0); b(0); b(1); b(2); b(3); b(4);        // 17 nepodporovaný, přeskočí se

    const tape_io_t io = {m_getc, m_seek, m_tell, NULL};
    assert(tzx_open(&t, &io) && t.nblocks == 18);

    // blok 0x10 musí dát přesně stejné pulzy jako .TAP se stejným blokem
    tapb[0] = 19; tapb[1] = 0; memcpy(tapb + 2, hdr, 19);
    tap_t tap; tap_pulse_t q; tap_init(&tap, tg, NULL);
    int n = 0;
    while (tap_next(&tap, &q)) { expect(q.tstates, q.level); n++; }
    assert(n == 8063 + 2 + 19 * 16 + 1);

    for (int i = 0; i < 5; i++) expect(1000, -1);
    expect(100, -1); expect(200, -1); expect(300, -1);
    expect(1000, -1); expect(1000, -1); for (int i = 0; i < 14; i++) expect(500, -1);  // 0x80
    for (int i = 0; i < 8; i++) expect(1000, -1);                                     // 0xF0, 4 bity
    for (int i = 0; i < 3; i++) expect(50, -1);                                       // smyčka
    expect(30, 1); expect(30, 0); expect(20, 1);                                      // přímý záznam
    assert(tzx_next(&t, &p) == TZX_STOP);                                             // 0x20 stop
    expect(3333, -1); expect(4444, -1); expect(3333, -1);                             // volání
    assert(tzx_next(&t, &p) == TZX_END && t.skipped_unsupported == 1);
    puts("tzx: všechny testy prošly");
    return 0;
}
