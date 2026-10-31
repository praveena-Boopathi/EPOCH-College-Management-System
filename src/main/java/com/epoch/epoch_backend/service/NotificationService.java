package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.NotificationItem;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class NotificationService {

    private final Firestore db;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final List<NotificationItem> inMemoryNotifications = java.util.Collections.synchronizedList(new ArrayList<>());

    public NotificationService(Firestore db) {
        this.db = db;
    }

    public void createNotification(String recipientId, String title, String message, String type, String referenceId, String rejectionReason, String staffRole) {
        try {
            if (recipientId == null || recipientId.trim().isEmpty()) return;
            String cleanRecipient = recipientId.trim();

            // Prevent duplicate notifications in memory
            synchronized (inMemoryNotifications) {
                boolean exists = inMemoryNotifications.stream().anyMatch(n ->
                        cleanRecipient.equalsIgnoreCase(n.getRecipientId()) &&
                        Objects.equals(type, n.getType()) &&
                        Objects.equals(referenceId, n.getReferenceId())
                );
                if (exists) return;
            }

            String id = "NOTIF-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000);
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

            db.collection("notifications").document(id).set(data);
        } catch (Exception ex) {
            System.err.println("Notification creation in Firestore failed (persisted in-memory): " + ex.getMessage());
        }
    }

    public List<NotificationItem> getUserNotifications(String recipientId) {
        Set<String> recipientIds = new HashSet<>();
        recipientIds.add(recipientId.trim().toLowerCase());
        if ("dhivyabharathi".equalsIgnoreCase(recipientId) || "divyabharathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("dhivyabharathi");
            recipientIds.add("divyabharathi");
        } else if ("rajavathijayapriya".equalsIgnoreCase(recipientId) || "rajavathi".equalsIgnoreCase(recipientId)) {
            recipientIds.add("rajavathijayapriya");
            recipientIds.add("rajavathi");
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
            for (String rId : recipientIds) {
                var querySnap = db.collection("notifications")
                        .whereEqualTo("recipientId", rId)
                        .get().get();

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
                    map.put(docId, item);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for notifications (serving in-memory cache): " + ex.getMessage());
        }

        List<NotificationItem> list = new ArrayList<>(map.values());
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return list;
    }

    public void markAsRead(String notificationId) {
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
}