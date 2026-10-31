// =====================================================================================
// Didaktik Gama – náhrada ULA v CPLD Xilinx XC95144XL (modul ula_cpld_modul)
//
// Vlastní implementace chování ULA ZX Spectrum 48K pro zapojení Didaktiku Gama:
//  - obraz 256x192 + border, 448 px x 312 řádků (69888 T na snímek), hodiny 14 MHz
//  - čtení video RAM 2118 (16K, multiplexovaná adresa A0..A6 / A7..A13) stránkovým režimem
//  - obnova (refresh) 2118 během zatemnění na řádcích bez obrazu
//  - přístup CPU do 4000h–7FFFh: RAS/CAS/WE, pozdržení hodin CPU (contention)
//  - port FE: zápis border / MIC / BEEP, čtení klávesnice KB1..KB5 + EAR
//  - /INT 50 Hz, /ROMCS pro EPROM 0000h–3FFFh
//  - výstup: digitální R, G, B, BRIGHT, /CSYNC, /VSYNC (15,6 kHz) + BEEP
//
// Názvy portů = názvy netů v ula_cpld_modul.ucf (přiřazení pinů XC95144XL).
// Časování obrazu (pozice v pixelech hp = 0..447 na řádku, hc = takty 14 MHz 0..895):
//   obraz hp 4..259, pravý border 260..307, zatemnění 308..403 (HSYNC 324..355),
//   levý border 404..447 a 0..3; řádky: obraz 0..191, spodní border 192..247,
//   zatemnění 248..255 (VSYNC 248..251, /INT na začátku 248), horní border 256..311.
// Čtení video RAM: skupina 32 taktů (16 px) načte 2 znaky v taktech 0..15, takty 18..31
// jsou volné pro CPU. Znak A skupiny g se zobrazí na hp 16g+4..16g+11, znak B na 16g+12..16g+19.
// =====================================================================================
module gama_ula (
    input  wire CLK14,
    // sběrnice CPU
    input  wire RD_n, WR_n, MREQ_n, IORQGE_n, A14, A15,
    output wire INT_n, ROMCS_n,
    output reg  PHI_CPU,
    // klávesnice, magnetofon, zvuk
    input  wire KB1, KB2, KB3, KB4, KB5, EAR_IN,
    output wire MIC_OUT, BEEP,
    // video RAM 2118
    output wire RAS_n, CAS_n, WE_n,
    output wire DRAM_P5, DRAM_P6, DRAM_P7, DRAM_P8, DRAM_P9, DRAM_P10, DRAM_P11,
    inout  wire D0, D1, D2, D3, D4, D5, D6, D7,
    // digitální video
    output reg  VID_R, VID_G, VID_B, VID_I,
    output reg  CSYNC_n, VSYNC_n
);

    // ------------------------------------------------------------------ čítače
    reg [9:0] hc = 10'd0;          // 0..895 taktů 14 MHz na řádek
    reg [8:0] vc = 9'd0;           // 0..311 řádků
    wire [8:0] hp = hc[9:1];       // pixel 0..447
    wire [4:0] c  = hc[4:0];       // takt ve skupině (16 px)
    wire [4:0] g  = hc[9:5];       // skupina 0..27

    wire line_end  = (hc == 10'd895);
    wire frame_end = line_end && (vc == 9'd311);

    always @(posedge CLK14) begin
        hc <= line_end ? 10'd0 : hc + 10'd1;
        if (line_end) vc <= (vc == 9'd311) ? 9'd0 : vc + 9'd1;
    end

    // následující skupina (pro přípravu adresy a povolení přístupu CPU)
    wire       last_g = (g == 5'd27);
    wire [4:0] g_n    = last_g ? 5'd0 : g + 5'd1;
    wire [8:0] vc_n   = last_g ? ((vc == 9'd311) ? 9'd0 : vc + 9'd1) : vc;

    wire disp_line   = (vc < 9'd192);
    wire disp_line_n = (vc_n < 9'd192);
    wire fetch_g     = disp_line   && !g[4];                        // skupiny 0..15
    wire fetch_n     = disp_line_n && !g_n[4];
    wire refr_g      = !disp_line   && (g[4:2]   == 3'b101);         // skupiny 20..23
    wire refr_n      = !disp_line_n && (g_n[4:2] == 3'b101);
    wire busy_g      = fetch_g | refr_g;
    wire busy_n      = fetch_n | refr_n;

    // ------------------------------------------------------------------ plán DRAM (registrovaný)
    // Výstupy se počítají pro následující takt (tk = c+1), proto při c==31 platí další skupina.
    wire       wrap   = (c == 5'd31);
    wire [4:0] tk     = c + 5'd1;
    wire       t_fet  = wrap ? fetch_n : fetch_g;
    wire       t_ref  = wrap ? refr_n  : refr_g;
    wire [4:0] t_g    = wrap ? g_n     : g;
    wire [8:0] t_vc   = wrap ? vc_n    : vc;
    wire       prep   = (c == 5'd30);                    // takt 31: předložit řádek další skupiny

    // adresa znaku
    wire [7:0] y   = (prep ? vc_n[7:0] : t_vc[7:0]);
    wire [3:0] gg  = (prep ? g_n[3:0]  : t_g[3:0]);
    wire       chB = !prep && (tk >= 5'd7) && (tk <= 5'd15);
    wire [4:0] x   = {gg, chB};
    wire [6:0] row_fetch = {y[4], y[3], x};
    wire [6:0] col_bm    = {1'b0, y[7], y[6], y[2], y[1], y[0], y[5]};     // A13..A7
    wire [6:0] col_at    = {1'b0, 1'b1, 1'b1, 1'b0, y[7], y[6], y[5]};

    // obnova: 2 řádky na skupinu, 4 skupiny na řádek => 128 řádků DRAM za 16 řádků obrazu
    wire [8:0] r_vc  = prep ? vc_n : t_vc;
    wire [4:0] r_g   = prep ? g_n  : t_g;
    wire [6:0] row_refr = {r_vc[3:0], r_g[1:0], (!prep && tk >= 5'd4)};

    reg        ula_ras = 1'b0, ula_cas = 1'b0, a_oe = 1'b0;
    reg [6:0]  a_out = 7'd0;
    always @(posedge CLK14) begin
        if (prep) begin
            ula_ras <= 1'b0;
            ula_cas <= 1'b0;
            a_oe    <= busy_n;
            a_out   <= fetch_n ? row_fetch : row_refr;
        end else if (t_fet) begin
            ula_ras <= (tk <= 5'd6) || (tk >= 5'd9 && tk <= 5'd15);
            ula_cas <= (tk == 5'd2) || (tk == 5'd3) || (tk == 5'd5) || (tk == 5'd6) ||
                       (tk == 5'd11) || (tk == 5'd12) || (tk == 5'd14) || (tk == 5'd15);
            a_oe    <= (tk <= 5'd15);
            case (tk)
                5'd1, 5'd2, 5'd3, 5'd10, 5'd11, 5'd12: a_out <= col_bm;
                5'd4, 5'd5, 5'd6, 5'd13, 5'd14, 5'd15: a_out <= col_at;
                default:                               a_out <= row_fetch;
            endcase
        end else if (t_ref) begin
            ula_ras <= (tk <= 5'd3) || (tk >= 5'd6 && tk <= 5'd9);
            ula_cas <= 1'b0;
            a_oe    <= (tk <= 5'd9);
            a_out   <= row_refr;
        end else begin
            ula_ras <= 1'b0;
            ula_cas <= 1'b0;
            a_oe    <= 1'b0;
        end
    end

    // výstupy adresy: VA0..VA6 = piny ULA 7,6,5,8,9,10,11 (zapojení Gamy)
    assign DRAM_P7  = a_oe ? a_out[0] : 1'bz;
    assign DRAM_P6  = a_oe ? a_out[1] : 1'bz;
    assign DRAM_P5  = a_oe ? a_out[2] : 1'bz;
    assign DRAM_P8  = a_oe ? a_out[3] : 1'bz;
    assign DRAM_P9  = a_oe ? a_out[4] : 1'bz;
    assign DRAM_P10 = a_oe ? a_out[5] : 1'bz;
    assign DRAM_P11 = a_oe ? a_out[6] : 1'bz;

    // ------------------------------------------------------------------ data video RAM
    wire [7:0] vd_in = {D7, D6, D5, D4, D3, D2, D1, D0};
    reg  [7:0] bmA = 8'd0, atA = 8'd0, bmB = 8'd0, atB = 8'd0;
    always @(posedge CLK14) if (fetch_g) begin
        if (c == 5'd3)  bmA <= vd_in;
        if (c == 5'd6)  atA <= vd_in;
        if (c == 5'd12) bmB <= vd_in;
        if (c == 5'd15) atB <= vd_in;
    end

    // ------------------------------------------------------------------ přístup CPU do 4000h–7FFFh
    wire range = A14 & ~A15;
    reg  mreq_s = 1'b0, wr_s = 1'b0, iorq_s = 1'b0, rd_s = 1'b0;
    // CAS až po /RD (čtení) nebo po /WE (zápis): data DI/DO jsou na 2118 spojená, takže zápis musí být
    // "early write" (WE před CAS), jinak by výstup DRAM přetlačil data CPU (ta jdou přes 470R).
    // Obnovovací cykly Z80 (MREQ bez RD/WR) dají jen RAS.
    reg  cpu_ras = 1'b0, cpu_ras_d = 1'b0, cpu_cas = 1'b0, cpu_we = 1'b0, wr_d = 1'b0;
    always @(posedge CLK14) begin
        mreq_s    <= ~MREQ_n;
        wr_s      <= ~WR_n;
        rd_s      <= ~RD_n;
        iorq_s    <= ~IORQGE_n;
        wr_d      <= wr_s;
        cpu_ras   <= mreq_s & range;
        cpu_ras_d <= cpu_ras;
        cpu_cas   <= cpu_ras & cpu_ras_d & mreq_s & range & (rd_s | wr_d);
        cpu_we    <= mreq_s & wr_s & range;
    end
    assign RAS_n = ~(ula_ras | cpu_ras);
    assign CAS_n = ~(ula_cas | cpu_cas);
    assign WE_n  = ~cpu_we;

    // ------------------------------------------------------------------ hodiny CPU a contention
    // Z80 CLK = ~PHI_CPU (invertor T2 na desce). cp 0,1 = CLK vysoko, 2,3 = nízko.
    // Sestupná hrana CLK (přechod cp 1->2) se pozdrží, pokud by přístup do video RAM nebo
    // na port ULA kolidoval se čtením obrazu / obnovou.
    reg [1:0] cp = 2'd0;
    wire [5:0] t_next = {1'b0, c} + 6'd1;      // pozice příští sestupné hrany ve skupině
    wire mem_ok = wrap ? !busy_n
                       : !((busy_g && t_next <= 6'd17) || (busy_n && t_next >= 6'd21));
    wire io_ok  = wrap ? !busy_n : !(busy_g && t_next <= 6'd17);
    wire stall  = (cp == 2'd1) &&
                  ((range && MREQ_n && !mem_ok) || (!IORQGE_n && !io_ok));
    always @(posedge CLK14) begin
        if (!stall) cp <= cp + 2'd1;
        PHI_CPU <= stall ? PHI_CPU : (cp == 2'd1 || cp == 2'd2);   // PHI = ~CLK pro příští takt
    end

    // ------------------------------------------------------------------ port FE
    reg [2:0] border = 3'd0;
    reg       mic = 1'b0, beep = 1'b0;
    always @(posedge CLK14) if (iorq_s && wr_s) {beep, mic, border} <= vd_in[4:0];
    assign MIC_OUT = mic;
    assign BEEP    = beep;

    wire ula_bus = busy_g && (c <= 5'd16);                 // ULA právě čte video RAM
    wire port_rd = ~IORQGE_n & ~RD_n & ~ula_bus;
    wire [7:0] port_data = {1'b1, EAR_IN, 1'b1, KB5, KB4, KB3, KB2, KB1};
    assign {D7, D6, D5, D4, D3, D2, D1, D0} = port_rd ? port_data : 8'bz;

    // ------------------------------------------------------------------ ROM, přerušení
    assign ROMCS_n = A15 | A14 | MREQ_n;
    reg int_q = 1'b0;
    always @(posedge CLK14) int_q <= (vc == 9'd248) && (hp < 9'd64);
    assign INT_n = ~int_q;

    // ------------------------------------------------------------------ obraz
    reg [4:0] flash_cnt = 5'd0;
    always @(posedge CLK14) if (line_end && vc == 9'd247) flash_cnt <= flash_cnt + 5'd1;

    wire [3:0] qq     = hp[3:0] - 4'd4;
    wire       phA    = ~qq[3];
    wire [2:0] bsel   = ~qq[2:0];                          // bit 7 první
    wire [7:0] bm     = phA ? bmA : bmB;
    wire [7:0] at     = phA ? atA : atB;
    wire       in_disp = disp_line && (hp >= 9'd4) && (hp < 9'd260);
    wire       hblank  = (hp >= 9'd308) && (hp < 9'd404);
    wire       vblank  = (vc >= 9'd248) && (vc < 9'd256);
    wire       hs      = (hp >= 9'd324) && (hp < 9'd356);
    wire       vs      = (vc >= 9'd248) && (vc < 9'd252);
    wire       ink_on  = bm[bsel] ^ (at[7] & flash_cnt[4]);
    wire [2:0] col     = ink_on ? at[2:0] : at[5:3];       // G R B

    always @(posedge CLK14) begin
        if (hblank || vblank) begin
            {VID_G, VID_R, VID_B} <= 3'b000;
            VID_I <= 1'b0;
        end else if (in_disp) begin
            {VID_G, VID_R, VID_B} <= col;
            VID_I <= at[6];
        end else begin
            {VID_G, VID_R, VID_B} <= border;
            VID_I <= 1'b0;
        end
        CSYNC_n <= ~(hs ^ vs);
        VSYNC_n <= ~vs;
    end

endmodule
