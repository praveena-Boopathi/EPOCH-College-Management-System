package com.epoch.epoch_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests verification that Firebase credentials can be parsed directly
 * from a JSON string payload (as supplied by the FIREBASE_SERVICE_ACCOUNT_JSON env variable).
 */
class FirebaseConfigCredentialsTest {

    private String generateValidTestPemKey() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        String b64 = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
        return "-----BEGIN PRIVATE KEY-----\\n" + b64 + "\\n-----END PRIVATE KEY-----\\n";
    }

    @Test
    void credentialsJsonStreamCanBeParsedAsGoogleCredentials() throws Exception {
        String pem = generateValidTestPemKey();

        // Construct synthetic service account JSON conforming to Google format
        String mockServiceAccountJson = "{\n" +
                "  \"type\": \"service_account\",\n" +
                "  \"project_id\": \"epoch-test-project\",\n" +
                "  \"private_key_id\": \"test-key-id-12345\",\n" +
                "  \"private_key\": \"" + pem + "\",\n" +
                "  \"client_email\": \"firebase-adminsdk-test@epoch-test-project.iam.gserviceaccount.com\",\n" +
                "  \"client_id\": \"123456789012345678901\",\n" +
                "  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
                "  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
                "  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
                "  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/test.iam.gserviceaccount.com\"\n" +
                "}";

        assertDoesNotThrow(() -> {
            try (InputStream is = new ByteArrayInputStream(mockServiceAccountJson.getBytes(StandardCharsets.UTF_8))) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(is);
                assertNotNull(credentials, "Credentials must not be null when initialized from valid JSON string");
                assertInstanceOf(ServiceAccountCredentials.class, credentials, "Credentials must be of type ServiceAccountCredentials");
                ServiceAccountCredentials sac = (ServiceAccountCredentials) credentials;
                assertEquals("firebase-adminsdk-test@epoch-test-project.iam.gserviceaccount.com", sac.getClientEmail());
                assertEquals("epoch-test-project", sac.getProjectId());
            }
        });
    }

    @Test
    void emptyOrNullCredentialsJsonThrowsException() {
        assertThrows(Exception.class, () -> {
            try (InputStream is = new ByteArrayInputStream("".getBytes(StandardCharsets.UTF_8))) {
                GoogleCredentials.fromStream(is);
            }
        });
    }
}
