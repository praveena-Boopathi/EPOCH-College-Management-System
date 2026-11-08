package com.epoch.epoch_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
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

@Configuration
public class FirebaseConfig {

    @Value("${epoch.firebase.project-id:epoch-a43c7}")
    private String projectId;

    @Value("${epoch.firebase.credentials-json:}")
    private String credentialsJson;

    @Value("${epoch.firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        GoogleCredentials credentials;
        if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
            try (InputStream is = new ByteArrayInputStream(credentialsJson.trim().getBytes(StandardCharsets.UTF_8))) {
                credentials = GoogleCredentials.fromStream(is);
            }
        } else if (credentialsPath != null && !credentialsPath.trim().isEmpty() && new File(credentialsPath.trim()).exists()) {
            try (InputStream is = new FileInputStream(credentialsPath.trim())) {
                credentials = GoogleCredentials.fromStream(is);
            }
        } else {
            ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    credentials = GoogleCredentials.fromStream(is);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId(projectId)
                .build();

        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }
}