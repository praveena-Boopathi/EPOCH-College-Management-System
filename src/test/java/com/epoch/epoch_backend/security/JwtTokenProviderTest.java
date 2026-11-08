package com.epoch.epoch_backend.security;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link JwtTokenProvider}.
 *
 * <p>Uses only synthetic test identities – no real student, staff, HOD, or Principal
 * credentials.  No secrets are logged or exposed in test reports.
 */
class JwtTokenProviderTest {

    private static final String TEST_SECRET =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCD"; // 64 chars → 512-bit
    private JwtTokenProvider jwtTokenProvider;
    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, 3600000L);
        testProfile = new UserProfile();
        testProfile.setIdentifier("testuser001");
        testProfile.setName("Test User");
        testProfile.setEmail("testuser@example.com");
        testProfile.setSection("A");
        testProfile.setDepartment("Computer Science");
        testProfile.setRole(UserRole.STUDENT);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private SecretKey testKey() {
        return Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    /** Build a signed JWT with the given claims using the configured test key. */
    private String buildToken(String subject, String role, long expirationOffsetMs) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(subject)
                .claim("name", testProfile.getName())
                .claim("email", testProfile.getEmail())
                .claim("section", testProfile.getSection())
                .claim("department", testProfile.getDepartment())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationOffsetMs))
                .signWith(testKey(), SignatureAlgorithm.HS512);
        if (role != null) {
            builder.claim("role", role);
        }
        return builder.compact();
    }

    // ── valid token ─────────────────────────────────────────────────────────

    @Test
    void validTokenIsAccepted() {
        String token = jwtTokenProvider.generateToken(testProfile);

        assertTrue(jwtTokenProvider.validateToken(token), "Generated token should be valid");

        UserProfile parsed = jwtTokenProvider.getUserProfileFromToken(token);
        assertNotNull(parsed, "Parsed profile must not be null for a valid token");
        assertEquals(testProfile.getIdentifier(), parsed.getIdentifier());
        assertEquals(testProfile.getRole(), parsed.getRole());
        assertEquals(testProfile.getEmail(), parsed.getEmail());
        assertEquals(testProfile.getName(), parsed.getName());
        assertEquals(testProfile.getSection(), parsed.getSection());
        assertEquals(testProfile.getDepartment(), parsed.getDepartment());
    }

    // ── invalid signature ───────────────────────────────────────────────────

    @Test
    void invalidSignatureIsRejected() {
        String otherSecret =
                "ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba9876543210!@#$"; // different 512-bit key
        SecretKey otherKey = Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8));

        String tokenWithOtherKey = Jwts.builder()
                .subject(testProfile.getIdentifier())
                .claim("role", testProfile.getRole().name())
                .claim("section", testProfile.getSection())
                .claim("name", testProfile.getName())
                .claim("email", testProfile.getEmail())
                .claim("department", testProfile.getDepartment())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000L))
                .signWith(otherKey, SignatureAlgorithm.HS512)
                .compact();

        assertFalse(jwtTokenProvider.validateToken(tokenWithOtherKey),
                "Token signed with a different key must be rejected");
    }

    // ── expired token ───────────────────────────────────────────────────────

    @Test
    void expiredTokenIsRejected() {
        String expired = buildToken(testProfile.getIdentifier(), "STUDENT", -3600_000L);
        assertFalse(jwtTokenProvider.validateToken(expired), "Expired token must be rejected");
    }

    // ── malformed token ─────────────────────────────────────────────────────

    @Test
    void malformedTokenIsRejected() {
        assertFalse(jwtTokenProvider.validateToken("not.a.jwt"), "Malformed token must be rejected");
        assertFalse(jwtTokenProvider.validateToken(""), "Empty string must be rejected");
        assertFalse(jwtTokenProvider.validateToken(null), "Null must be rejected");
    }

    // ── demo-prefixed token ─────────────────────────────────────────────────

    @Test
    void demoPrefixedTokenIsRejected() {
        assertFalse(jwtTokenProvider.validateToken("demo-jwt-token-student123"),
                "Demo-prefixed token must never be accepted");
    }

    // ── missing role claim ──────────────────────────────────────────────────

    @Test
    void missingRoleClaimReturnsNull() {
        // Token is cryptographically valid but has no "role" claim
        String token = buildToken(testProfile.getIdentifier(), null, 3600_000L);

        assertTrue(jwtTokenProvider.validateToken(token),
                "Token with missing role should still pass signature validation");
        assertNull(jwtTokenProvider.getUserProfileFromToken(token),
                "getUserProfileFromToken must return null when role claim is absent");
    }

    // ── blank role claim ────────────────────────────────────────────────────

    @Test
    void blankRoleClaimReturnsNull() {
        String token = buildToken(testProfile.getIdentifier(), "  ", 3600_000L);

        assertTrue(jwtTokenProvider.validateToken(token),
                "Token with blank role should still pass signature validation");
        assertNull(jwtTokenProvider.getUserProfileFromToken(token),
                "getUserProfileFromToken must return null when role claim is blank");
    }

    // ── unknown role claim ──────────────────────────────────────────────────

    @Test
    void unknownRoleClaimReturnsNull() {
        String token = buildToken(testProfile.getIdentifier(), "SUPERADMIN", 3600_000L);

        assertTrue(jwtTokenProvider.validateToken(token),
                "Token with unknown role should still pass signature validation");
        assertNull(jwtTokenProvider.getUserProfileFromToken(token),
                "getUserProfileFromToken must return null for an unrecognised role");
    }

    // ── constructor guard: empty secret ─────────────────────────────────────

    @Test
    void missingSecretThrowsException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> new JwtTokenProvider("", 3600000L));
        assertTrue(ex.getMessage().contains("JWT secret"));
    }
}
