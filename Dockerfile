# ==============================================================================
# EPOCH Backend - Multi-stage Production Dockerfile for Google Cloud Run
# Base: Eclipse Temurin OpenJDK 25
# ==============================================================================

# Stage 1: Build the Spring Boot application JAR
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy gradle wrapper and dependency descriptors to leverage layer caching
COPY gradlew ./
COPY gradle gradle
COPY build.gradle settings.gradle gradle.properties ./

RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon || true

# Copy source code (credentials excluded via .dockerignore)
COPY src src

# Build bootJar without running unit tests (pre-verified in CI)
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Minimal runtime image
FROM eclipse-temurin:25-jre
WORKDIR /app

# Run as non-privileged service user
RUN groupadd -r epoch && useradd -r -g epoch epoch
USER epoch:epoch

# Copy compiled executable JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Google Cloud Run standard contract: listen on PORT (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Production JVM flags optimized for containerized Cloud Run workloads:
# - Serial GC minimizes memory footprint in serverless instances
# - MaxRAMPercentage dynamically bounds heap to 75% of container memory limit
# - Non-blocking entropy source prevents startup delay
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
