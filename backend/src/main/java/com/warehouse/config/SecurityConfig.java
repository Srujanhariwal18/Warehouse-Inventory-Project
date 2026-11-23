package com.warehouse.config;

import com.warehouse.repo.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    SecurityFilterChain security(HttpSecurity h) throws Exception {
        h.csrf(c -> c.disable())
         .cors(c -> c.configurationSource(corsConfigurationSource()))
         .authorizeHttpRequests(a -> a
             .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
             .requestMatchers(
                 "/api/v1/health",
                 "/webhooks/**",
                 "/swagger-ui/**",
                 "/v3/api-docs/**",
                 "/swagger-ui.html"
             ).permitAll()
             .anyRequest().authenticated()
         )
         .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwt -> {
             String clerkId = jwt.getSubject();
             List<GrantedAuthority> authorities = new ArrayList<>();

             // Grant baseline permissions to all authenticated warehouse users
             authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
             authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));

             // Check if custom role specified in JWT claims or public metadata
             String roleClaim = jwt.getClaimAsString("role");
             if (roleClaim == null && jwt.getClaimAsMap("public_metadata") != null) {
                 roleClaim = String.valueOf(jwt.getClaimAsMap("public_metadata").get("role"));
             }
             if (roleClaim != null && !roleClaim.isBlank()) {
                 authorities.add(new SimpleGrantedAuthority("ROLE_" + roleClaim.toUpperCase()));
             }

             // Check DB if user is registered with specific role
             if (clerkId != null) {
                 userRepository.findByClerkId(clerkId).ifPresent(user -> {
                     authorities.add(new SimpleGrantedAuthority("ROLE_" + user.role.name()));
                 });
             }

             return new JwtAuthenticationToken(jwt, authorities);
         })));

        return h.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.clerk.accounts.dev",
            "https://*.onrender.com",
            "https://*.vercel.app",
            "https://*.netlify.app",
            "*"
        ));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        c.setAllowedHeaders(List.of("*"));
        c.setExposedHeaders(List.of("Authorization", "Content-Disposition", "Content-Type"));
        c.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}
