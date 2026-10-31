package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.Announcement;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.service.AnnouncementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@AuthenticationPrincipal UserProfile user, @RequestBody Announcement req) {
        try {
            return ResponseEntity.ok(announcementService.createAnnouncement(user, req));
        } catch (SecurityException se) {
            String msg = se.getMessage() != null ? se.getMessage() : "Unauthorized";
            return ResponseEntity.status(403).body(Map.of("error", msg));
        } catch (Exception ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(announcementService.getAnnouncementsForUser(user));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/my-sent")
    public ResponseEntity<?> getMySentAnnouncements(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(announcementService.getSentAnnouncements(user));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserProfile user, @PathVariable String id) {
        announcementService.markAsRead(user, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@AuthenticationPrincipal UserProfile user, @PathVariable String id) {
        try {
            announcementService.deleteAnnouncement(user, id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
