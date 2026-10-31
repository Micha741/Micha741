// Převod USB HID klávesnice (US rozložení) na matici ZX Spectrum / Didaktik Gama.
//
// Pravidla:
//  - písmena, číslice, Enter, mezera = stejná klávesa; Shift + písmeno = CAPS SHIFT + písmeno
//  - Shift + číslice a interpunkce = znak, který je na PC klávesnici (US) natištěn,
//    vyrobený přes SYMBOL SHIFT (např. Shift+1 = '!' = SS+1, ',' = SS+N)
//  - Ctrl nebo Alt = SYMBOL SHIFT (pro klíčová slova a symboly přímo jako na Spectru)
//  - Backspace/Delete = DELETE (CS+0), šipky = CS+5..8, Esc = BREAK (CS+SPACE),
//    Caps Lock = CS+2, Tab = rozšířený režim (CS+SS)
//  - Ctrl+Alt+Del = reset počítače
#include "keymap.h"

#include <string.h>

// kód klávesy Spectra: řada (A8..A15 = 0..7) * 8 + bit (D0..D4)
#define K(row, bit) ((uint8_t)(((row) << 3) | (bit)))
#define NONE 0xFF

enum {
    CS = K(0, 0), KZ = K(0, 1), KX = K(0, 2), KC = K(0, 3), KV = K(0, 4),
    KA = K(1, 0), KS = K(1, 1), KD = K(1, 2), KF = K(1, 3), KG = K(1, 4),
    KQ = K(2, 0), KW = K(2, 1), KE = K(2, 2), KR = K(2, 3), KT = K(2, 4),
    K1 = K(3, 0), K2 = K(3, 1), K3 = K(3, 2), K4 = K(3, 3), K5 = K(3, 4),
    K0 = K(4, 0), K9 = K(4, 1), K8 = K(4, 2), K7 = K(4, 3), K6 = K(4, 4),
    KP = K(5, 0), KO = K(5, 1), KI = K(5, 2), KU = K(5, 3), KY = K(5, 4),
    ENT = K(6, 0), KL = K(6, 1), KK = K(6, 2), KJ = K(6, 3), KH = K(6, 4),
    SP = K(7, 0), SS = K(7, 1), KM = K(7, 2), KN = K(7, 3), KB = K(7, 4),
};

// HID kódy (USB HID Usage Tables, Keyboard page)
#define HID_A 0x04
#define HID_1 0x1E
#define HID_0 0x27
#define HID_ENTER 0x28
#define HID_ESC 0x29
#define HID_BKSP 0x2A
#define HID_TAB 0x2B
#define HID_SPACE 0x2C
#define HID_MINUS 0x2D
#define HID_EQUAL 0x2E
#define HID_SEMI 0x33
#define HID_QUOTE 0x34
#define HID_COMMA 0x36
#define HID_DOT 0x37
#define HID_SLASH 0x38
#define HID_CAPS 0x39
#define HID_DEL 0x4C
#define HID_RIGHT 0x4F
#define HID_LEFT 0x50
#define HID_DOWN 0x51
#define HID_UP 0x52
#define HID_KP_SLASH 0x54
#define HID_KP_STAR 0x55
#define HID_KP_MINUS 0x56
#define HID_KP_PLUS 0x57
#define HID_KP_ENTER 0x58
#define HID_KP_1 0x59
#define HID_KP_0 0x62
#define HID_KP_DOT 0x63

#define MOD_CTRL 0x11
#define MOD_SHIFT 0x22
#define MOD_ALT 0x44

static const uint8_t letters[26] = {
    KA, KB, KC, KD, KE, KF, KG, KH, KI, KJ, KK, KL, KM,
    KN, KO, KP, KQ, KR, KS, KT, KU, KV, KW, KX, KY, KZ,
};
static const uint8_t digits[10] = {K1, K2, K3, K4, K5, K6, K7, K8, K9, K0};  // HID 1..9, 0
// Shift + číslice (US): ! @ # $ % ^ & * ( )  -> klávesa, která se mačká se SYMBOL SHIFT
static const uint8_t digits_shifted[10] = {K1, K2, K3, K4, K5, KH, K6, KB, K8, K9};

static void press(zx_keys_t *k, uint8_t code) {
    if (code != NONE) k->rows[code >> 3] |= (uint8_t)(1u << (code & 7));
}

// interpunkce: znak bez Shiftu / se Shiftem, vždy se SYMBOL SHIFT
static bool punct(uint8_t hid, bool shift, uint8_t *key) {
    switch (hid) {
        case HID_MINUS: *key = shift ? K0 : KJ; return true;   // _  -
        case HID_EQUAL: *key = shift ? KK : KL; return true;   // +  =
        case HID_SEMI:  *key = shift ? KZ : KO; return true;   // :  ;
        case HID_QUOTE: *key = shift ? KP : K7; return true;   // "  '
        case HID_COMMA: *key = shift ? KR : KN; return true;   // <  ,
        case HID_DOT:   *key = shift ? KT : KM; return true;   // >  .
        case HID_SLASH: *key = shift ? KC : KV; return true;   // ?  /
        case HID_KP_SLASH: *key = KV; return true;
        case HID_KP_STAR:  *key = KB; return true;
        case HID_KP_MINUS: *key = KJ; return true;
        case HID_KP_PLUS:  *key = KK; return true;
        case HID_KP_DOT:   *key = KM; return true;
        default: return false;
    }
}

void keymap_compute(uint8_t modifiers, const uint8_t keycodes[6], zx_keys_t *out) {
    memset(out, 0, sizeof(*out));
    const bool shift = modifiers & MOD_SHIFT;
    const bool ctrl = modifiers & MOD_CTRL;
    const bool alt = modifiers & MOD_ALT;

    if (ctrl || alt) press(out, SS);

    for (int i = 0; i < 6; i++) {
        const uint8_t h = keycodes[i];
        uint8_t key;
        if (h == 0 || h == 1) continue;  // nic / přetečení (ErrorRollOver)

        if (h >= HID_A && h < HID_A + 26) {
            press(out, letters[h - HID_A]);
            if (shift) press(out, CS);
        } else if (h >= HID_1 && h <= HID_0) {
            if (shift && !ctrl && !alt) {
                press(out, SS);
                press(out, digits_shifted[h - HID_1]);
            } else {
                press(out, digits[h - HID_1]);
            }
        } else if (h >= HID_KP_1 && h <= HID_KP_0) {
            press(out, digits[h - HID_KP_1]);
        } else if (punct(h, shift, &key)) {
            press(out, SS);
            press(out, key);
        } else {
            switch (h) {
                case HID_ENTER:
                case HID_KP_ENTER: press(out, ENT); if (shift) press(out, CS); break;
                case HID_SPACE: press(out, SP); if (shift) press(out, CS); break;
                case HID_BKSP: press(out, CS); press(out, K0); break;
                case HID_DEL:
                    if (ctrl && alt) out->reset = true;
                    else { press(out, CS); press(out, K0); }
                    break;
                case HID_ESC: press(out, CS); press(out, SP); break;
                case HID_CAPS: press(out, CS); press(out, K2); break;
                case HID_TAB: press(out, CS); press(out, SS); break;
                case HID_LEFT: press(out, CS); press(out, K5); break;
                case HID_DOWN: press(out, CS); press(out, K6); break;
                case HID_UP: press(out, CS); press(out, K7); break;
                case HID_RIGHT: press(out, CS); press(out, K8); break;
                default: break;  // F-klávesy apod. nemají na Spectru obdobu
            }
        }
    }
    if (out->reset) memset(out->rows, 0, sizeof(out->rows));
}

void keymap_build_lut(const zx_keys_t *keys, uint8_t lut[256]) {
    for (int a = 0; a < 256; a++) {
        uint8_t m = 0;
        for (int r = 0; r < ZX_ROWS; r++)
            if (!(a & (1 << r))) m |= keys->rows[r];  // řada vybrána = adresová linka v nule
        lut[a] = m & 0x1F;
    }
}
