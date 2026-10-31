// Přehrávač kazet: soubory .TAP z USB flash disku -> signál kazety na GP14 -> vstup magnetofonu Gamy.
// Ovládání z USB klávesnice: F1 = další soubor, F3 = předchozí, F2 = přehrát / zastavit.
// LED na Picu: po výběru blikne tolikrát, kolikátý soubor je vybrán (abecedně); při přehrávání svítí.
#pragma once
#include <stdbool.h>
#include <stdint.h>

void player_init(void);
void player_task(void);                          // volat v hlavní smyčce (ne z callbacků USB)
void player_keys(const uint8_t keycodes[6]);     // každý přijatý report klávesnice
bool player_owns_led(void);
