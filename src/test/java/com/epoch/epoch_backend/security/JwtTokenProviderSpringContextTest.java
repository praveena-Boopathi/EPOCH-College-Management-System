package com.epoch.epoch_backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.context.support.TestPropertySourceUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verify that a Spring ApplicationContext cannot be refreshed when the JWT secret
 * is missing or blank.  Uses a programmatic context (no {@code @SpringBootTest})
 * so Firebase is never contacted and no full boot-up occurs.
 */
class JwtTokenProviderSpringContextTest {

    @Test
    void failsToCreateContextWhenJwtSecretBlank() {
        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext();
        // Provide all required properties except a valid JWT secret
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(ctx,
                "epoch.jwt.secret=",               // blank — must be rejected
                "epoch.jwt.expiration-ms=86400000");
        ctx.register(JwtTokenProvider.class);

        // Spring wraps the constructor IllegalStateException in a BeanCreationException
        BeanCreationException ex = assertThrows(BeanCreationException.class, ctx::refresh);

        // Walk the cause chain to confirm the root is our guard
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        assertInstanceOf(IllegalStateException.class, root);
        assertTrue(root.getMessage().contains("JWT secret"),
                "Root cause message should mention the missing JWT secret");
        ctx.close();
    }
}
