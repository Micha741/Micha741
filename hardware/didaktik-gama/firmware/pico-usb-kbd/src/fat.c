// Minimální čtení FAT12/16/32 – viz fat.h
#include "fat.h"

#include <string.h>

static uint16_t le16(const uint8_t *p) { return (uint16_t)(p[0] | (p[1] << 8)); }
static uint32_t le32(const uint8_t *p) {
    return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

static bool load(fat_fs_t *fs, uint32_t lba) {
    if (fs->buf_lba == lba) return true;
    if (!fs->read(lba, fs->buf, fs->ctx)) {
        fs->buf_lba = 0xFFFFFFFFu;
        return false;
    }
    fs->buf_lba = lba;
    return true;
}

static bool is_bpb(const uint8_t *b) {
    return (b[0] == 0xEB || b[0] == 0xE9) && le16(b + 11) == 512 && b[13] != 0 && b[16] != 0;
}

bool fat_mount(fat_fs_t *fs, fat_read_fn read, void *ctx) {
    memset(fs, 0, sizeof(*fs));
    fs->read = read;
    fs->ctx = ctx;
    fs->buf_lba = 0xFFFFFFFFu;
    if (!load(fs, 0) || fs->buf[510] != 0x55 || fs->buf[511] != 0xAA) return false;
    if (!is_bpb(fs->buf)) {  // MBR: první oddíl
        fs->part_lba = le32(fs->buf + 0x1BE + 8);
        if (!fs->part_lba || !load(fs, fs->part_lba) || !is_bpb(fs->buf)) return false;
    }
    const uint8_t *b = fs->buf;
    const uint32_t rsvd = le16(b + 14), nfats = b[16], root_ent = le16(b + 17);
    const uint32_t tot = le16(b + 19) ? le16(b + 19) : le32(b + 32);
    const uint32_t fatsz = le16(b + 22) ? le16(b + 22) : le32(b + 36);
    fs->sec_per_clus = b[13];
    fs->root_sectors = (root_ent * 32 + 511) / 512;
    fs->fat_lba = fs->part_lba + rsvd;
    fs->root_lba = fs->fat_lba + nfats * fatsz;
    fs->data_lba = fs->root_lba + fs->root_sectors;
    if (tot <= rsvd + nfats * fatsz + fs->root_sectors) return false;
    fs->clusters = (tot - rsvd - nfats * fatsz - fs->root_sectors) / fs->sec_per_clus;
    fs->type = fs->clusters < 4085 ? 12 : fs->clusters < 65525 ? 16 : 32;
    fs->root_cluster = fs->type == 32 ? le32(b + 44) : 0;
    return true;
}

static uint32_t clus_lba(const fat_fs_t *fs, uint32_t c) {
    return fs->data_lba + (c - 2) * fs->sec_per_clus;
}

// další cluster v řetězci; 0 = konec nebo chyba
static uint32_t next_cluster(fat_fs_t *fs, uint32_t c) {
    uint32_t v;
    if (fs->type == 12) {
        const uint32_t off = c + c / 2;
        if (!load(fs, fs->fat_lba + off / 512)) return 0;
        uint32_t lo = fs->buf[off % 512];
        if (!load(fs, fs->fat_lba + (off + 1) / 512)) return 0;
        uint32_t hi = fs->buf[(off + 1) % 512];
        v = lo | (hi << 8);
        v = (c & 1) ? v >> 4 : v & 0xFFF;
        if (v >= 0xFF8) return 0;
    } else if (fs->type == 16) {
        if (!load(fs, fs->fat_lba + c * 2 / 512)) return 0;
        v = le16(fs->buf + c * 2 % 512);
        if (v >= 0xFFF8) return 0;
    } else {
        if (!load(fs, fs->fat_lba + c * 4 / 512)) return 0;
        v = le32(fs->buf + c * 4 % 512) & 0x0FFFFFFFu;
        if (v >= 0x0FFFFFF8u) return 0;
    }
    return (v < 2 || v >= fs->clusters + 2) ? 0 : v;
}

int fat_list(fat_fs_t *fs, const char *ext, fat_entry_t *out, int max) {
    int n = 0;
    uint32_t clus = fs->root_cluster, idx = 0;
    for (;;) {
        uint32_t lba;
        if (fs->type == 32) {
            const uint32_t in_clus = idx % fs->sec_per_clus;
            if (idx && !in_clus && !(clus = next_cluster(fs, clus))) break;
            lba = clus_lba(fs, clus) + in_clus;
        } else {
            if (idx >= fs->root_sectors) break;
            lba = fs->root_lba + idx;
        }
        idx++;
        if (!load(fs, lba)) break;
        for (int i = 0; i < 512; i += 32) {
            const uint8_t *d = fs->buf + i;
            if (d[0] == 0) goto done;
            if (d[0] == 0xE5 || d[11] == 0x0F || (d[11] & 0x18)) continue;
            if (memcmp(d + 8, ext, 3) != 0 || n >= max) continue;
            fat_entry_t *e = &out[n++];
            int k = 0;
            for (int j = 0; j < 8 && d[j] != ' '; j++) e->name[k++] = (char)d[j];
            e->name[k++] = '.';
            for (int j = 8; j < 11 && d[j] != ' '; j++) e->name[k++] = (char)d[j];
            e->name[k] = 0;
            e->cluster = ((uint32_t)le16(d + 20) << 16 | le16(d + 26));
            if (fs->type != 32) e->cluster &= 0xFFFF;
            e->size = le32(d + 28);
        }
    }
done:
    for (int i = 1; i < n; i++)  // řazení podle jména
        for (int j = i; j > 0 && strcmp(out[j - 1].name, out[j].name) > 0; j--) {
            fat_entry_t t = out[j];
            out[j] = out[j - 1];
            out[j - 1] = t;
        }
    return n;
}

void fat_open(fat_fs_t *fs, const fat_entry_t *e, fat_file_t *f) {
    f->fs = fs;
    f->first_cluster = f->cluster = e->cluster;
    f->size = e->size;
    f->pos = 0;
    f->sec_lba = 0xFFFFFFFFu;
}

int fat_getc(fat_file_t *f) {
    fat_fs_t *fs = f->fs;
    if (f->pos >= f->size || f->cluster < 2) return -1;
    const uint32_t clus_bytes = (uint32_t)fs->sec_per_clus * 512;
    if (f->pos && f->pos % clus_bytes == 0 && f->sec_lba != 0xFFFFFFFFu) {
        // přechod do dalšího clusteru (jen jednou na hranici)
        const uint32_t nx = next_cluster(fs, f->cluster);
        if (!nx) return -1;
        f->cluster = nx;
    }
    const uint32_t lba = clus_lba(fs, f->cluster) + (f->pos % clus_bytes) / 512;
    if (lba != f->sec_lba) {
        if (!fs->read(lba, f->sec, fs->ctx)) return -1;
        f->sec_lba = lba;
    }
    return f->sec[f->pos++ % 512];
}
