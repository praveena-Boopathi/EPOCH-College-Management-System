package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.StaffSignature;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.SignatureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/staff/signature")
public class SignatureController {

    private final SignatureService signatureService;

    public SignatureController(SignatureService signatureService) {
        this.signatureService = signatureService;
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @PostMapping
    public ResponseEntity<?> uploadSignature(@RequestBody Map<String, String> body) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() == UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Students cannot upload staff signatures"));
            }
            String base64 = body.get("signatureBase64");
            if (base64 == null || base64.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Signature data required"));
            }
            signatureService.saveSignature(user.getIdentifier(), user.getName(), user.getRole().name(), base64);
            return ResponseEntity.ok(Map.of("success", true, "message", "Signature saved successfully"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getSignature() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() == UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }
            StaffSignature sig = signatureService.getSignature(user.getIdentifier());
            if (sig == null) return ResponseEntity.ok(Map.of("hasSignature", false));
            return ResponseEntity.ok(Map.of("hasSignature", true, "signature", sig));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }
}