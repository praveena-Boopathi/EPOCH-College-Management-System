package com.epoch.epoch_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests verification that Firebase credentials can be parsed directly
 * from a JSON string, Base64 string, or credentials file path.
 */
class FirebaseConfigCredentialsTest {

    private String generateValidTestPemKey() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        String b64 = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
        return "-----BEGIN PRIVATE KEY-----\\n" + b64 + "\\n-----END PRIVATE KEY-----\\n";
    }

    private String createMockServiceAccountJson() throws Exception {
        String pem = generateValidTestPemKey();
        return "{\n" +
                "  \"type\": \"service_account\",\n" +
                "  \"project_id\": \"epoch-a43c7\",\n" +
                "  \"private_key_id\": \"test-key-id-12345\",\n" +
                "  \"private_key\": \"" + pem + "\",\n" +
                "  \"client_email\": \"firebase-adminsdk-test@epoch-a43c7.iam.gserviceaccount.com\",\n" +
                "  \"client_id\": \"123456789012345678901\",\n" +
                "  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
                "  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
                "  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
                "  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/test.iam.gserviceaccount.com\"\n" +
                "}";
    }

    @Test
    void credentialsJsonStreamCanBeParsedAsGoogleCredentials() throws Exception {
        String mockServiceAccountJson = createMockServiceAccountJson();

        assertDoesNotThrow(() -> {
            try (InputStream is = new ByteArrayInputStream(mockServiceAccountJson.getBytes(StandardCharsets.UTF_8))) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(is);
                assertNotNull(credentials, "Credentials must not be null when initialized from valid JSON string");
                assertInstanceOf(ServiceAccountCredentials.class, credentials, "Credentials must be of type ServiceAccountCredentials");
                ServiceAccountCredentials sac = (ServiceAccountCredentials) credentials;
                assertEquals("firebase-adminsdk-test@epoch-a43c7.iam.gserviceaccount.com", sac.getClientEmail());
                assertEquals("epoch-a43c7", sac.getProjectId());
            }
        });
    }

    @Test
    void resolveCredentialsFromRawJsonString() throws Exception {
        String json = createMockServiceAccountJson();
        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsJson(json);

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertInstanceOf(ServiceAccountCredentials.class, credentials);
        ServiceAccountCredentials sac = (ServiceAccountCredentials) credentials;
        assertEquals("epoch-a43c7", sac.getProjectId());
        assertEquals("firebase-adminsdk-test@epoch-a43c7.iam.gserviceaccount.com", sac.getClientEmail());
    }

    @Test
    void resolveCredentialsFromBase64StringInCredentialsJson() throws Exception {
        String json = createMockServiceAccountJson();
        String b64 = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));

        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsJson(b64);

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertInstanceOf(ServiceAccountCredentials.class, credentials);
        ServiceAccountCredentials sac = (ServiceAccountCredentials) credentials;
        assertEquals("epoch-a43c7", sac.getProjectId());
    }

    @Test
    void resolveCredentialsFromCredentialsBase64Property() throws Exception {
        String json = createMockServiceAccountJson();
        String b64 = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));

        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsBase64(b64);

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertInstanceOf(ServiceAccountCredentials.class, credentials);
        assertEquals("epoch-a43c7", ((ServiceAccountCredentials) credentials).getProjectId());
    }

    @Test
    void resolveCredentialsFromCredentialsBase64WithNewlinesAndWhitespace() throws Exception {
        String json = createMockServiceAccountJson();
        String b64 = Base64.getMimeEncoder(64, new byte[]{'\r', '\n'}).encodeToString(json.getBytes(StandardCharsets.UTF_8));

        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsBase64("\n  " + b64 + "  \n");

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertInstanceOf(ServiceAccountCredentials.class, credentials);
        assertEquals("epoch-a43c7", ((ServiceAccountCredentials) credentials).getProjectId());
    }

    @Test
    void resolveCredentialsWithAccidentalOuterQuotes() throws Exception {
        String json = createMockServiceAccountJson();
        String quotedJson = "'" + json + "'";

        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsJson(quotedJson);

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertEquals("epoch-a43c7", ((ServiceAccountCredentials) credentials).getProjectId());
    }

    @Test
    void resolveCredentialsFromFilePath() throws Exception {
        String json = createMockServiceAccountJson();
        File tempFile = File.createTempFile("firebase-test-creds", ".json");
        tempFile.deleteOnExit();
        Files.writeString(tempFile.toPath(), json);

        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsPath(tempFile.getAbsolutePath());

        GoogleCredentials credentials = config.resolveCredentials();
        assertNotNull(credentials);
        assertEquals("epoch-a43c7", ((ServiceAccountCredentials) credentials).getProjectId());
    }

    @Test
    void nonExistentCredentialsPathThrowsHelpfulException() {
        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsPath("/non/existent/path/to/creds.json");

        IllegalStateException ex = assertThrows(IllegalStateException.class, config::resolveCredentials);
        assertTrue(ex.getMessage().contains("Configured Firebase credentials file does not exist"),
                "Exception message should clearly indicate missing credentials file");
    }

    @Test
    void malformedJsonCredentialsThrowsHelpfulException() {
        FirebaseConfig config = new FirebaseConfig();
        config.setProjectId("epoch-a43c7");
        config.setCredentialsJson("{ this is not valid json }");

        IllegalStateException ex = assertThrows(IllegalStateException.class, config::resolveCredentials);
        assertTrue(ex.getMessage().contains("Failed to parse Firebase credentials"),
                "Exception message should mention failed credentials parsing");
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
