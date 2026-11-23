# ==============================================================================
# Multi-Stage Dockerfile for Spring Boot 3 & Eclipse Temurin Java 21 (Repo Root)
# Optimized for Cloud Deployment on Render
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Java Spring Boot Application
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace

# Copy Maven wrapper and pom.xml from backend
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./

# Normalize line endings and grant execution permission to Maven wrapper
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy backend source files
COPY backend/src ./src

# Build production executable JAR without running tests
RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal Java Runtime Environment for Production
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Run as dedicated unprivileged user for container security
RUN groupadd -r spring && useradd -r -g spring spring

# Copy packaged JAR from builder stage
COPY --from=builder /workspace/target/app.jar app.jar

# Set ownership
RUN chown -R spring:spring /app

USER spring:spring

# Render dynamically injects $PORT (defaults to 10000 on Render, fallback 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Memory-conscious JVM container ergonomics:
# -XX:+UseContainerSupport: Detects container cgroups and memory limits
# -XX:MaxRAMPercentage=75.0: Allocates up to 75% of container RAM to heap
# -XX:+ExitOnOutOfMemoryError: Fails fast so orchestrator restarts cleanly
# -Dserver.port=${PORT}: Guarantees binding to Render's dynamic port
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+ExitOnOutOfMemoryError", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dserver.port=${PORT}", \
    "-jar", "app.jar"]
