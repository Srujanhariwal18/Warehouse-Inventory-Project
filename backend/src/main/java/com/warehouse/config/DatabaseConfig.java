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

    @Bean
    @Primary
    public DataSource dataSource(
        Environment env,
        @Value("${spring.datasource.url:}") String defaultUrl,
        @Value("${spring.datasource.username:}") String defaultUser,
        @Value("${spring.datasource.password:}") String defaultPass
    ) {
        // Priority: SUPABASE_DB_URL -> DATABASE_URL -> spring.datasource.url
        String rawUrl = env.getProperty("SUPABASE_DB_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = defaultUrl;
        }

        String username = env.getProperty("DB_USERNAME");
        if (username == null || username.isBlank()) {
            username = defaultUser;
        }

        String password = env.getProperty("DB_PASSWORD");
        if (password == null || password.isBlank()) {
            password = defaultPass;
        }

        ConnectionDetails details = normalizeConnection(rawUrl, username, password);

        log.info("Configuring PostgreSQL DataSource with URL: {}", sanitize(details.jdbcUrl()));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(details.jdbcUrl());
        config.setDriverClassName("org.postgresql.Driver");

        if (details.username() != null && !details.username().isBlank()) {
            config.setUsername(details.username());
        }
        if (details.password() != null && !details.password().isBlank()) {
            config.setPassword(details.password());
        }

        // Connection pool sizing and timeouts optimized for container & cloud DB limits
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }

    public record ConnectionDetails(String jdbcUrl, String username, String password) {}

    public static ConnectionDetails normalizeConnection(String rawUrl, String defaultUser, String defaultPass) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return new ConnectionDetails(
                "jdbc:postgresql://db.hjgvwjnpadotodldperj.supabase.co:5432/postgres",
                defaultUser,
                defaultPass
            );
        }

        String url = rawUrl.trim();
        String user = defaultUser;
        String pass = defaultPass;

        // If URL has jdbc: prefix, strip it temporarily for URI parsing if needed
        String toParse = url;
        if (toParse.startsWith("jdbc:")) {
            toParse = toParse.substring(5);
        }

        // Handle postgres:// or postgresql:// schemes (common from Supabase / Render)
        if (toParse.startsWith("postgres://") || toParse.startsWith("postgresql://")) {
            try {
                // Normalize scheme to http for java.net.URI parser to reliably parse host, port, userinfo, path
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

                return new ConnectionDetails(sb.toString(), user, pass);
            } catch (Exception ignored) {
                // Fallback direct prefix replacement
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

        return new ConnectionDetails(url, user, pass);
    }

    private static String sanitize(String jdbcUrl) {
        if (jdbcUrl == null) return "";
        return jdbcUrl.replaceAll(":[^:@]+@", ":****@");
    }
}
