package com.warehouse.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
@SuppressWarnings("null")
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    public static final String VERIFIED_POOLER_HOST = "aws-0-ap-southeast-2.pooler.supabase.com";
    public static final String PROJECT_REF = "hjgvwjnpadotodldperj";
    public static final String DEFAULT_JDBC_URL = "jdbc:postgresql://" + VERIFIED_POOLER_HOST + ":5432/postgres?sslmode=require";
    public static final String DEFAULT_USER = "postgres." + PROJECT_REF;
    public static final String DEFAULT_PASS = "Qe_jXce4-H%Af2!";

    @Bean
    @Primary
    public DataSource dataSource(
        Environment env,
        @Value("${spring.datasource.url:}") String defaultUrl,
        @Value("${spring.datasource.username:}") String defaultUser,
        @Value("${spring.datasource.password:}") String defaultPass
    ) {
        // Priority: SUPABASE_DB_URL -> DATABASE_URL -> spring.datasource.url -> DEFAULT_JDBC_URL
        String rawUrl = env.getProperty("SUPABASE_DB_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = (defaultUrl != null && !defaultUrl.isBlank()) ? defaultUrl : DEFAULT_JDBC_URL;
        }

        String username = env.getProperty("DB_USERNAME");
        if (username == null || username.isBlank()) {
            username = (defaultUser != null && !defaultUser.isBlank()) ? defaultUser : DEFAULT_USER;
        }

        String password = env.getProperty("DB_PASSWORD");
        if (password == null || password.isBlank()) {
            password = (defaultPass != null && !defaultPass.isBlank()) ? defaultPass : DEFAULT_PASS;
        }

        ConnectionDetails details = normalizeConnection(rawUrl, username, password);

        log.info("Configuring PostgreSQL DataSource with URL: {} (user: {})", sanitize(details.jdbcUrl()), details.username());

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(details.jdbcUrl());
        config.setDriverClassName("org.postgresql.Driver");

        if (details.username() != null && !details.username().isBlank()) {
            config.setUsername(details.username());
        }
        if (details.password() != null && !details.password().isBlank()) {
            config.setPassword(details.password());
        }

        // Connection pool sizing and timeouts optimized for Render free tier (512MB RAM) & Supabase pool
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }

    public record ConnectionDetails(String jdbcUrl, String username, String password) {}

    public static ConnectionDetails normalizeConnection(String rawUrl, String defaultUser, String defaultPass) {
        String url = (rawUrl != null && !rawUrl.isBlank()) ? rawUrl.trim() : DEFAULT_JDBC_URL;
        String user = (defaultUser != null && !defaultUser.isBlank()) ? defaultUser.trim() : DEFAULT_USER;
        String pass = (defaultPass != null && !defaultPass.isBlank()) ? defaultPass : DEFAULT_PASS;

        // If URL has jdbc: prefix, strip it temporarily for URI parsing if needed
        String toParse = url;
        if (toParse.startsWith("jdbc:")) {
            toParse = toParse.substring(5);
        }

        // Handle postgres:// or postgresql:// schemes (common from Supabase / Render)
        if (toParse.startsWith("postgres://") || toParse.startsWith("postgresql://")) {
            try {
                String uriString = toParse.startsWith("postgres://")
                    ? "http" + toParse.substring(8)
                    : "http" + toParse.substring(10);

                URI uri = new URI(uriString);

                if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    user = URLDecoder.decode(userInfo[0], StandardCharsets.UTF_8);
                    if (userInfo.length > 1) {
                        pass = URLDecoder.decode(userInfo[1], StandardCharsets.UTF_8);
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String query = uri.getQuery();

                StringBuilder sb = new StringBuilder("jdbc:postgresql://");
                sb.append(host);
                if (port != -1) {
                    sb.append(":").append(port);
                }
                if (path != null && !path.isBlank()) {
                    sb.append(path);
                } else {
                    sb.append("/postgres");
                }
                if (query != null && !query.isBlank()) {
                    sb.append("?").append(query);
                }

                url = sb.toString();
            } catch (Exception ignored) {
                if (url.startsWith("postgres://")) {
                    url = "jdbc:postgresql://" + url.substring(11);
                } else if (url.startsWith("postgresql://")) {
                    url = "jdbc:postgresql://" + url.substring(13);
                } else if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:postgresql://" + url;
        }

        // Auto-fix Render IPv4 compatibility:
        // Direct host "db.hjgvwjnpadotodldperj.supabase.co" is IPv6 only; replace with IPv4 pooler
        if (url.contains("db." + PROJECT_REF + ".supabase.co")) {
            url = url.replace("db." + PROJECT_REF + ".supabase.co", VERIFIED_POOLER_HOST);
            if (!url.contains("sslmode=")) {
                url += (url.contains("?") ? "&" : "?") + "sslmode=require";
            }
        }

        // Auto-fix region mismatch if user configured ap-south-1 instead of ap-southeast-2
        if (url.contains("ap-south-1.pooler.supabase.com")) {
            url = url.replace("ap-south-1.pooler.supabase.com", "ap-southeast-2.pooler.supabase.com");
        }

        // Ensure pooler username contains tenant ref
        if (url.contains("pooler.supabase.com")) {
            if ("postgres".equalsIgnoreCase(user)) {
                user = "postgres." + PROJECT_REF;
            }
            if (!url.contains("sslmode=")) {
                url += (url.contains("?") ? "&" : "?") + "sslmode=require";
            }
        }

        return new ConnectionDetails(url, user, pass);
    }

    private static String sanitize(String jdbcUrl) {
        if (jdbcUrl == null) return "";
        return jdbcUrl.replaceAll(":[^:@]+@", ":****@");
    }
}
