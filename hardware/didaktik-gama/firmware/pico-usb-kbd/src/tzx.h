// Generátor signálu kazety ze souboru .TZX (formát v1.20).
// Podporované bloky: 0x10 standardní, 0x11 turbo, 0x12 tón, 0x13 pulzy, 0x14 čistá data,
// 0x15 přímý záznam, 0x20 pauza/stop, 0x23 skok, 0x24/0x25 smyčka, 0x26/0x27 volání/návrat,
// 0x2A stop v režimu 48K, 0x2B úroveň signálu. Informační bloky a 0x18/0x19 se přeskočí.
#pragma once
#include <stdbool.h>
#include <stdint.h>

#include "tap.h"

#define TZX_MAX_BLOCKS 1024

typedef struct {
    int (*getc)(void *ctx);
    bool (*seek)(void *ctx, uint32_t pos);
    uint32_t (*tell)(void *ctx);
    void *ctx;
} tape_io_t;

typedef enum { TZX_PULSE, TZX_STOP, TZX_END } tzx_result_t;

typedef struct {
    tape_io_t io;
    uint32_t blk[TZX_MAX_BLOCKS];   // posun každého bloku v souboru
    int nblocks, cur;
    int state;
    uint8_t level;
    uint32_t pilot_len, pilot_left, sync[2], zero, one, pause_ms, data_left, tps;
    int nsync, sync_i, bits_in_byte, bit, half;
    uint8_t byte, lastbits;
    uint32_t pulses_left;
    uint32_t run_len;
    uint8_t run_level;
    int loop_start, loop_count;
    int call_block, call_n, call_i;
    uint32_t call_list;
    uint8_t skipped_unsupported;    // počet přeskočených bloků 0x18/0x19
} tzx_t;

// otevře soubor: ověří hlavičku "ZXTape!" a sestaví tabulku bloků; false = není TZX
bool tzx_open(tzx_t *t, const tape_io_t *io);
// další pulz; TZX_STOP = páska se má zastavit (pokračuje se dalším voláním), TZX_END = konec
tzx_result_t tzx_next(tzx_t *t, tap_pulse_t *p);
