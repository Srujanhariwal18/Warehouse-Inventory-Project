package com.warehouse.web;

import com.warehouse.domain.*;
import com.warehouse.repo.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/webhooks/clerk")
@SuppressWarnings({"null", "unchecked"})
public class ClerkWebhookController {

    final UserRepository users;
    final ObjectMapper json;

    @Value("${app.clerk-webhook-secret:}")
    String secret;

    public ClerkWebhookController(UserRepository u, ObjectMapper j) {
        this.users = u;
        this.json = j;
    }

    @PostMapping
    public ResponseEntity<?> sync(
        @RequestHeader(value = "svix-id", required = false) String id,
        @RequestHeader(value = "svix-timestamp", required = false) String timestamp,
        @RequestHeader(value = "svix-signature", required = false) String sig,
        @RequestBody String raw
    ) throws Exception {
        if (secret.isBlank() || id == null || timestamp == null || sig == null || !valid(id, timestamp, raw, sig)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Svix signature"));
        }

        var body = json.readValue(raw, Map.class);
        var data = (Map<String, Object>) body.getOrDefault("data", Map.of());
        String clerkId = String.valueOf(data.get("id"));

        if (!clerkId.equals("null")) {
            User u = users.findByClerkId(clerkId).orElseGet(User::new);
            u.clerkId = clerkId;
            u.email = String.valueOf(data.getOrDefault("primary_email_address_id", "unknown@invalid"));
            var metadata = (Map<String, Object>) data.getOrDefault("public_metadata", Map.of());
            u.role = "ADMIN".equals(metadata.get("role")) ? Role.ADMIN : Role.STAFF;
            users.save(u);
        }

        return ResponseEntity.ok(Map.of("received", true));
    }

    private boolean valid(String id, String time, String body, String signature) throws Exception {
        byte[] key = Base64.getDecoder().decode(secret.replaceFirst("^whsec_", ""));
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        byte[] wanted = mac.doFinal((id + "." + time + "." + body).getBytes(StandardCharsets.UTF_8));
        for (String part : signature.split(" ")) {
            String[] bits = part.split(",", 2);
            if (bits.length == 2 && bits[0].equals("v1") && MessageDigest.isEqual(wanted, Base64.getDecoder().decode(bits[1]))) {
                return true;
            }
        }
        return false;
    }
}
