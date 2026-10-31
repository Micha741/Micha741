// Minimální čtení FAT12/16/32 (jen kořenový adresář, krátká jména 8.3, jen pro čtení).
// Stačí na výpis a čtení souborů .TAP z USB flash disku.
#pragma once
#include <stdbool.h>
#include <stdint.h>

// čtení jednoho 512B sektoru z disku; vrací true při úspěchu
typedef bool (*fat_read_fn)(uint32_t lba, uint8_t *buf512, void *ctx);

typedef struct {
    fat_read_fn read;
    void *ctx;
    uint32_t part_lba;        // začátek oddílu
    uint8_t type;             // 12, 16 nebo 32
    uint8_t sec_per_clus;
    uint32_t fat_lba;
    uint32_t root_lba;        // FAT12/16: pevný kořenový adresář
    uint32_t root_sectors;    // FAT12/16
    uint32_t root_cluster;    // FAT32
    uint32_t data_lba;
    uint32_t clusters;
    uint8_t buf[512];         // pracovní sektor (FAT, adresář)
    uint32_t buf_lba;
} fat_fs_t;

typedef struct {
    char name[13];            // "HRA.TAP"
    uint32_t cluster;
    uint32_t size;
} fat_entry_t;

typedef struct {
    fat_fs_t *fs;
    uint32_t first_cluster, cluster, size, pos;
    uint8_t sec[512];
    uint32_t sec_lba;         // který sektor je v sec (0xFFFFFFFF = žádný)
} fat_file_t;

bool fat_mount(fat_fs_t *fs, fat_read_fn read, void *ctx);
// vypíše soubory s příponou ext (např. "TAP") z kořene, seřazené podle jména; vrací počet
int fat_list(fat_fs_t *fs, const char *ext, fat_entry_t *out, int max);
void fat_open(fat_fs_t *fs, const fat_entry_t *e, fat_file_t *f);
// přečte jeden bajt; vrací -1 na konci souboru nebo při chybě
int fat_getc(fat_file_t *f);
// přesun na pozici v souboru (pro skoky a smyčky TZX); false = mimo soubor nebo chyba
bool fat_seek(fat_file_t *f, uint32_t pos);
