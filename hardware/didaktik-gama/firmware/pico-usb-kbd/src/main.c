// Didaktik Gama – USB klávesnice přes Raspberry Pi Pico (USB host).
//
// Zapojení (schéma hlavní desky, blok "USB KLÁVESNICE"):
//   GP0..GP7  <- A8..A15 přes 74LVC245 (5 V -> 3,3 V)
//   GP8..GP12 -> KB1..KB5 přes 74LVC07 (otevřený kolektor; 0 = klávesa stisknuta)
//   GP13      -> /RESET přes 74LVC07 (0 = reset)
//   GP14      -> signál kazety přes dělič do vstupu magnetofonu (přehrávač .TAP, viz player.h)
//   USB (micro-USB přes redukci OTG, případně USB rozbočovač) = klávesnice + flash disk,
//   napájení +5V do VBUS
//
// Jádro 1 v nekonečné smyčce čte A8..A15 a z tabulky okamžitě nastaví KB1..KB5 – počítač
// při čtení portu FE vidí stejnou odezvu jako u mechanické klávesnice.
// Jádro 0 obsluhuje USB (TinyUSB host) a při změně kláves přepočítá tabulku.
#include <string.h>

#include "hardware/gpio.h"
#include "hardware/structs/sio.h"
#include "keymap.h"
#include "player.h"
#include "pico/multicore.h"
#include "pico/stdlib.h"
#include "tusb.h"

#define PIN_ADDR_BASE 0   // GP0..GP7 = A8..A15
#define PIN_KB_BASE 8     // GP8..GP12 = KB1..KB5
#define PIN_RESET 13      // GP13 = /RESET
#define KB_MASK (0x1Fu << PIN_KB_BASE)
#define RESET_MS 200

// Pořadí linek KB1..KB5 vůči datovým bitům D0..D4. Pokud po zapojení stisk např. "Q"
// vypíše jiný znak ze stejné řady, prohoďte zde pořadí (index = KBn-1, hodnota = bit Dx).
static const uint8_t kb_to_bit[5] = {0, 1, 2, 3, 4};

static uint8_t lut_buf[2][256];
static uint8_t out_lut[2][256];  // přepočteno na hodnoty pinů KB1..KB5
static volatile const uint8_t *active_out = out_lut[0];
static int lut_idx;
static uint32_t reset_until;

// ------------------------------------------------------------------ jádro 1: emulace matice
static void __not_in_flash_func(matrix_loop)(void) {
    for (;;) {
        const uint8_t a = (uint8_t)(sio_hw->gpio_in >> PIN_ADDR_BASE);
        const uint32_t pressed = (uint32_t)active_out[a] << PIN_KB_BASE;
        sio_hw->gpio_clr = pressed;             // stisknuté -> 0 (74LVC07 stáhne linku)
        sio_hw->gpio_set = KB_MASK & ~pressed;  // ostatní -> 1 (linka uvolněna)
    }
}

static void publish(const zx_keys_t *keys) {
    const int next = lut_idx ^ 1;
    keymap_build_lut(keys, lut_buf[next]);
    for (int a = 0; a < 256; a++) {
        uint8_t v = 0;
        for (int kb = 0; kb < 5; kb++)
            if (lut_buf[next][a] & (1u << kb_to_bit[kb])) v |= (uint8_t)(1u << kb);
        out_lut[next][a] = v;
    }
    __dmb();

    active_out = out_lut[next];
    lut_idx = next;

    if (keys->reset) {
        gpio_put(PIN_RESET, 0);
        reset_until = to_ms_since_boot(get_absolute_time()) + RESET_MS;
    }
    if (!player_owns_led())
        gpio_put(PICO_DEFAULT_LED_PIN, memcmp(keys->rows, (uint8_t[ZX_ROWS]){0}, ZX_ROWS) != 0);
}

// ------------------------------------------------------------------ USB HID (TinyUSB host)
void tuh_hid_mount_cb(uint8_t dev_addr, uint8_t instance, uint8_t const *desc_report, uint16_t desc_len) {
    (void)desc_report;
    (void)desc_len;
    if (tuh_hid_interface_protocol(dev_addr, instance) == HID_ITF_PROTOCOL_KEYBOARD)
        tuh_hid_receive_report(dev_addr, instance);
}

void tuh_hid_umount_cb(uint8_t dev_addr, uint8_t instance) {
    (void)dev_addr;
    (void)instance;
    const zx_keys_t none = {0};
    publish(&none);
}

void tuh_hid_report_received_cb(uint8_t dev_addr, uint8_t instance, uint8_t const *report, uint16_t len) {
    if (tuh_hid_interface_protocol(dev_addr, instance) == HID_ITF_PROTOCOL_KEYBOARD &&
        len >= sizeof(hid_keyboard_report_t)) {
        const hid_keyboard_report_t *r = (const hid_keyboard_report_t *)report;
        zx_keys_t keys;
        player_keys(r->keycode);
        keymap_compute(r->modifier, r->keycode, &keys);
        publish(&keys);
    }
    tuh_hid_receive_report(dev_addr, instance);
}

// ------------------------------------------------------------------ start
int main(void) {
    // výstupy nejdřív do klidového stavu (1 = uvolněno), teprve pak zapnout jako výstupy
    for (int i = 0; i < 8; i++) {
        gpio_init(PIN_ADDR_BASE + i);
        gpio_set_dir(PIN_ADDR_BASE + i, GPIO_IN);
    }
    for (int i = 0; i < 5; i++) {
        gpio_init(PIN_KB_BASE + i);
        gpio_put(PIN_KB_BASE + i, 1);
        gpio_set_dir(PIN_KB_BASE + i, GPIO_OUT);
    }
    gpio_init(PIN_RESET);
    gpio_put(PIN_RESET, 1);
    gpio_set_dir(PIN_RESET, GPIO_OUT);
    gpio_init(PICO_DEFAULT_LED_PIN);
    gpio_set_dir(PICO_DEFAULT_LED_PIN, GPIO_OUT);

    player_init();
    const zx_keys_t none = {0};
    publish(&none);
    multicore_launch_core1(matrix_loop);

    tusb_init();  // režim host podle CFG_TUSB_RHPORT0_MODE v tusb_config.h
    for (;;) {
        tuh_task();
        player_task();
        if (reset_until && to_ms_since_boot(get_absolute_time()) >= reset_until) {
            gpio_put(PIN_RESET, 1);
            reset_until = 0;
        }
    }
}
