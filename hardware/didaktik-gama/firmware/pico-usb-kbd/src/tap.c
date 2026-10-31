// Generátor signálu kazety ze souboru .TAP – viz tap.h
#include "tap.h"

enum { S_LEN, S_PILOT, S_SYNC1, S_SYNC2, S_DATA, S_PAUSE, S_END };

#define T_PILOT 2168u
#define T_SYNC1 667u
#define T_SYNC2 735u
#define T_BIT0 855u
#define T_BIT1 1710u
#define N_PILOT_HEADER 8063u
#define N_PILOT_DATA 3223u
#define T_PAUSE TAP_CPU_HZ  // 1 s

void tap_init(tap_t *t, tap_getc_fn getc, void *ctx) {
    t->getc = getc;
    t->ctx = ctx;
    t->state = S_LEN;
    t->level = 0;
}

static void emit(tap_t *t, tap_pulse_t *p, uint32_t len) {
    t->level ^= 1;
    p->level = t->level;
    p->tstates = len;
}

bool tap_next(tap_t *t, tap_pulse_t *p) {
    for (;;) {
        switch (t->state) {
            case S_LEN: {
                const int lo = t->getc(t->ctx), hi = t->getc(t->ctx);
                if (lo < 0 || hi < 0) { t->state = S_END; break; }
                t->left = (uint32_t)lo | ((uint32_t)hi << 8);
                if (!t->left) break;               // prázdný blok přeskočit
                t->first = t->getc(t->ctx);
                if (t->first < 0) { t->state = S_END; break; }
                t->byte = (uint8_t)t->first;
                t->bit = 0;
                t->half = 0;
                t->state = S_PILOT;
                t->first = t->first < 128 ? (int)N_PILOT_HEADER : (int)N_PILOT_DATA;
                break;
            }
            case S_PILOT:
                if (t->first-- > 0) { emit(t, p, T_PILOT); return true; }
                t->state = S_SYNC1;
                break;
            case S_SYNC1: t->state = S_SYNC2; emit(t, p, T_SYNC1); return true;
            case S_SYNC2: t->state = S_DATA; emit(t, p, T_SYNC2); return true;
            case S_DATA: {
                if (t->bit == 8) {                 // další bajt bloku
                    if (--t->left == 0) { t->state = S_PAUSE; break; }
                    const int c = t->getc(t->ctx);
                    if (c < 0) { t->state = S_PAUSE; break; }
                    t->byte = (uint8_t)c;
                    t->bit = 0;
                }
                const uint32_t len = (t->byte & (0x80 >> t->bit)) ? T_BIT1 : T_BIT0;
                if (++t->half == 2) { t->half = 0; t->bit++; }
                emit(t, p, len);
                return true;
            }
            case S_PAUSE:
                t->state = S_LEN;
                t->level = 0;
                p->level = 0;
                p->tstates = T_PAUSE;
                return true;
            default:
                return false;
        }
    }
}
