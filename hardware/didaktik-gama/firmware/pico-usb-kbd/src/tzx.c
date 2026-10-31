// Generátor signálu kazety ze souboru .TZX – viz tzx.h
#include "tzx.h"

#include <string.h>

enum { S_BLOCK, S_PILOT, S_SYNC, S_DATA, S_PULSES, S_DIRECT, S_PAUSE };

#define T_MS (TAP_CPU_HZ / 1000u)  // 3500 T = 1 ms

static int rd8(tzx_t *t) { return t->io.getc(t->io.ctx); }
static uint32_t rdn(tzx_t *t, int n) {
    uint32_t v = 0;
    for (int i = 0; i < n; i++) {
        const int c = rd8(t);
        v |= (uint32_t)(c < 0 ? 0 : c) << (8 * i);
    }
    return v;
}
static bool skip(tzx_t *t, uint32_t n) { return t->io.seek(t->io.ctx, t->io.tell(t->io.ctx) + n); }

// délka těla bloku (za bajtem ID); pozice souboru je na začátku těla a zůstane tam
static bool body_len(tzx_t *t, int id, uint32_t *len) {
    const uint32_t start = t->io.tell(t->io.ctx);
    uint32_t n;
    switch (id) {
        case 0x10: skip(t, 2); n = 4 + rdn(t, 2); break;
        case 0x11: skip(t, 0x0F); n = 0x12 + rdn(t, 3); break;
        case 0x12: n = 4; break;
        case 0x13: n = 1 + 2 * rdn(t, 1); break;
        case 0x14: skip(t, 7); n = 0x0A + rdn(t, 3); break;
        case 0x15: skip(t, 5); n = 8 + rdn(t, 3); break;
        case 0x20: case 0x23: case 0x24: n = 2; break;
        case 0x21: case 0x30: n = 1 + rdn(t, 1); break;
        case 0x22: case 0x25: case 0x27: n = 0; break;
        case 0x26: n = 2 + 2 * rdn(t, 2); break;
        case 0x28: case 0x32: n = 2 + rdn(t, 2); break;
        case 0x31: skip(t, 1); n = 2 + rdn(t, 1); break;
        case 0x33: n = 1 + 3 * rdn(t, 1); break;
        case 0x35: skip(t, 0x10); n = 0x14 + rdn(t, 4); break;
        case 0x5A: n = 9; break;
        default: n = 4 + rdn(t, 4); break;  // 0x18, 0x19, 0x2A, 0x2B a neznámé: 4B délka
    }
    *len = n;
    return t->io.seek(t->io.ctx, start);
}

bool tzx_open(tzx_t *t, const tape_io_t *io) {
    memset(t, 0, sizeof(*t));
    t->io = *io;
    static const char sig[8] = {'Z', 'X', 'T', 'a', 'p', 'e', '!', 0x1A};
    if (!t->io.seek(t->io.ctx, 0)) return false;
    for (int i = 0; i < 8; i++)
        if (rd8(t) != (uint8_t)sig[i]) return false;
    rd8(t);  // verze hlavní
    rd8(t);  // verze vedlejší
    for (;;) {
        const uint32_t off = t->io.tell(t->io.ctx);
        const int id = rd8(t);
        uint32_t len;
        if (id < 0 || t->nblocks >= TZX_MAX_BLOCKS) break;
        t->blk[t->nblocks++] = off;
        if (!body_len(t, id, &len) || !skip(t, len)) break;
    }
    t->state = S_BLOCK;
    t->loop_start = -1;
    t->call_block = -1;
    return t->nblocks > 0;
}

static tzx_result_t toggle(tzx_t *t, tap_pulse_t *p, uint32_t len) {
    t->level ^= 1;
    p->level = t->level;
    p->tstates = len;
    return TZX_PULSE;
}

static void load_first_byte(tzx_t *t) {
    const int c = rd8(t);
    t->byte = (uint8_t)(c < 0 ? 0 : c);
    t->bit = 0;
    t->half = 0;
    t->bits_in_byte = (t->data_left == 1) ? t->lastbits : 8;
}

static void go_block(tzx_t *t, int index) {
    t->cur = index < 0 ? t->nblocks : index;
    t->state = S_BLOCK;
}

tzx_result_t tzx_next(tzx_t *t, tap_pulse_t *p) {
    for (;;) {
        switch (t->state) {
            case S_BLOCK: {
                if (t->cur >= t->nblocks) return TZX_END;
                const int self = t->cur++;
                if (!t->io.seek(t->io.ctx, t->blk[self])) return TZX_END;
                const int id = rd8(t);
                switch (id) {
                    case 0x10:  // standardní rychlost (jako .TAP)
                        t->pause_ms = rdn(t, 2);
                        t->data_left = rdn(t, 2);
                        t->pilot_len = 2168;
                        t->sync[0] = 667; t->sync[1] = 735; t->nsync = 2;
                        t->zero = 855; t->one = 1710; t->lastbits = 8;
                        if (!t->data_left) { t->state = S_PAUSE; break; }
                        load_first_byte(t);
                        t->pilot_left = t->byte < 128 ? 8063 : 3223;
                        t->state = S_PILOT;
                        break;
                    case 0x11:  // turbo
                        t->pilot_len = rdn(t, 2);
                        t->sync[0] = rdn(t, 2); t->sync[1] = rdn(t, 2); t->nsync = 2;
                        t->zero = rdn(t, 2); t->one = rdn(t, 2);
                        t->pilot_left = rdn(t, 2);
                        t->lastbits = (uint8_t)rdn(t, 1);
                        t->pause_ms = rdn(t, 2);
                        t->data_left = rdn(t, 3);
                        if (t->data_left) load_first_byte(t);
                        t->state = S_PILOT;
                        break;
                    case 0x12:  // čistý tón
                        t->pilot_len = rdn(t, 2);
                        t->pilot_left = rdn(t, 2);
                        t->nsync = 0; t->data_left = 0; t->pause_ms = 0;
                        t->state = S_PILOT;
                        break;
                    case 0x13:  // sekvence pulzů
                        t->pulses_left = rdn(t, 1);
                        t->state = S_PULSES;
                        break;
                    case 0x14:  // čistá data
                        t->zero = rdn(t, 2); t->one = rdn(t, 2);
                        t->lastbits = (uint8_t)rdn(t, 1);
                        t->pause_ms = rdn(t, 2);
                        t->data_left = rdn(t, 3);
                        t->pilot_left = 0; t->nsync = 0;
                        if (t->data_left) { load_first_byte(t); t->state = S_DATA; }
                        else t->state = S_PAUSE;
                        break;
                    case 0x15:  // přímý záznam
                        t->tps = rdn(t, 2);
                        t->pause_ms = rdn(t, 2);
                        t->lastbits = (uint8_t)rdn(t, 1);
                        t->data_left = rdn(t, 3);
                        t->run_len = 0;
                        if (t->data_left) { load_first_byte(t); t->state = S_DIRECT; }
                        else t->state = S_PAUSE;
                        break;
                    case 0x20:  // pauza; 0 = zastavit pásku
                        t->pause_ms = rdn(t, 2);
                        if (!t->pause_ms) { t->level = 0; return TZX_STOP; }
                        t->state = S_PAUSE;
                        break;
                    case 0x2A:  // zastavit pásku v režimu 48K (Gama je 48K)
                        t->level = 0;
                        return TZX_STOP;
                    case 0x2B:  // nastavení úrovně signálu
                        rdn(t, 4);
                        t->level = rd8(t) ? 1 : 0;
                        break;
                    case 0x23: {  // skok o N bloků
                        const int16_t rel = (int16_t)rdn(t, 2);
                        go_block(t, self + rel);
                        break;
                    }
                    case 0x24:  // začátek smyčky
                        t->loop_count = (int)rdn(t, 2);
                        t->loop_start = t->cur;
                        break;
                    case 0x25:  // konec smyčky
                        if (t->loop_start >= 0 && --t->loop_count > 0) go_block(t, t->loop_start);
                        break;
                    case 0x26: {  // volání sekvence
                        t->call_n = (int)rdn(t, 2);
                        t->call_block = self;
                        t->call_i = 0;
                        t->call_list = t->io.tell(t->io.ctx);
                        if (t->call_n) go_block(t, self + (int16_t)rdn(t, 2));
                        break;
                    }
                    case 0x27:  // návrat z volání
                        if (t->call_block >= 0) {
                            if (++t->call_i < t->call_n) {
                                t->io.seek(t->io.ctx, t->call_list + 2u * (uint32_t)t->call_i);
                                go_block(t, t->call_block + (int16_t)rdn(t, 2));
                            } else {
                                go_block(t, t->call_block + 1);
                                t->call_block = -1;
                            }
                        }
                        break;
                    case 0x18: case 0x19:
                        t->skipped_unsupported++;
                        break;
                    default:  // informační bloky
                        break;
                }
                break;
            }
            case S_PILOT:
                if (t->pilot_left) { t->pilot_left--; return toggle(t, p, t->pilot_len); }
                t->sync_i = 0;
                t->state = S_SYNC;
                break;
            case S_SYNC:
                if (t->sync_i < t->nsync) return toggle(t, p, t->sync[t->sync_i++]);
                t->state = t->data_left ? S_DATA : S_PAUSE;
                break;
            case S_DATA: {
                if (t->bit >= t->bits_in_byte) {
                    if (--t->data_left == 0) { t->state = S_PAUSE; break; }
                    const int c = rd8(t);
                    t->byte = (uint8_t)(c < 0 ? 0 : c);
                    t->bit = 0;
                    t->bits_in_byte = (t->data_left == 1) ? t->lastbits : 8;
                    break;
                }
                const uint32_t len = (t->byte & (0x80 >> t->bit)) ? t->one : t->zero;
                if (++t->half == 2) { t->half = 0; t->bit++; }
                return toggle(t, p, len);
            }
            case S_PULSES:
                if (t->pulses_left) { t->pulses_left--; return toggle(t, p, rdn(t, 2)); }
                t->state = S_BLOCK;
                break;
            case S_DIRECT: {
                if (t->bit >= t->bits_in_byte) {
                    if (--t->data_left == 0) {
                        t->state = S_PAUSE;
                        if (t->run_len) {
                            p->level = t->level = t->run_level;
                            p->tstates = t->run_len;
                            t->run_len = 0;
                            return TZX_PULSE;
                        }
                        break;
                    }
                    const int c = rd8(t);
                    t->byte = (uint8_t)(c < 0 ? 0 : c);
                    t->bit = 0;
                    t->bits_in_byte = (t->data_left == 1) ? t->lastbits : 8;
                    break;
                }
                const uint8_t s = (t->byte >> (7 - t->bit)) & 1;
                t->bit++;
                if (t->run_len && s != t->run_level) {
                    p->level = t->level = t->run_level;
                    p->tstates = t->run_len;
                    t->run_level = s;
                    t->run_len = t->tps;
                    return TZX_PULSE;
                }
                t->run_level = s;
                t->run_len += t->tps;
                break;
            }
            case S_PAUSE:
                t->state = S_BLOCK;
                if (t->pause_ms) {
                    t->level = 0;
                    p->level = 0;
                    p->tstates = t->pause_ms * T_MS;
                    return TZX_PULSE;
                }
                break;
            default:
                return TZX_END;
        }
    }
}
