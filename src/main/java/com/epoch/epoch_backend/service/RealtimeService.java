package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.*;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class RealtimeService {

    private final Firestore db;
    private final NotificationService notificationService;
    private final OdService odService;
    private final AnnouncementService announcementService;
    private final ChatService chatService;

    public RealtimeService(Firestore db, NotificationService notificationService,
                           OdService odService, AnnouncementService announcementService,
                           ChatService chatService) {
        this.db = db;
        this.notificationService = notificationService;
        this.odService = odService;
        this.announcementService = announcementService;
        this.chatService = chatService;
    }

    /**
     * Aggregates real-time state for the current authenticated user in a single lightweight snapshot.
     */
    public Map<String, Object> getSyncState(UserProfile user) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("userId", user.getIdentifier());
        state.put("role", user.getRole().name());
        state.put("timestamp", System.currentTimeMillis());

        // 1. Unread Notifications Count
        int unreadNotifs = 0;
        try {
            unreadNotifs = notificationService.getUnreadCount(user.getIdentifier());
        } catch (Exception ignored) {}
        state.put("unreadNotificationsCount", unreadNotifs);

        // 2. Pending Academic Requests Count
        int pendingReqs = 0;
        String latestReqId = "";
        try {
            if (user.getRole() == UserRole.STUDENT) {
                List<OdRequest> requests = odService.getStudentRequests(user.getIdentifier());
                for (OdRequest r : requests) {
                    if (r.getStatus() != null && r.getStatus().name().startsWith("PENDING_")) {
                        pendingReqs++;
                    }
                    if (r.getId() != null && r.getId().compareTo(latestReqId) > 0) {
                        latestReqId = r.getId();
                    }
                }
            } else if (user.getRole() == UserRole.ADVISOR) {
                List<OdRequest> requests = odService.getAdvisorRequests(user.getSection());
                for (OdRequest r : requests) {
                    if (r.getStatus() == OdStatus.PENDING_ADVISOR) pendingReqs++;
                    if (r.getId() != null && r.getId().compareTo(latestReqId) > 0) {
                        latestReqId = r.getId();
                    }
                }
            } else if (user.getRole() == UserRole.HOD) {
                List<OdRequest> requests = odService.getHodRequests();
                for (OdRequest r : requests) {
                    if (r.getStatus() == OdStatus.PENDING_HOD) pendingReqs++;
                    if (r.getId() != null && r.getId().compareTo(latestReqId) > 0) {
                        latestReqId = r.getId();
                    }
                }
            } else if (user.getRole() == UserRole.PRINCIPAL) {
                List<OdRequest> requests = odService.getPrincipalRequests();
                for (OdRequest r : requests) {
                    if (r.getStatus() == OdStatus.PENDING_PRINCIPAL) pendingReqs++;
                    if (r.getId() != null && r.getId().compareTo(latestReqId) > 0) {
                        latestReqId = r.getId();
                    }
                }
            }
        } catch (Exception ignored) {}
        state.put("pendingRequestsCount", pendingReqs);
        state.put("latestRequestId", latestReqId);
        state.put("latestRequestTimestamp", (long) Math.abs(latestReqId.hashCode()));

        // 3. Announcements
        String latestAnnId = null;
        try {
            List<Announcement> anns = announcementService.getAnnouncementsForUser(user);
            if (!anns.isEmpty()) {
                latestAnnId = anns.get(0).getId();
            }
        } catch (Exception ignored) {}
        state.put("latestAnnouncementId", latestAnnId);

        // 4. Unread Chat Messages & Received Requests
        int unreadChats = 0;
        int pendingChatRequests = 0;
        try {
            unreadChats = chatService.getUnreadCount(user);
            List<ChatMessageRequest> chatReqs = chatService.getReceivedRequests(user);
            for (ChatMessageRequest cr : chatReqs) {
                if ("PENDING".equalsIgnoreCase(cr.getStatus())) pendingChatRequests++;
            }
        } catch (Exception ignored) {}
        state.put("unreadChatMessagesCount", unreadChats);
        state.put("pendingChatRequestsCount", pendingChatRequests);
        return state;
    }
}
