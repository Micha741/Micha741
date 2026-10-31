// Přehrávač kazet – viz player.h
#include "player.h"

#include <stddef.h>

#include "fat.h"
#include "hardware/gpio.h"
#include "pico/stdlib.h"
#include "tap.h"
#include "tusb.h"

#define PIN_TAPE 14
#define RING 1024           // ~0,25 s signálu do zásoby, pokrývá čtení sektoru z USB
#define MAX_FILES 64
#define HID_F1 0x3A
#define HID_F2 0x3B
#define HID_F3 0x3C

// ------------------------------------------------------------------ výstup: fronta pulzů + alarm
static volatile uint16_t ring_us[RING];
static volatile uint8_t ring_lv[RING];
static volatile uint32_t rd, wr;
static volatile bool running, flush;
static volatile bool playing;

static int64_t tape_cb(alarm_id_t id, void *user) {
    (void)id;
    (void)user;
    if (flush) {
        rd = wr;
        flush = false;
    }
    if (rd == wr) {
        if (!playing) {
            gpio_put(PIN_TAPE, 0);
            running = false;
            return 0;            // alarm skončí
        }
        return -200;             // podtečení – počkat na data
    }
    const uint32_t i = rd % RING;
    gpio_put(PIN_TAPE, ring_lv[i]);
    const int64_t us = ring_us[i];
    rd++;
    return -us;                  // záporně = přesně od minulého času, bez driftu
}

static void push(uint32_t us, uint8_t level) {
    ring_us[wr % RING] = (uint16_t)us;
    ring_lv[wr % RING] = level;
    wr++;
}

// ------------------------------------------------------------------ USB disk (TinyUSB MSC host)
static volatile uint8_t msc_addr;
static volatile bool msc_new, msc_gone;
static volatile int io_state;    // 1 = probíhá, 2 = OK, 3 = chyba

void tuh_msc_mount_cb(uint8_t dev_addr) {
    msc_addr = dev_addr;
    msc_new = true;
}

void tuh_msc_umount_cb(uint8_t dev_addr) {
    if (dev_addr == msc_addr) {
        msc_addr = 0;
        msc_gone = true;
    }
}

static bool read_done(uint8_t dev_addr, tuh_msc_complete_data_t const *d) {
    (void)dev_addr;
    io_state = (d->csw && d->csw->status == 0) ? 2 : 3;
    return true;
}

static bool disk_read(uint32_t lba, uint8_t *buf, void *ctx) {
    (void)ctx;
    const uint8_t dev = msc_addr;
    if (!dev || tuh_msc_get_block_size(dev, 0) != 512) return false;
    io_state = 1;
    if (!tuh_msc_read10(dev, 0, buf, lba, 1, read_done, 0)) return false;
    const absolute_time_t timeout = make_timeout_time_ms(2000);
    while (io_state == 1) {
        tuh_task();
        if (time_reached(timeout) || !msc_addr) return false;
    }
    return io_state == 2;
}

// ------------------------------------------------------------------ přehrávač
static fat_fs_t fs;
static fat_entry_t files[MAX_FILES];
static int nfiles, sel;
static fat_file_t file;
static tap_t tap;
static uint32_t frac;            // zbytek převodu T-stavů na µs
static volatile bool k_next, k_prev, k_play;
static uint8_t prev_keys[6];
static int blink_left;
static absolute_time_t blink_at;

static int file_getc(void *ctx) { return fat_getc((fat_file_t *)ctx); }

static void blink(int n) {
    blink_left = n * 2;
    blink_at = get_absolute_time();
    gpio_put(PICO_DEFAULT_LED_PIN, 0);
}

static void stop(void) {
    playing = false;
    flush = true;
}

void player_init(void) {
    gpio_init(PIN_TAPE);
    gpio_put(PIN_TAPE, 0);
    gpio_set_dir(PIN_TAPE, GPIO_OUT);
}

bool player_owns_led(void) { return blink_left > 0 || playing; }

void player_keys(const uint8_t keycodes[6]) {
    for (int i = 0; i < 6; i++) {
        const uint8_t h = keycodes[i];
        bool was = false;
        for (int j = 0; j < 6; j++) was |= prev_keys[j] == h;
        if (!h || was) continue;           // jen nově stisknuté
        if (h == HID_F1) k_next = true;
        if (h == HID_F3) k_prev = true;
        if (h == HID_F2) k_play = true;
    }
    for (int i = 0; i < 6; i++) prev_keys[i] = keycodes[i];
}

static void fill(void) {
    while (playing && wr - rd < RING - 24) {   // rezerva na rozdělenou pauzu (1 s = 17 položek)
        tap_pulse_t p;
        if (!tap_next(&tap, &p)) {
            playing = false;
            break;
        }
        const uint32_t t2 = p.tstates * 2 + frac;  // 1 µs = 3,5 T
        uint32_t us = t2 / 7;
        frac = t2 % 7;
        while (us) {
            const uint32_t chunk = us > 60000 ? 60000 : us;
            push(chunk, p.level);
            us -= chunk;
        }
    }
    if (!running && wr != rd) {
        running = true;
        add_alarm_in_us(20, tape_cb, NULL, true);
    }
}

void player_task(void) {
    if (msc_gone) {
        msc_gone = false;
        stop();
        nfiles = 0;
    }
    if (msc_new && msc_addr && tuh_msc_ready(msc_addr)) {
        msc_new = false;
        nfiles = fat_mount(&fs, disk_read, NULL) ? fat_list(&fs, "TAP", files, MAX_FILES) : 0;
        sel = 0;
        blink(nfiles ? 1 : 10);            // 10 bliknutí = disk bez souborů .TAP nebo nečitelný
    }
    if (k_next || k_prev) {
        const int d = k_next ? 1 : -1;
        k_next = k_prev = false;
        if (nfiles) {
            stop();
            sel = (sel + d + nfiles) % nfiles;
            blink(sel + 1);
        }
    }
    if (k_play) {
        k_play = false;
        if (playing) {
            stop();
        } else if (nfiles) {
            fat_open(&fs, &files[sel], &file);
            tap_init(&tap, file_getc, &file);
            frac = 0;
            playing = true;
        }
    }
    fill();

    if (blink_left > 0 && time_reached(blink_at)) {
        blink_left--;
        gpio_put(PICO_DEFAULT_LED_PIN, blink_left & 1);
        blink_at = make_timeout_time_ms(blink_left ? 250 : 800);
    } else if (!blink_left && playing) {
        gpio_put(PICO_DEFAULT_LED_PIN, 1);
    }
}
