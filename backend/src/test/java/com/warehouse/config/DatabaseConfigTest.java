package com.warehouse.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseConfigTest {

    @Test
    void autoCorrectsApSouth1ToApSouthEast2() {
        String raw = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
        var details = DatabaseConfig.normalizeConnection(raw, "postgres.hjgvwjnpadotodldperj", "pass");

        assertEquals("jdbc:postgresql://aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require", details.jdbcUrl());
        assertEquals("postgres.hjgvwjnpadotodldperj", details.username());
    }

    @Test
    void autoCorrectsDirectIpv6HostToIpv4Pooler() {
        String raw = "jdbc:postgresql://db.hjgvwjnpadotodldperj.supabase.co:5432/postgres";
        var details = DatabaseConfig.normalizeConnection(raw, "postgres", "pass");

        assertEquals("jdbc:postgresql://aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require", details.jdbcUrl());
        assertEquals("postgres.hjgvwjnpadotodldperj", details.username());
    }

    @Test
    void autoCorrectsPostgreSqlSchemeWithCredentials() {
        String raw = "postgresql://postgres:secret@db.hjgvwjnpadotodldperj.supabase.co:5432/postgres";
        var details = DatabaseConfig.normalizeConnection(raw, "postgres", "pass");

        assertEquals("jdbc:postgresql://aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require", details.jdbcUrl());
        assertEquals("postgres.hjgvwjnpadotodldperj", details.username());
        assertEquals("secret", details.password());
    }

    @Test
    void autoAppendsTenantToPoolerUsername() {
        String raw = "jdbc:postgresql://aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
        var details = DatabaseConfig.normalizeConnection(raw, "postgres", "pass");

        assertTrue(details.jdbcUrl().contains("sslmode=require"));
        assertEquals("postgres.hjgvwjnpadotodldperj", details.username());
    }

    @Test
    void handlesNullAndBlankDefaultsWithVerifiedSydneyPooler() {
        var details = DatabaseConfig.normalizeConnection(null, null, null);
        assertEquals(DatabaseConfig.DEFAULT_JDBC_URL, details.jdbcUrl());
        assertEquals(DatabaseConfig.DEFAULT_USER, details.username());
        assertEquals(DatabaseConfig.DEFAULT_PASS, details.password());
    }
}
