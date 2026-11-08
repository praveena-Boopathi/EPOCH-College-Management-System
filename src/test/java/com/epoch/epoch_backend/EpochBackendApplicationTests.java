package com.epoch.epoch_backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
@SpringBootTest
class EpochBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verify Spring context starts with test profile.
        assertTrue(true);
    }
}
