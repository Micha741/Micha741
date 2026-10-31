// Přehrávač kazet – viz player.h
#include "player.h"

#include <stddef.h>

#include "fat.h"
#include "hardware/gpio.h"
#include "pico/stdlib.h"
#include "tap.h"
#include "tzx.h"
#include <string.h>
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
static tzx_t tzx;
static bool is_tzx, resumable;   // TZX zastavil pásku (blok 0x20/0x2A) -> F2 pokračuje
static uint32_t frac;            // zbytek převodu T-stavů na µs
static volatile bool k_next, k_prev, k_play;
static uint8_t prev_keys[6];
static int blink_left;
static absolute_time_t blink_at;

static int file_getc(void *ctx) { return fat_getc((fat_file_t *)ctx); }
static bool file_seek(void *ctx, uint32_t pos) { return fat_seek((fat_file_t *)ctx, pos); }
static uint32_t file_tell(void *ctx) { return ((fat_file_t *)ctx)->pos; }

static bool ends_with(const char *name, const char *ext) {
    const size_t n = strlen(name);
    return n > 4 && strcmp(name + n - 4, ext) == 0;
}

// další pulz z TAP nebo TZX; false = konec nebo zastavení pásky
static bool next_pulse(tap_pulse_t *p) {
    if (!is_tzx) return tap_next(&tap, p);
    const tzx_result_t r = tzx_next(&tzx, p);
    if (r == TZX_STOP) resumable = true;
    return r == TZX_PULSE;
}

static void blink(int n) {
    blink_left = n * 2;
    blink_at = get_absolute_time();
    gpio_put(PICO_DEFAULT_LED_PIN, 0);
}

static void stop(void) {
    resumable = false;
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
        if (!next_pulse(&p)) {
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
        nfiles = 0;
        if (fat_mount(&fs, disk_read, NULL)) {
            nfiles = fat_list(&fs, "TAP", files, MAX_FILES);
            nfiles += fat_list(&fs, "TZX", files + nfiles, MAX_FILES - nfiles);
            for (int i = 1; i < nfiles; i++)   // TAP a TZX dohromady podle abecedy
                for (int j = i; j > 0 && strcmp(files[j - 1].name, files[j].name) > 0; j--) {
                    const fat_entry_t tmp = files[j];
                    files[j] = files[j - 1];
                    files[j - 1] = tmp;
                }
        }
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
        } else if (resumable) {          // pokračovat po zastavení pásky v TZX
            resumable = false;
            playing = true;
        } else if (nfiles) {
            fat_open(&fs, &files[sel], &file);
            frac = 0;
            is_tzx = ends_with(files[sel].name, ".TZX");
            if (is_tzx) {
                const tape_io_t io = {file_getc, file_seek, file_tell, &file};
                playing = tzx_open(&tzx, &io);
                if (!playing) blink(10);  // poškozený nebo neplatný TZX
            } else {
                tap_init(&tap, file_getc, &file);
                playing = true;
            }
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
