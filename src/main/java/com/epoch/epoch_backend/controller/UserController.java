package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.ChatService;
import com.epoch.epoch_backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final ChatService chatService;

    public UserController(UserService userService, ChatService chatService) {
        this.userService = userService;
        this.chatService = chatService;
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() == UserRole.STUDENT) {
                UserProfile fresh = userService.findStudent(user.getIdentifier());
                if (fresh != null) {
                    return ResponseEntity.ok(fresh);
                }
            } else {
                UserProfile fresh = userService.findStaff(user.getIdentifier());
                if (fresh != null) {
                    return ResponseEntity.ok(fresh);
                }
            }
            return ResponseEntity.ok(user);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        try {
            UserProfile user = getCurrentUser();
            String name = body.get("name");
            String contact = body.get("contact");
            if (contact == null || contact.trim().isEmpty()) {
                contact = body.get("contactPhone");
            }
            String bio = body.get("bio");
            String email = body.get("email");
            String address = body.get("address");
            String emergencyContact = body.get("emergencyContact");

            UserProfile updated = userService.updateProfile(user, name, contact, bio, email, address, emergencyContact);
            chatService.invalidateUserCache(user.getIdentifier());
            return ResponseEntity.ok(updated);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Profile update failed: " + ex.getMessage()));
        }
    }

    @PostMapping("/profile-photo")
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            UserProfile user = getCurrentUser();
            String photoData = null;

            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg")
                        && !contentType.equalsIgnoreCase("image/jpg")
                        && !contentType.equalsIgnoreCase("image/png")
                        && !contentType.equalsIgnoreCase("image/webp"))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP."));
                }
                if (file.getSize() > 5 * 1024 * 1024) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Image file exceeds maximum allowable size (5 MB)."));
                }
                photoData = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());
            } else if (body != null) {
                Object p = body.get("photo");
                if (p == null) p = body.get("profilePhoto");
                if (p == null) p = body.get("image");
                if (p != null) {
                    photoData = p.toString().trim();
                }
            }

            if (photoData == null || photoData.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No profile photo data provided."));
            }

            // Security Validation on Base64 payload
            if (photoData.startsWith("data:")) {
                String header = photoData.substring(0, Math.min(photoData.indexOf(",") + 1, 40)).toLowerCase();
                if (!header.contains("image/jpeg") && !header.contains("image/jpg")
                        && !header.contains("image/png") && !header.contains("image/webp")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Unsupported image format. Allowed: JPG, JPEG, PNG, WEBP."));
                }
                if (photoData.length() > 8 * 1024 * 1024) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Image payload exceeds maximum allowable size (5 MB)."));
                }
            }

            UserProfile updated = userService.updateProfilePhoto(user, photoData);
            chatService.invalidateUserCache(user.getIdentifier());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "profilePhoto", updated.getProfilePhoto(),
                    "message", "Profile photo updated successfully."
            ));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload profile photo: " + ex.getMessage()));
        }
    }

    @DeleteMapping("/profile-photo")
    public ResponseEntity<?> removeProfilePhoto() {
        try {
            UserProfile user = getCurrentUser();
            UserProfile updated = userService.removeProfilePhoto(user);
            chatService.invalidateUserCache(user.getIdentifier());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Profile photo removed successfully."
            ));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove profile photo: " + ex.getMessage()));
        }
    }
}
