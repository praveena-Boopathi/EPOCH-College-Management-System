package com.epoch.epoch_backend.security;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Provides JWT creation and validation utilities.
 *
 * Security guarantees:
 *  - The signing secret is read exclusively from the environment variable {@code EPOCH_JWT_SECRET}
 *    via {@code epoch.jwt.secret} and must be at least 64 bytes (512‑bit) for HS512.
 *  - Demo tokens (prefix {@code demo-jwt-token-}) are never accepted – they are rejected during
 *    validation and never reach {@link #getUserProfileFromToken(String)}.
 *  - Tokens with missing, blank, or unrecognised role claims are rejected by
 *    {@link #getUserProfileFromToken(String)}, which returns {@code null} so the filter
 *    refuses to authenticate the request.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${epoch.jwt.secret}") String secret,
            @Value("${epoch.jwt.expiration-ms}") long expirationMs) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret (epoch.jwt.secret) is not set. Set the EPOCH_JWT_SECRET environment variable.");
        }
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        // HS512 requires a 512‑bit (64‑byte) key for full security guarantees.
        if (secretBytes.length < 64) {
            throw new IllegalStateException(
                    "JWT secret length is insufficient for HS512. Must be at least 64 bytes (512 bits).");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserProfile profile) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(profile.getIdentifier())
                .claim("role", profile.getRole().name())
                .claim("section", profile.getSection())
                .claim("name", profile.getName())
                .claim("email", profile.getEmail())
                .claim("department", profile.getDepartment())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean validateToken(String token) {
        // Reject any demo token unconditionally.
        if (token != null && token.startsWith("demo-jwt-token-")) {
            return false;
        }
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    /**
     * Extracts and validates the {@link UserProfile} from a previously‑validated JWT.
     *
     * @return a fully populated profile, or {@code null} if the role claim is missing,
     *         blank, or does not match a known {@link UserRole}.
     */
    public UserProfile getUserProfileFromToken(String token) {
        Claims claims = getClaims(token);
        String roleStr = claims.get("role", String.class);

        // Reject tokens with missing or blank role claims
        if (roleStr == null || roleStr.isBlank()) {
            return null;
        }

        // Safely resolve the role – reject unknown values instead of throwing
        UserRole role;
        try {
            role = UserRole.valueOf(roleStr);
        } catch (IllegalArgumentException ex) {
            return null;
        }

        UserProfile profile = new UserProfile();
        profile.setIdentifier(claims.getSubject());
        profile.setName(claims.get("name", String.class));
        profile.setEmail(claims.get("email", String.class));
        profile.setSection(claims.get("section", String.class));
        profile.setDepartment(claims.get("department", String.class));
        profile.setRole(role);
        return profile;
    }
}
