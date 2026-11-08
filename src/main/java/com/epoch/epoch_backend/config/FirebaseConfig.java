package com.epoch.epoch_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    private static final String DEFAULT_RENDER_SECRET_PATH_1 = "/etc/secrets/firebase-service-account.json";
    private static final String DEFAULT_RENDER_SECRET_PATH_2 = "/etc/secrets/service-account.json";

    @Value("${epoch.firebase.project-id:epoch-a43c7}")
    private String projectId;

    @Value("${epoch.firebase.credentials-json:}")
    private String credentialsJson;

    @Value("${epoch.firebase.credentials-base64:}")
    private String credentialsBase64;

    @Value("${epoch.firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        GoogleCredentials credentials = resolveCredentials();

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId(projectId)
                .build();

        FirebaseApp app = FirebaseApp.initializeApp(options);
        logger.info("FirebaseApp initialized successfully for project [{}]", projectId);
        return app;
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }

    public GoogleCredentials resolveCredentials() throws IOException {
        // Priority 1: Base64 string from FIREBASE_SERVICE_ACCOUNT_BASE64
        if (credentialsBase64 != null && !credentialsBase64.trim().isEmpty()) {
            byte[] jsonBytes = decodeBase64Safe(credentialsBase64.trim());
            try (InputStream is = new ByteArrayInputStream(jsonBytes)) {
                logger.info("Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable.");
                return GoogleCredentials.fromStream(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to parse Firebase credentials from FIREBASE_SERVICE_ACCOUNT_BASE64: " + e.getMessage(), e);
            }
        }

        // Priority 2: Direct JSON or Base64 string from FIREBASE_SERVICE_ACCOUNT_JSON
        if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
            byte[] jsonBytes = decodeIfBase64OrNormalize(credentialsJson.trim());
            try (InputStream is = new ByteArrayInputStream(jsonBytes)) {
                logger.info("Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
                return GoogleCredentials.fromStream(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to parse Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON: " + e.getMessage(), e);
            }
        }

        // Priority 3: Explicit file path from GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_CREDENTIALS_PATH
        if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
            File credsFile = new File(credentialsPath.trim());
            if (credsFile.exists() && credsFile.isFile()) {
                try (InputStream is = new FileInputStream(credsFile)) {
                    logger.info("Loading Firebase credentials from specified file path: {}", credsFile.getAbsolutePath());
                    return GoogleCredentials.fromStream(is);
                } catch (Exception e) {
                    throw new IllegalStateException("Failed to load Firebase credentials from file path [" + credentialsPath + "]: " + e.getMessage(), e);
                }
            } else {
                throw new IllegalStateException("Configured Firebase credentials file does not exist or is not a file: " + credentialsPath);
            }
        }

        // Priority 4: Render Secret Files mounted at /etc/secrets/
        File renderSecret1 = new File(DEFAULT_RENDER_SECRET_PATH_1);
        if (renderSecret1.exists() && renderSecret1.isFile()) {
            try (InputStream is = new FileInputStream(renderSecret1)) {
                logger.info("Loading Firebase credentials from Render secret file: {}", DEFAULT_RENDER_SECRET_PATH_1);
                return GoogleCredentials.fromStream(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load Firebase credentials from Render secret file [" + DEFAULT_RENDER_SECRET_PATH_1 + "]: " + e.getMessage(), e);
            }
        }

        File renderSecret2 = new File(DEFAULT_RENDER_SECRET_PATH_2);
        if (renderSecret2.exists() && renderSecret2.isFile()) {
            try (InputStream is = new FileInputStream(renderSecret2)) {
                logger.info("Loading Firebase credentials from Render secret file: {}", DEFAULT_RENDER_SECRET_PATH_2);
                return GoogleCredentials.fromStream(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load Firebase credentials from Render secret file [" + DEFAULT_RENDER_SECRET_PATH_2 + "]: " + e.getMessage(), e);
            }
        }

        // Priority 5: Classpath resource for local development (firebase-service-account.json)
        ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
        if (resource.exists()) {
            try (InputStream is = resource.getInputStream()) {
                logger.info("Loading Firebase credentials from classpath resource: firebase-service-account.json");
                return GoogleCredentials.fromStream(is);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load Firebase credentials from classpath resource: " + e.getMessage(), e);
            }
        }

        // Priority 6: Google Application Default Credentials (ADC) - e.g. for Google Cloud environments
        try {
            logger.info("Attempting to load Google Application Default Credentials (ADC)...");
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException adcException) {
            String errorMessage = "\n" +
                "================================================================================\n" +
                "EPOCH FIREBASE INITIALIZATION ERROR:\n" +
                "No valid Firebase service-account credentials could be found for project [" + projectId + "].\n" +
                "\n" +
                "To resolve this on Render, configure ONE of the following options in your Render Dashboard:\n" +
                "  Option 1 (Recommended): Set environment variable 'FIREBASE_SERVICE_ACCOUNT_BASE64'\n" +
                "             Value: Base64-encoded string of your service account JSON file.\n" +
                "             Generate with: base64 -w 0 firebase-service-account.json\n" +
                "  Option 2: Set environment variable 'FIREBASE_SERVICE_ACCOUNT_JSON'\n" +
                "             Value: Full JSON contents of your Firebase Admin service account key.\n" +
                "  Option 3: Create a Secret File in Render Dashboard (Environment -> Secret Files)\n" +
                "             Filename: firebase-service-account.json\n" +
                "             Mount path will automatically be: /etc/secrets/firebase-service-account.json\n" +
                "  Option 4: Set 'GOOGLE_APPLICATION_CREDENTIALS' to the path of your mounted credentials file.\n" +
                "\n" +
                "For local development:\n" +
                "  Place 'firebase-service-account.json' into 'src/main/resources/'.\n" +
                "================================================================================";
            logger.error(errorMessage);
            throw new IllegalStateException("Missing Firebase credentials for project [" + projectId + "]. Please configure FIREBASE_SERVICE_ACCOUNT_BASE64 or Render Secret File.", adcException);
        }
    }

    private byte[] decodeIfBase64OrNormalize(String input) {
        String trimmed = input.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        if (trimmed.startsWith("{")) {
            return trimmed.getBytes(StandardCharsets.UTF_8);
        }
        try {
            String sanitized = trimmed.replaceAll("\\s+", "");
            byte[] decoded = Base64.getMimeDecoder().decode(sanitized);
            String candidate = new String(decoded, StandardCharsets.UTF_8).trim();
            if (candidate.startsWith("{")) {
                return decoded;
            }
        } catch (IllegalArgumentException ignored) {
            // Fall through
        }
        return trimmed.getBytes(StandardCharsets.UTF_8);
    }

    private byte[] decodeBase64Safe(String input) {
        String trimmed = input.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        if (trimmed.startsWith("{")) {
            return trimmed.getBytes(StandardCharsets.UTF_8);
        }
        try {
            String sanitized = trimmed.replaceAll("\\s+", "");
            return Base64.getMimeDecoder().decode(sanitized);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 string provided in FIREBASE_SERVICE_ACCOUNT_BASE64: " + e.getMessage(), e);
        }
    }

    // Setters for programmatic or test configuration
    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setCredentialsJson(String credentialsJson) {
        this.credentialsJson = credentialsJson;
    }

    public void setCredentialsBase64(String credentialsBase64) {
        this.credentialsBase64 = credentialsBase64;
    }

    public void setCredentialsPath(String credentialsPath) {
        this.credentialsPath = credentialsPath;
    }
}