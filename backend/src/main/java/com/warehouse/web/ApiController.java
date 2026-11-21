package com.warehouse.web;

import com.warehouse.domain.*;
import com.warehouse.repo.*;
import com.warehouse.service.*;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    final ItemRepository items;
    final TransactionRepository txs;
    final AlertRepository alerts;
    final UserRepository users;
    final StockService stock;

    public ApiController(
        ItemRepository i,
        TransactionRepository t,
        AlertRepository a,
        UserRepository u,
        StockService s
    ) {
        items = i;
        txs = t;
        alerts = a;
        users = u;
        stock = s;
    }

    public record ItemInput(
        @NotBlank String name,
        @NotBlank String sku,
        String barcode,
        String category,
        String unit,
        @Min(0) int quantity,
        @Min(0) int lowStockThreshold
    ) {}

    public record TxInput(
        UUID itemId,
        @NotNull TransactionType type,
        @Min(1) int quantity,
        String note
    ) {}

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "warehouse-api",
            "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return Map.of("authenticated", false);
        }

        String clerkId = jwt.getSubject();
        String rawEmail = jwt.getClaimAsString("email");
        if (rawEmail == null) rawEmail = jwt.getClaimAsString("preferred_username");
        final String email = (rawEmail != null) ? rawEmail : clerkId + "@clerk.account";

        String rawName = jwt.getClaimAsString("name");
        final String displayName = (rawName != null) ? rawName : "Warehouse Operator";

        User user = users.findByClerkId(clerkId).orElseGet(() -> {
            User newUser = new User();
            newUser.clerkId = clerkId;
            newUser.email = email;
            newUser.displayName = displayName;
            newUser.role = Role.ADMIN;
            return users.save(newUser);
        });

        return Map.of(
            "id", user.id,
            "clerkId", user.clerkId,
            "email", user.email,
            "displayName", user.displayName != null ? user.displayName : displayName,
            "role", user.role.name()
        );
    }

    @GetMapping("/items")
    public List<Item> items() {
        return items.findAll();
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public Item create(@RequestBody @jakarta.validation.Valid ItemInput x) {
        Item i = new Item();
        i.name = x.name.trim();
        i.sku = x.sku.trim().toUpperCase();
        i.barcode = (x.barcode != null && !x.barcode.isBlank()) ? x.barcode.trim() : null;
        i.category = (x.category != null && !x.category.isBlank()) ? x.category.trim() : "General";
        i.unit = (x.unit != null && !x.unit.isBlank()) ? x.unit.trim() : "each";
        i.quantity = x.quantity;
        i.lowStockThreshold = x.lowStockThreshold;
        return items.save(i);
    }

    @GetMapping("/items/barcode/{barcode}")
    public Item barcode(@PathVariable String barcode) {
        return items.findByBarcode(barcode).orElseThrow();
    }

    @GetMapping("/transactions")
    public List<StockTransaction> transactions() {
        return txs.findAll();
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public StockTransaction transaction(
        @RequestBody @jakarta.validation.Valid TxInput x,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = null;
        if (jwt != null) {
            String clerkId = jwt.getSubject();
            userId = users.findByClerkId(clerkId).map(u -> u.id).orElse(null);
        }
        return stock.record(x.itemId, x.type, x.quantity, x.note, userId);
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public List<Alert> alerts() {
        return alerts.findByStatusNot(AlertStatus.RESOLVED);
    }

    @PatchMapping("/alerts/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public Alert acknowledge(@PathVariable UUID id) {
        Alert a = alerts.findById(id).orElseThrow();
        a.status = AlertStatus.ACKNOWLEDGED;
        return alerts.save(a);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        var all = items.findAll();
        return Map.of(
            "totalItems", all.size(),
            "lowStock", all.stream().filter(i -> i.quantity <= i.lowStockThreshold).count(),
            "outOfStock", all.stream().filter(i -> i.quantity == 0).count(),
            "transactions", txs.findAll().size()
        );
    }
}
