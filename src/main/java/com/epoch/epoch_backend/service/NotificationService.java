package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.NotificationItem;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class NotificationService {

    private final Firestore db;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final List<NotificationItem> inMemoryNotifications = java.util.Collections.synchronizedList(new ArrayList<>());
    private volatile boolean seeded = false;

    public NotificationService(Firestore db) {
        this.db = db;
    }

    public void createNotification(String recipientId, String title, String message, String type, String referenceId, String rejectionReason, String staffRole) {
        createNotification(recipientId, title, message, type, referenceId, rejectionReason, staffRole, null, null, null);
    }

    public void createNotification(String recipientId, String title, String message, String type, String referenceId,
                                   String rejectionReason, String staffRole, String category, String senderName, String senderRole) {
        try {
            if (recipientId == null || recipientId.trim().isEmpty()) return;
            String cleanRecipient = recipientId.trim();

            // Intelligent inference of metadata if missing
            String cat = category;
            if (cat == null || cat.trim().isEmpty()) {
                if (type != null && type.contains("COMPLAINT")) {
                    cat = "Student Complaint";
                } else if (type != null && (type.contains("APPROVED") || type.contains("REJECTED"))) {
                    cat = "Official Decision";
                } else if (type != null && (type.contains("REQUEST") || type.contains("OD_") || type.contains("LEAVE") || type.contains("BONAFIDE"))) {
                    cat = "Academic Request";
                } else if (type != null && (type.contains("FEE") || type.contains("PAYMENT") || type.contains("RECEIPT"))) {
                    cat = "Fee Operations";
                } else if (type != null && (type.contains("ANNOUNCEMENT") || type.contains("NOTICE"))) {
                    cat = "Institutional Notice";
                } else if (type != null && (type.contains("CHAT") || type.contains("MESSAGE"))) {
                    cat = "Direct Message";
                } else {
                    cat = "Institutional Update";
                }
            }

            String sRole = senderRole;
            if (sRole == null || sRole.trim().isEmpty()) {
                if (type != null) {
                    if ("REQUEST_PENDING_ADVISOR".equals(type)) {
                        sRole = "Student";
                    } else if ("REQUEST_PENDING_HOD".equals(type)) {
                        sRole = "Class Advisor";
                    } else if ("REQUEST_PENDING_PRINCIPAL".equals(type)) {
                        sRole = "Head of Department";
                    } else if ("REQUEST_SUBMITTED".equals(type)) {
                        sRole = "System";
                    } else if ("REQUEST_REJECTED".equals(type)) {
                        sRole = staffRole != null ? staffRole : "Reviewing Authority";
                    } else if ("REQUEST_APPROVED_STEP".equals(type)) {
                        sRole = staffRole != null ? staffRole : "Class Advisor";
                    } else if ("REQUEST_APPROVED_FINAL".equals(type)) {
                        sRole = staffRole != null ? staffRole : "Head of Department";
                    } else if (type.startsWith("COMPLAINT_NEW")) {
                        sRole = "Student";
                    } else if (type.startsWith("COMPLAINT_SUBMITTED")) {
                        sRole = "Administration";
                    } else if (type.startsWith("COMPLAINT_UPDATE")) {
                        sRole = "Principal";
                    } else if (type.contains("PAYMENT") || type.contains("RECEIPT") || type.contains("FEE")) {
                        sRole = "Accounts Officer";
                    } else if (type.contains("ANNOUNCEMENT")) {
                        sRole = staffRole != null ? staffRole : "Institution";
                    } else if (type.contains("CHAT") || type.contains("MESSAGE")) {
                        sRole = staffRole != null ? staffRole : "User";
                    } else if (staffRole != null && !staffRole.trim().isEmpty()) {
                        sRole = staffRole;
                    } else {
                        sRole = "Administration";
                    }
                } else if (staffRole != null && !staffRole.trim().isEmpty()) {
                    sRole = staffRole;
                } else {
                    sRole = "Administration";
                }
            }

            String sName = senderName;
            if (sName == null || sName.trim().isEmpty()) {
                if ("Class Advisor".equalsIgnoreCase(sRole)) {
                    sName = "Class Advisor";
                } else if ("Head of Department".equalsIgnoreCase(sRole) || "HOD".equalsIgnoreCase(sRole)) {
                    sName = "Dr. K. Gopinath (HOD-CSE)";
                } else if ("Principal".equalsIgnoreCase(sRole)) {
                    sName = "Dr. B. Sanjay Gandhi (Principal)";
                } else if ("Accounts Officer".equalsIgnoreCase(sRole)) {
                    sName = "Dr. S. K. Ramesh (Admin & Accounts)";
                } else if ("System".equalsIgnoreCase(sRole)) {
                    sName = "EPOCH Workflow Engine";
                } else if ("Student".equalsIgnoreCase(sRole)) {
                    sName = "Student Applicant";
                } else {
                    sName = "EPOCH Administration";
                }
            }

            // Prevent duplicate notifications in memory
            synchronized (inMemoryNotifications) {
                boolean exists;
                if (referenceId != null && !referenceId.trim().isEmpty()) {
                    exists = inMemoryNotifications.stream().anyMatch(n ->
                            cleanRecipient.equalsIgnoreCase(n.getRecipientId()) &&
                            Objects.equals(type, n.getType()) &&
                            Objects.equals(referenceId, n.getReferenceId())
                    );
                } else {
                    exists = inMemoryNotifications.stream().anyMatch(n ->
                            cleanRecipient.equalsIgnoreCase(n.getRecipientId()) &&
                            Objects.equals(title, n.getTitle()) &&
                            Objects.equals(message, n.getMessage())
                    );
                }
                if (exists) return;
            }

            String id = "NOTIF-" + System.currentTimeMillis() + "-" + (int)(100 + Math.random() * 900);
            NotificationItem item = new NotificationItem();
            item.setId(id);
            item.setRecipientId(cleanRecipient);
            item.setTitle(title);
            item.setMessage(message);
            item.setType(type);
            item.setReferenceId(referenceId);
            item.setRead(false);
            item.setCreatedAt(LocalDateTime.now().format(formatter));
            item.setRejectionReason(rejectionReason);
            item.setStaffRole(staffRole);
            item.setCategory(cat);
            item.setSenderName(sName);
            item.setSenderRole(sRole);

            inMemoryNotifications.add(0, item);

            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("recipientId", cleanRecipient);
            data.put("title", title);
            data.put("message", message);
            data.put("type", type);
            data.put("referenceId", referenceId);
            data.put("read", false);
            data.put("createdAt", item.getCreatedAt());
            if (rejectionReason != null) data.put("rejectionReason", rejectionReason);
            if (staffRole != null) data.put("staffRole", staffRole);
            data.put("category", cat);
            data.put("senderName", sName);
            data.put("senderRole", sRole);

            db.collection("notifications").document(id).set(data);
        } catch (Exception ex) {
            System.err.println("Notification creation in Firestore failed (persisted in-memory): " + ex.getMessage());
        }
    }

    public List<NotificationItem> getUserNotifications(String recipientId) {
        if (recipientId == null || recipientId.trim().isEmpty()) return Collections.emptyList();
        
        ensureDefaultNotificationsSeeded();

        Set<String> recipientIds = new HashSet<>();
        recipientIds.add(recipientId.trim().toLowerCase());
        if ("dhivyabharathi".equalsIgnoreCase(recipientId) || "divyabharathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("dhivyabharathi");
            recipientIds.add("divyabharathi");
        } else if ("rajavathijayapriya".equalsIgnoreCase(recipientId) || "rajavathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("rajavathijayapriya");
            recipientIds.add("rajavathi");
        } else if ("gopinath".equalsIgnoreCase(recipientId) || "hod".equalsIgnoreCase(recipientId)) {
            recipientIds.add("gopinath");
            recipientIds.add("hod");
        } else if ("bsanjaygandhi".equalsIgnoreCase(recipientId) || "principal".equalsIgnoreCase(recipientId)) {
            recipientIds.add("bsanjaygandhi");
            recipientIds.add("principal");
        }

        Map<String, NotificationItem> map = new LinkedHashMap<>();

        // Add from inMemoryNotifications first
        synchronized (inMemoryNotifications) {
            for (NotificationItem n : inMemoryNotifications) {
                if (n.getRecipientId() != null && recipientIds.contains(n.getRecipientId().trim().toLowerCase())) {
                    map.put(n.getId(), n);
                }
            }
        }

        try {
            var querySnap = db.collection("notifications")
                    .whereIn("recipientId", new ArrayList<>(recipientIds))
                    .get().get(2000, java.util.concurrent.TimeUnit.MILLISECONDS);

            for (DocumentSnapshot doc : querySnap.getDocuments()) {
                String docId = doc.getString("id") != null ? doc.getString("id") : doc.getId();
                NotificationItem item = new NotificationItem();
                item.setId(docId);
                item.setRecipientId(doc.getString("recipientId"));
                item.setTitle(doc.getString("title"));
                item.setMessage(doc.getString("message"));
                item.setType(doc.getString("type"));
                item.setReferenceId(doc.getString("referenceId"));
                item.setRead(Boolean.TRUE.equals(doc.getBoolean("read")));
                item.setCreatedAt(doc.getString("createdAt"));
                item.setRejectionReason(doc.getString("rejectionReason"));
                item.setStaffRole(doc.getString("staffRole"));
                item.setCategory(doc.getString("category") != null ? doc.getString("category") : "Academic Request");
                item.setSenderName(doc.getString("senderName"));
                item.setSenderRole(doc.getString("senderRole"));
                NotificationItem existing = map.get(docId);
                if (existing != null && existing.isRead()) {
                    item.setRead(true);
                }
                map.put(docId, item);
            }
        } catch (Exception ex) {
            // In-memory cache fulfills responses if offline or during network latency
        }

        List<NotificationItem> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            if (a.getId() != null && b.getId() != null) {
                return b.getId().compareTo(a.getId());
            }
            return 0;
        });
        return list;
    }

    public void markAsRead(String notificationId) {
        if (notificationId == null) return;
        synchronized (inMemoryNotifications) {
            for (NotificationItem n : inMemoryNotifications) {
                if (Objects.equals(n.getId(), notificationId)) {
                    n.setRead(true);
                }
            }
        }
        try {
            db.collection("notifications").document(notificationId).update("read", true);
        } catch (Exception ignored) {}
    }

    public void markAllAsRead(String recipientId) {
        if (recipientId == null || recipientId.trim().isEmpty()) return;
        Set<String> recipientIds = new HashSet<>();
        recipientIds.add(recipientId.trim().toLowerCase());
        if ("dhivyabharathi".equalsIgnoreCase(recipientId) || "divyabharathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("dhivyabharathi");
            recipientIds.add("divyabharathi");
        } else if ("rajavathijayapriya".equalsIgnoreCase(recipientId) || "rajavathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("rajavathijayapriya");
            recipientIds.add("rajavathi");
        } else if ("gopinath".equalsIgnoreCase(recipientId) || "hod".equalsIgnoreCase(recipientId)) {
            recipientIds.add("gopinath");
            recipientIds.add("hod");
        } else if ("bsanjaygandhi".equalsIgnoreCase(recipientId) || "principal".equalsIgnoreCase(recipientId)) {
            recipientIds.add("bsanjaygandhi");
            recipientIds.add("principal");
        }

        synchronized (inMemoryNotifications) {
            for (NotificationItem n : inMemoryNotifications) {
                if (n.getRecipientId() != null && recipientIds.contains(n.getRecipientId().trim().toLowerCase())) {
                    n.setRead(true);
                    try {
                        db.collection("notifications").document(n.getId()).update("read", true);
                    } catch (Exception ignored) {}
                }
            }
        }
    }

    public int getUnreadCount(String recipientId) {
        if (recipientId == null || recipientId.trim().isEmpty()) return 0;
        try {
            List<NotificationItem> list = getUserNotifications(recipientId);
            int unread = 0;
            for (NotificationItem n : list) {
                if (!n.isRead()) unread++;
            }
            return unread;
        } catch (Exception ex) {
            return 0;
        }
    }

    public synchronized void ensureDefaultNotificationsSeeded() {
        if (seeded) return;
        seeded = true;

        // Seed default institutional notifications if inMemoryNotifications is empty
        if (!inMemoryNotifications.isEmpty()) return;

        // 1. Student ABINAYA G (620823104002, CSE-A)
        seedItem("NOTIF-STU-001", "620823104002", "OD Application Approved",
                "Your OD request (EPOCH-OD-2026-001) for PSG Tech Symposium has received final approval from HOD. Official certificate is available.",
                "REQUEST_APPROVED_FINAL", "EPOCH-OD-2026-001", false, "24 Mar 2026, 04:30 pm",
                null, null, "Official Decision", "Dr. K. Gopinath", "Head of Department (CSE)");

        seedItem("NOTIF-STU-002", "620823104002", "Placement Drive Request Approved by Advisor",
                "Your Placement Drive request (EPOCH-OD-2026-002) was approved by Class Advisor Mrs. P. Arularasi and forwarded to HOD for departmental review.",
                "REQUEST_APPROVED_STEP", "EPOCH-OD-2026-002", false, "25 Mar 2026, 11:30 am",
                null, "Class Advisor", "Academic Request", "Mrs. P. Arularasi", "Class Advisor (CSE-A)");

        seedItem("NOTIF-STU-003", "620823104002", "Payment Confirmed: ₹45,000.00",
                "Your payment for Tuition Fee (UTR: 987654321012) has been confirmed. Official verified receipt is available.",
                "PAYMENT_CONFIRMED", "RCPT-2026-001", false, "26 Mar 2026, 10:15 am",
                null, null, "Fee Operations", "Dr. S. K. Ramesh", "Accounts Officer");

        seedItem("NOTIF-STU-004", "620823104002", "Complaint Registered Directly with Principal",
                "Your confidential grievance (EPOCH-CMP-2026-01) regarding GPU cluster access was submitted directly to Principal Dr. B. Sanjay Gandhi.",
                "COMPLAINT_SUBMITTED", "EPOCH-CMP-2026-01", false, "27 Mar 2026, 02:45 pm",
                null, null, "Student Complaint", "EPOCH Grievance Cell", "Administration");

        // 2. Class Advisor CSE-A (arularasi)
        seedItem("NOTIF-ADV-A-001", "arularasi", "New Sports / Cultural Meet Pending Review",
                "Student ABINAYA G (620823104002, CSE-A) has submitted Sports / Cultural Meet: EPOCH-OD-2026-003.",
                "REQUEST_PENDING_ADVISOR", "EPOCH-OD-2026-003", false, "28 Mar 2026, 09:20 am",
                null, null, "Academic Request", "ABINAYA G", "Student (CSE-A)");

        seedItem("NOTIF-ADV-A-002", "arularasi", "New Leave Application Pending Review",
                "Student BALAMURUGAN C (620823104020, CSE-A) has submitted Leave Application: EPOCH-LV-2026-101.",
                "REQUEST_PENDING_ADVISOR", "EPOCH-LV-2026-101", false, "28 Mar 2026, 10:45 am",
                null, null, "Academic Request", "BALAMURUGAN C", "Student (CSE-A)");

        seedItem("NOTIF-ADV-A-003", "arularasi", "Official Receipt: ABINAYA G (CSE-A)",
                "Student ABINAYA G (620823104002, CSE-A) paid ₹45,000.00 for Tuition Fee (UTR: 987654321012). Verified by Accounts.",
                "ADVISOR_RECEIPT_DELIVERY", "RCPT-2026-001", true, "26 Mar 2026, 10:16 am",
                null, "ADVISOR", "Fee Operations", "Dr. S. K. Ramesh", "Accounts Officer");

        // 3. Class Advisor CSE-B (divyabharathi)
        seedItem("NOTIF-ADV-B-001", "divyabharathi", "New Hackathon Request Pending Review",
                "Student BHARANIDHARAN S (620823104023, CSE-B) has submitted Hackathon requisition: EPOCH-OD-2026-B01.",
                "REQUEST_PENDING_ADVISOR", "EPOCH-OD-2026-B01", false, "28 Mar 2026, 11:00 am",
                null, null, "Academic Request", "BHARANIDHARAN S", "Student (CSE-B)");

        // 4. Class Advisor CSE-C (rajavathijayapriya)
        seedItem("NOTIF-ADV-C-001", "rajavathijayapriya", "New Symposium / Conference Pending Review",
                "Student PRAVEENA B (620823104034, CSE-C) has submitted Symposium / Conference: EPOCH-OD-2026-004.",
                "REQUEST_PENDING_ADVISOR", "EPOCH-OD-2026-004", false, "28 Mar 2026, 01:15 pm",
                null, null, "Academic Request", "PRAVEENA B", "Student (CSE-C)");

        seedItem("NOTIF-ADV-C-002", "rajavathijayapriya", "New Symposium / Conference Pending Review",
                "Student PRAVEENA B (620823104034, CSE-C) has submitted Symposium / Conference: EPOCH-OD-1793516731713-3134.",
                "REQUEST_PENDING_ADVISOR", "EPOCH-OD-1793516731713-3134", false, "28 Mar 2026, 02:30 pm",
                null, null, "Academic Request", "PRAVEENA B", "Student (CSE-C)");

        // 5. Head of Department (gopinath)
        seedItem("NOTIF-HOD-001", "gopinath", "New Placement Drive / Interview Forwarded to HOD",
                "Placement Drive / Interview request EPOCH-OD-2026-002 for student ABINAYA G (CSE-A) has been approved by Class Advisor Mrs. P. Arularasi and awaits your review.",
                "REQUEST_PENDING_HOD", "EPOCH-OD-2026-002", false, "25 Mar 2026, 11:31 am",
                null, null, "Academic Request", "Mrs. P. Arularasi", "Class Advisor (CSE-A)");

        seedItem("NOTIF-HOD-002", "gopinath", "Bonafide Certificate Forwarded to HOD",
                "Bonafide Certificate request EPOCH-BNF-2026-201 for student PRAVEENA B (CSE-C) has been approved by Class Advisor Mrs. Rajavathi Jayapriya and awaits your review.",
                "REQUEST_PENDING_HOD", "EPOCH-BNF-2026-201", false, "28 Mar 2026, 03:00 pm",
                null, null, "Academic Request", "Mrs. Rajavathi Jayapriya", "Class Advisor (CSE-C)");

        // 6. Principal (bsanjaygandhi)
        seedItem("NOTIF-PRIN-001", "bsanjaygandhi", "Bonafide Certificate Awaiting Principal Approval",
                "Bonafide Certificate request EPOCH-BNF-2026-001 for student ABINAYA G (CSE-A) has been approved by HOD Dr. K. Gopinath and awaits Principal final executive approval.",
                "REQUEST_PENDING_PRINCIPAL", "EPOCH-BNF-2026-001", false, "26 Mar 2026, 09:30 am",
                null, null, "Academic Request", "Dr. K. Gopinath", "Head of Department (CSE)");

        seedItem("NOTIF-PRIN-002", "bsanjaygandhi", "New Student Complaint Received",
                "A confidential student complaint (EPOCH-CMP-2026-01) regarding 'GPU cluster access' was submitted directly by ABINAYA G (CSE-A). Subject: GPU Cluster Access for Final Year Deep Learning Project",
                "COMPLAINT_NEW", "EPOCH-CMP-2026-01", false, "27 Mar 2026, 02:46 pm",
                null, null, "Student Complaint", "ABINAYA G", "Student (CSE-A)");
    }

    private void seedItem(String id, String recipientId, String title, String message, String type, String referenceId,
                           boolean read, String createdAt, String rejectionReason, String staffRole,
                           String category, String senderName, String senderRole) {
        NotificationItem item = new NotificationItem();
        item.setId(id);
        item.setRecipientId(recipientId);
        item.setTitle(title);
        item.setMessage(message);
        item.setType(type);
        item.setReferenceId(referenceId);
        item.setRead(read);
        item.setCreatedAt(createdAt);
        item.setRejectionReason(rejectionReason);
        item.setStaffRole(staffRole);
        item.setCategory(category);
        item.setSenderName(senderName);
        item.setSenderRole(senderRole);
        inMemoryNotifications.add(item);

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("recipientId", recipientId);
            data.put("title", title);
            data.put("message", message);
            data.put("type", type);
            data.put("referenceId", referenceId);
            data.put("read", read);
            data.put("createdAt", createdAt);
            if (rejectionReason != null) data.put("rejectionReason", rejectionReason);
            if (staffRole != null) data.put("staffRole", staffRole);
            data.put("category", category);
            data.put("senderName", senderName);
            data.put("senderRole", senderRole);
            db.collection("notifications").document(id).set(data);
        } catch (Exception ignored) {}
    }
}
