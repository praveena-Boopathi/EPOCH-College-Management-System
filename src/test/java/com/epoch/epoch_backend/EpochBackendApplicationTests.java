package com.epoch.epoch_backend;

import com.epoch.epoch_backend.model.AuthRequest;
import com.epoch.epoch_backend.model.AuthResponse;
import com.epoch.epoch_backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EpochBackendApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private com.google.cloud.firestore.Firestore firestore;

    @Test
    void dumpRequests() throws Exception {
        var snap = firestore.collection("chat_requests").get().get();
        System.out.println(">>> TOTAL CHAT REQUESTS IN FIRESTORE: " + snap.size());
        for (var doc : snap.getDocuments()) {
            System.out.println(">>> DOC ID: " + doc.getId() + " => " + doc.getData());
        }
    }

    @Test
    void dumpAllConversations() throws Exception {
        var snap1 = firestore.collection("conversations").get().get();
        System.out.println(">>> TOTAL IN conversations: " + snap1.size());
        for (var doc : snap1.getDocuments()) {
            System.out.println(">>> conversations doc: " + doc.getId() + " => " + doc.getData());
        }

        var snap2 = firestore.collection("chat_conversations").get().get();
        System.out.println(">>> TOTAL IN chat_conversations: " + snap2.size());
        for (var doc : snap2.getDocuments()) {
            System.out.println(">>> chat_conversations doc: " + doc.getId() + " => " + doc.getData());
        }
    }

    @Test
    void dumpStudentsAndStaff() throws Exception {
        var snap = firestore.collection("students").limit(3).get().get();
        System.out.println(">>> STUDENTS SAMPLE:");
        for (var doc : snap.getDocuments()) {
            System.out.println(">>> STUDENT ID: " + doc.getId() + " => " + doc.getData());
        }

        var snapStaff = firestore.collection("staff").limit(3).get().get();
        System.out.println(">>> STAFF SAMPLE:");
        for (var doc : snapStaff.getDocuments()) {
            System.out.println(">>> STAFF ID: " + doc.getId() + " => " + doc.getData());
        }

        var snapUsers = firestore.collection("users").limit(3).get().get();
        System.out.println(">>> USERS SAMPLE (size " + snapUsers.size() + "):");
        for (var doc : snapUsers.getDocuments()) {
            System.out.println(">>> USER ID: " + doc.getId() + " => " + doc.getData());
        }
    }

    @Test
    void contextLoads() {
        assertNotNull(authService);
    }

    @Test
    void testStudentLogin() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("620823104002");
        req.setPassword("student@12");
        AuthResponse resp = authService.authenticate(req);

        assertNotNull(resp);
        assertEquals("STUDENT", resp.getRole());
        assertEquals("ABINAYA G", resp.getName());
    }

    @Test
    void testAdvisorLogin() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("arularasi");
        req.setPassword("staff@123");
        AuthResponse resp = authService.authenticate(req);

        assertNotNull(resp);
        assertEquals("ADVISOR", resp.getRole());
        assertEquals("Mrs. P. Arularasi", resp.getName());
    }

    @Test
    void testHodLogin() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("gopinath");
        req.setPassword("hod@123");
        AuthResponse resp = authService.authenticate(req);

        assertNotNull(resp);
        assertEquals("HOD", resp.getRole());
        assertEquals("Dr. K. Gopinath", resp.getName());
    }

    @Test
    void testPrincipalLogin() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("bsanjaygandhi");
        req.setPassword("principal@123");
        AuthResponse resp = authService.authenticate(req);

        assertNotNull(resp);
        assertEquals("PRINCIPAL", resp.getRole());
        assertTrue(resp.getName().contains("Sanjay Gandhi"));
    }

    @Test
    void testInvalidPasswordFails() {
        AuthRequest req = new AuthRequest();
        req.setUsername("arularasi");
        req.setPassword("wrongPassword");
        assertThrows(BadCredentialsException.class, () -> authService.authenticate(req));
    }

    @Test
    void testStorage() {
        try {
            com.google.auth.oauth2.GoogleCredentials credentials;
            try (var is = new org.springframework.core.io.ClassPathResource("firebase-service-account.json").getInputStream()) {
                credentials = com.google.auth.oauth2.GoogleCredentials.fromStream(is);
            }
            com.google.cloud.storage.Storage storage = com.google.cloud.storage.StorageOptions.newBuilder()
                    .setCredentials(credentials)
                    .setProjectId("epoch-a43c7")
                    .build()
                    .getService();
            System.out.println(">>> LISTING BUCKETS FOR epoch-a43c7:");
            for (var b : storage.list().iterateAll()) {
                System.out.println(">>> FOUND BUCKET: " + b.getName());
            }
            try {
                com.google.cloud.storage.Bucket newBucket = storage.create(com.google.cloud.storage.BucketInfo.of("epoch-a43c7-profiles"));
                System.out.println(">>> CREATED BUCKET: " + newBucket.getName());
            } catch (Exception be) {
                System.out.println(">>> BUCKET CREATE EXCEPTION: " + be.getMessage());
            }
        } catch (Exception e) {
            System.out.println(">>> STORAGE EXCEPTION: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
