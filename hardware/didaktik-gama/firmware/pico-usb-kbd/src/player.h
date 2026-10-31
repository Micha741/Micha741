// Přehrávač kazet: soubory .TAP a .TZX z USB flash disku -> signál kazety na GP14 -> vstup magnetofonu Gamy.
// Ovládání z USB klávesnice: F1 = další soubor, F3 = předchozí, F2 = přehrát / zastavit
// (po zastavení pásky blokem TZX 0x20/0x2A pokračuje F2 dalším blokem).
// LED na Picu: po výběru blikne tolikrát, kolikátý soubor je vybrán (abecedně); při přehrávání svítí.
#pragma once
#include <stdbool.h>
#include <stdint.h>

void player_init(void);
void player_task(void);                          // volat v hlavní smyčce (ne z callbacků USB)
void player_keys(const uint8_t keycodes[6]);     // každý přijatý report klávesnice
bool player_owns_led(void);
