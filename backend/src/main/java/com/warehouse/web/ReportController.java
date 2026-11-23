package com.warehouse.web;

import com.warehouse.domain.*;
import com.warehouse.repo.*;
import com.opencsv.CSVWriter;
import com.lowagie.text.Document;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
@SuppressWarnings("null")
public class ReportController {

    final ItemRepository items;
    final TransactionRepository txs;

    public ReportController(ItemRepository i, TransactionRepository t) {
        items = i;
        txs = t;
    }

    @GetMapping(value = "/items.csv", produces = "text/csv")
    public ResponseEntity<byte[]> csv() throws IOException {
        var out = new StringWriter();
        try (var csv = new CSVWriter(out)) {
            csv.writeNext(new String[]{"ID", "Name", "SKU", "Barcode", "Category", "Quantity", "Unit", "Threshold"});
            for (Item i : items.findAll()) {
                csv.writeNext(new String[]{
                    String.valueOf(i.id),
                    i.name,
                    i.sku,
                    i.barcode != null ? i.barcode : "",
                    i.category != null ? i.category : "General",
                    String.valueOf(i.quantity),
                    i.unit != null ? i.unit : "each",
                    String.valueOf(i.lowStockThreshold)
                });
            }
        }
        return download(out.toString().getBytes(), "warehouse-items.csv", "text/csv");
    }

    @GetMapping(value = "/items.pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> pdf() throws Exception {
        var out = new ByteArrayOutputStream();
        var doc = new Document();
        PdfWriter.getInstance(doc, out);
        doc.open();
        doc.add(new Paragraph("Official Warehouse Inventory Manifest", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
        doc.add(new Paragraph("Generated at: " + java.time.Instant.now()));
        doc.add(new Paragraph(" "));
        for (Item i : items.findAll()) {
            doc.add(new Paragraph(i.sku + "  |  " + i.name + "  |  " + i.quantity + " " + (i.unit != null ? i.unit : "each") + "  |  Threshold: " + i.lowStockThreshold));
        }
        doc.close();
        return download(out.toByteArray(), "warehouse-manifest.pdf", "application/pdf");
    }

    private ResponseEntity<byte[]> download(byte[] b, String filename, String type) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(type))
            .body(b);
    }
}
