package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.service.RealtimeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/realtime")
public class RealtimeController {

    private final RealtimeService realtimeService;

    public RealtimeController(RealtimeService realtimeService) {
        this.realtimeService = realtimeService;
    }

    @GetMapping("/sync-state")
    public ResponseEntity<?> getSyncState(@AuthenticationPrincipal UserProfile user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(realtimeService.getSyncState(user));
    }
}
