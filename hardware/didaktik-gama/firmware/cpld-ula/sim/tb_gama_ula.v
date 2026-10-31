// Simulace modulu ULA (Icarus Verilog): video RAM 2118 + multiplexer 74LS157 + model sběrnice Z80.
// Vykreslí snímek do frame.ppm a ověří přístup CPU, contention, port FE, /INT a /ROMCS.
`timescale 1ns/1ps
module tb;
    reg clk = 0;
    always #35.714 clk = ~clk;                  // 14 MHz

    // sběrnice CPU
    reg  [15:0] addr = 16'h0000;
    reg  mreq_n = 1, iorq_n = 1, rd_n = 1, wr_n = 1;
    reg  [7:0] cpu_dout = 8'h00;
    reg  cpu_drive = 0;
    reg  [4:0] kb = 5'b11111;
    reg  ear = 0;
    wire iorqge_n = iorq_n | addr[0];           // tranzistor T1: ULA vidí jen sudé porty

    wire INT_n, ROMCS_n, PHI, MIC, BEEP, RAS_n, CAS_n, WE_n;
    wire P5, P6, P7, P8, P9, P10, P11;
    tri1 [7:0] vd;                              // nedefinovaná sběrnice = FF
    wire R, G, B, I, CSYNC_n, VSYNC_n;

    gama_ula dut (.CLK14(clk), .RD_n(rd_n), .WR_n(wr_n), .MREQ_n(mreq_n), .IORQGE_n(iorqge_n),
        .A14(addr[14]), .A15(addr[15]), .INT_n(INT_n), .ROMCS_n(ROMCS_n), .PHI_CPU(PHI),
        .KB1(kb[0]), .KB2(kb[1]), .KB3(kb[2]), .KB4(kb[3]), .KB5(kb[4]), .EAR_IN(ear),
        .MIC_OUT(MIC), .BEEP(BEEP), .RAS_n(RAS_n), .CAS_n(CAS_n), .WE_n(WE_n),
        .DRAM_P5(P5), .DRAM_P6(P6), .DRAM_P7(P7), .DRAM_P8(P8), .DRAM_P9(P9), .DRAM_P10(P10),
        .DRAM_P11(P11), .D0(vd[0]), .D1(vd[1]), .D2(vd[2]), .D3(vd[3]), .D4(vd[4]), .D5(vd[5]),
        .D6(vd[6]), .D7(vd[7]), .VID_R(R), .VID_G(G), .VID_B(B), .VID_I(I), .CSYNC_n(CSYNC_n),
        .VSYNC_n(VSYNC_n));

    // adresové linky DRAM VA0..VA6: ULA (silně) nebo 74LS157 MUX1 přes 330R (slabě);
    // výběr multiplexeru = /RAS přes 100R: RAS=1 -> řádek A0..A6, RAS=0 -> sloupec A7..A13
    // (rezistor = výstup ULA má přednost; Icarus nepřenáší sílu budiče přes porty, proto explicitně)
    wire [6:0] ula_va = {P11, P10, P9, P8, P5, P6, P7};
    wire [6:0] mux = RAS_n ? addr[6:0] : addr[13:7];
    genvar gi;
    wire [6:0] va;
    generate for (gi = 0; gi < 7; gi = gi + 1) begin : vabit
        assign va[gi] = (ula_va[gi] === 1'bz) ? mux[gi] : ula_va[gi];
    end endgenerate

    // datová sběrnice videa: CPU přes 470R (slabě), DRAM a ULA silně
    assign vd = (cpu_drive && !dram_oe && !dut.port_rd) ? cpu_dout : 8'hzz;  // 470R: ustoupí silnějším

    // ---- model 2118 (16K x 8): index = {sloupec, řádek} = logická adresa A13..A0
    reg [7:0] mem [0:16383];
    reg [6:0] row, colq;
    reg dram_oe = 0;
    reg [7:0] dram_q;
    integer ras_low_since, violations = 0;
    always @(negedge RAS_n) begin
        row = va;
        ras_low_since = $time;
        if (^va === 1'bx) begin $display("CHYBA: neplatná řádková adresa %b @%0t oe=%b aout=%b P=%b%b%b%b%b%b%b vc=%0d hc=%0d", va, $time, dut.a_oe, dut.a_out, P11,P10,P9,P8,P5,P6,P7, dut.vc, dut.hc); violations = violations + 1; end
    end
    always @(negedge CAS_n) begin
        colq = va;
        if (RAS_n) begin $display("CHYBA: CAS bez RAS @%0t", $time); violations = violations + 1; end
        if (!WE_n) mem[{colq, row}] = vd;
    end
    always @(negedge WE_n) if (!CAS_n) mem[{colq, row}] = vd;   // pozdní zápis
    always @(*) begin
        dram_oe = !CAS_n && WE_n && !RAS_n;
        dram_q  = mem[{colq, row}];
    end
    assign #40 vd = dram_oe ? dram_q : 8'hzz;
    always @(posedge RAS_n) if ($time - ras_low_since > 10000) begin
        $display("CHYBA: RAS příliš dlouho @%0t", $time); violations = violations + 1; end

    // ---- hodiny Z80 = ~PHI (invertor T2)
    wire zclk = ~PHI;

    // ---- čítání pozdržení hodin
    integer stalled_clks = 0;
    reg zclk_prev = 0; integer hi_len = 0;
    always @(posedge clk) begin
        if (zclk) hi_len = hi_len + 1; else hi_len = 0;
        if (hi_len > 2) stalled_clks = stalled_clks + 1;
    end

    // ---- cykly sběrnice Z80 (zjednodušené časování podle katalogu Z80)
    task t1_addr(input [15:0] a); begin @(posedge zclk); #20 addr = a; end endtask
    task mem_read(input [15:0] a, output [7:0] d); begin
        t1_addr(a);
        @(negedge zclk); #20 mreq_n = 0; rd_n = 0;
        @(posedge zclk);                                  // T2
        @(posedge zclk);                                  // T3: vzorkování dat
        d = (a[15:14] == 2'b01) ? vd : 8'hxx;
        @(negedge zclk); #20 mreq_n = 1; rd_n = 1;
    end endtask
    task mem_write(input [15:0] a, input [7:0] d); begin
        t1_addr(a);
        @(negedge zclk); #20 mreq_n = 0; cpu_dout = d; cpu_drive = 1;
        @(negedge zclk); #20 wr_n = 0;                    // T2
        @(negedge zclk); #20 wr_n = 1; mreq_n = 1;        // T3
        @(posedge zclk); #20 cpu_drive = 0;
    end endtask
    task io_read(input [15:0] a, output [7:0] d); begin
        t1_addr(a);
        @(posedge zclk); #20 iorq_n = 0; rd_n = 0;         // T2
        @(posedge zclk);                                  // TW
        @(negedge zclk); d = vd;                          // T3 sestupná: vzorkování
        #20 iorq_n = 1; rd_n = 1;
    end endtask
    task io_write(input [15:0] a, input [7:0] d); begin
        t1_addr(a);
        @(negedge zclk); #20 cpu_dout = d; cpu_drive = 1;
        @(posedge zclk); #20 iorq_n = 0; wr_n = 0;         // T2
        @(posedge zclk);                                  // TW
        @(negedge zclk); #20 iorq_n = 1; wr_n = 1;         // T3
        @(posedge zclk); #20 cpu_drive = 0;
    end endtask

    // ---- zachycení snímku
    integer fd, px, ln;
    reg [7:0] fr [0:448*312*3-1];
    task capture_frame; integer k; begin
        @(posedge clk); while (!(dut.hc == 0 && dut.vc == 0)) @(posedge clk);
        for (ln = 0; ln < 312; ln = ln + 1)
            for (px = 0; px < 448; px = px + 1) begin
                @(posedge clk); @(posedge clk);
                k = (ln * 448 + px) * 3;
                fr[k]   = R ? (I ? 8'd255 : 8'd205) : 8'd0;
                fr[k+1] = G ? (I ? 8'd255 : 8'd205) : 8'd0;
                fr[k+2] = B ? (I ? 8'd255 : 8'd205) : 8'd0;
            end
        fd = $fopen("frame.ppm", "wb");
        $fwrite(fd, "P6\n448 312\n255\n");
        for (k = 0; k < 448*312*3; k = k + 1) $fwrite(fd, "%c", fr[k]);
        $fclose(fd);
    end endtask

    // ---- měření časování
    integer t_vs1 = 0, t_vs2 = 0, t_hs1 = 0, t_hs2 = 0, t_int = 0, t_int_end = 0;
    always @(negedge VSYNC_n) begin t_vs1 = t_vs2; t_vs2 = $time; end
    always @(negedge INT_n) t_int = $time;
    always @(posedge INT_n) t_int_end = $time;

    reg [7:0] d;
    integer i, errors = 0, s0;
    initial begin
        $readmemh("screen.hex", mem);
        // 1) snímek
        repeat (2) @(negedge VSYNC_n);
        capture_frame;
        $display("perioda VSYNC = %0d ns (50,08 Hz = 19968000 ns)", t_vs2 - t_vs1);
        if (t_vs2 - t_vs1 < 19967000 || t_vs2 - t_vs1 > 19969000) errors = errors + 1;
        $display("délka /INT = %0d ns (32 T = 9143 ns)", t_int_end - t_int);
        if (t_int_end - t_int < 9000 || t_int_end - t_int > 9300) errors = errors + 1;

        // 2) zápis a čtení video RAM CPU během zobrazování (contention)
        @(posedge clk); while (!(dut.vc == 10 && dut.hc == 100)) @(posedge clk);
        s0 = stalled_clks;
        for (i = 0; i < 64; i = i + 1) mem_write(16'h4000 + i * 37, i ^ 8'h5A);
        for (i = 0; i < 64; i = i + 1) begin
            mem_read(16'h4000 + i * 37, d);
            if (d !== (i ^ 8'h5A)) begin errors = errors + 1; $display("CHYBA čtení %h: %h", 16'h4000 + i * 37, d); end
        end
        $display("během obrazu: 128 přístupů, pozdrženo %0d taktů 14 MHz", stalled_clks - s0);
        if (stalled_clks == s0) errors = errors + 1;

        // 3) totéž v borderu: bez pozdržení
        @(posedge clk); while (!(dut.vc == 200 && dut.hc == 0)) @(posedge clk);
        s0 = stalled_clks;
        for (i = 0; i < 32; i = i + 1) mem_write(16'h7F00 + i, ~i);
        for (i = 0; i < 32; i = i + 1) begin
            mem_read(16'h7F00 + i, d);
            if (d !== ~i[7:0]) begin errors = errors + 1; $display("CHYBA čtení border %h: %h", 16'h7F00 + i, d); end
        end
        $display("v borderu: 64 přístupů, pozdrženo %0d taktů (jen během obnovy DRAM v zatemnění)", stalled_clks - s0);

        // 4) port FE
        io_write(16'h00FE, 8'h12);                        // border 2 (červená), BEEP 1
        if (dut.border !== 3'd2 || BEEP !== 1'b1) begin errors = errors + 1; $display("CHYBA OUT FE"); end
        kb = 5'b10110; ear = 1;
        io_read(16'hFEFE, d);
        $display("IN FE = %h (čekáno F6)", d);
        if (d !== 8'hF6) errors = errors + 1;
        io_read(16'h00FF, d);                             // lichý port: ULA neodpovídá
        if (d !== 8'hFF) begin errors = errors + 1; $display("CHYBA lichý port %h", d); end

        // 5) ROMCS
        addr = 16'h1234; mreq_n = 0; #1 if (ROMCS_n !== 0) errors = errors + 1;
        addr = 16'h4234; #1 if (ROMCS_n !== 1) errors = errors + 1;
        mreq_n = 1;

        // 6) obnova DRAM: všech 128 řádků do 2 ms v nejhorší části snímku (border)
        $display("narušení časování DRAM: %0d", violations);
        errors = errors + violations;
        if (errors) $display("VÝSLEDEK: %0d CHYB", errors); else $display("VÝSLEDEK: OK");
        $finish;
    end

    // kontrola obnovy: čas od posledního RAS pro každý řádek
    real last_ras [0:127];
    integer k2, refr_err = 0;
    initial for (k2 = 0; k2 < 128; k2 = k2 + 1) last_ras[k2] = 0;
    always @(negedge RAS_n) begin
        last_ras[va] = $time;
    end
    always @(negedge VSYNC_n) if ($time > 30000000)
        for (k2 = 0; k2 < 128; k2 = k2 + 1)
            if ($time - last_ras[k2] > 2000000) begin
                $display("CHYBA: řádek %0d bez obnovy %0d ns", k2, $time - last_ras[k2]);
                errors = errors + 1;
            end
endmodule
