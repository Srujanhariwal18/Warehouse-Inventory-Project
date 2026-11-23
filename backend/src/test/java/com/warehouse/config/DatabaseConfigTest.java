package com.warehouse.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseConfigTest {

    @Test
    void normalizesPostgresqlSchemeWithCredentials() {
        String raw = "postgresql://myuser:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
        var details = DatabaseConfig.normalizeConnection(raw, "fallbackUser", "fallbackPass");

        assertEquals("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require", details.jdbcUrl());
        assertEquals("myuser", details.username());
        assertEquals("mypassword", details.password());
    }

    @Test
    void normalizesPostgresSchemeWithoutCredentials() {
        String raw = "postgres://aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
        var details = DatabaseConfig.normalizeConnection(raw, "defaultUser", "defaultPass");

        assertEquals("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres", details.jdbcUrl());
        assertEquals("defaultUser", details.username());
        assertEquals("defaultPass", details.password());
    }

    @Test
    void preservesStandardJdbcUrl() {
        String raw = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
        var details = DatabaseConfig.normalizeConnection(raw, "user", "pass");

        assertEquals("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require", details.jdbcUrl());
        assertEquals("user", details.username());
        assertEquals("pass", details.password());
    }

    @Test
    void extractsCredentialsFromJdbcUrlWithUserInfo() {
        String raw = "jdbc:postgresql://postgres.proj:secret123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
        var details = DatabaseConfig.normalizeConnection(raw, "fallbackUser", "fallbackPass");

        assertEquals("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres", details.jdbcUrl());
        assertEquals("postgres.proj", details.username());
        assertEquals("secret123", details.password());
    }

    @Test
    void handlesNullAndBlankDefaults() {
        var details = DatabaseConfig.normalizeConnection(null, "user", "pass");
        assertTrue(details.jdbcUrl().startsWith("jdbc:postgresql://"));
        assertEquals("user", details.username());
        assertEquals("pass", details.password());
    }
}
