package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.NotificationItem;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        try {
            UserProfile user = getCurrentUser();
            List<NotificationItem> list = notificationService.getUserNotifications(user.getIdentifier());
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            UserProfile user = getCurrentUser();
            int count = notificationService.getUnreadCount(user.getIdentifier());
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of("unreadCount", 0));
        }
    }
}