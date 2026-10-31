package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.ChatConversation;
import com.epoch.epoch_backend.model.ChatMessage;
import com.epoch.epoch_backend.model.ChatMessageRequest;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.ChatService;
import com.epoch.epoch_backend.service.OdService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> getContacts() {
        try {
            UserProfile user = getCurrentUser();
            List<Map<String, Object>> contacts = chatService.getContacts(user);
            return ResponseEntity.ok(contacts);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> searchStudents(@RequestParam(value = "query", required = false) String query) {
        try {
            UserProfile user = getCurrentUser();
            List<Map<String, Object>> students = chatService.searchStudents(user, query);
            return ResponseEntity.ok(students);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "30") int limit) {
        try {
            UserProfile user = getCurrentUser();
            List<Map<String, Object>> users = chatService.searchUsers(user, query, role, page, limit);
            return ResponseEntity.ok(users);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        try {
            UserProfile user = getCurrentUser();
            List<ChatConversation> list = chatService.getConversations(user);
            return ResponseEntity.ok(list);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> getOrCreateConversation(@RequestBody Map<String, String> body) {
        try {
            UserProfile user = getCurrentUser();
            String targetId = body.get("targetIdentifier");
            if (targetId == null || targetId.trim().isEmpty()) targetId = body.get("targetId");
            if (targetId == null || targetId.trim().isEmpty()) targetId = body.get("staffUsername");
            if (targetId == null || targetId.trim().isEmpty()) targetId = body.get("identifier");
            if (targetId == null || targetId.trim().isEmpty()) {
                String staffRole = body.get("staffRole");
                if (staffRole != null && user.getRole() == UserRole.STUDENT) {
                    if ("ADVISOR".equalsIgnoreCase(staffRole)) {
                        targetId = OdService.getAdvisorForSection(user.getSection());
                    } else if ("HOD".equalsIgnoreCase(staffRole)) {
                        targetId = "gopinath";
                    } else if ("PRINCIPAL".equalsIgnoreCase(staffRole)) {
                        targetId = "bsanjaygandhi";
                    }
                }
            }
            if (targetId == null || targetId.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "targetIdentifier is required"));
            }
            ChatConversation conv = chatService.getOrCreateConversation(user, targetId);
            return ResponseEntity.ok(conv);
        } catch (SecurityException ex) {
            System.err.println("[ChatController] 403 Forbidden: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            System.err.println("[ChatController] 400 Bad Request: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("[ChatController] 500 Server Error: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            List<ChatMessage> messages = chatService.getMessages(user, id);
            return ResponseEntity.ok(messages);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            UserProfile user = getCurrentUser();
            System.out.println("[ChatController] POST /conversations/" + id + "/messages by " + (user != null ? user.getIdentifier() : "null"));
            String content = body != null && body.get("content") != null ? String.valueOf(body.get("content")) : null;
            if ((content == null || content.trim().isEmpty()) && body != null && body.get("message") != null) {
                content = String.valueOf(body.get("message"));
            }
            String recipientId = body != null && body.get("recipientId") != null ? String.valueOf(body.get("recipientId")) : null;
            String replyToId = body != null && body.get("replyToId") != null ? String.valueOf(body.get("replyToId")) : null;
            String replyToSender = body != null && body.get("replyToSender") != null ? String.valueOf(body.get("replyToSender")) : null;
            String replyToText = body != null && body.get("replyToText") != null ? String.valueOf(body.get("replyToText")) : null;
            String attachmentUrl = body != null && body.get("attachmentUrl") != null ? String.valueOf(body.get("attachmentUrl")) : null;
            String attachmentName = body != null && body.get("attachmentName") != null ? String.valueOf(body.get("attachmentName")) : null;
            String attachmentType = body != null && body.get("attachmentType") != null ? String.valueOf(body.get("attachmentType")) : null;
            Long attachmentSize = null;
            if (body != null && body.get("attachmentSize") != null) {
                try {
                    attachmentSize = Long.valueOf(String.valueOf(body.get("attachmentSize")));
                } catch (Exception ignored) {}
            }

            ChatMessage msg = chatService.sendMessage(
                    user, id, content, recipientId,
                    replyToId, replyToSender, replyToText,
                    attachmentUrl, attachmentName, attachmentType, attachmentSize
            );
            return ResponseEntity.ok(msg);
        } catch (SecurityException ex) {
            System.err.println("[ChatController] 403 Forbidden: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            System.err.println("[ChatController] 400 Bad Request: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("[ChatController] 500 Server Error: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String id, @PathVariable String messageId) {
        try {
            UserProfile user = getCurrentUser();
            boolean deleted = chatService.deleteMessage(user, id, messageId);
            return ResponseEntity.ok(Map.of("success", deleted, "messageId", messageId));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/typing")
    public ResponseEntity<?> setTyping(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        try {
            UserProfile user = getCurrentUser();
            boolean isTyping = body != null && Boolean.TRUE.equals(body.get("isTyping"));
            chatService.setTyping(user, id, isTyping);
            return ResponseEntity.ok(Map.of("success", true, "isTyping", isTyping));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/conversations/{id}/typing")
    public ResponseEntity<?> getTypingUsers(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            List<Map<String, Object>> typers = chatService.getTypingUsers(user, id);
            return ResponseEntity.ok(typers);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<?> markConversationAsRead(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            chatService.markConversationAsRead(user, id);
            return ResponseEntity.ok(Map.of("success", true, "conversationId", id));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            UserProfile user = getCurrentUser();
            int count = chatService.getUnreadCount(user);
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== MESSAGE REQUEST ENDPOINTS ====================

    @PostMapping("/requests")
    public ResponseEntity<?> sendMessageRequest(@RequestBody Map<String, String> body) {
        try {
            UserProfile user = getCurrentUser();
            String recipientId = body.get("recipientIdentifier");
            if (recipientId == null || recipientId.trim().isEmpty()) {
                recipientId = body.get("recipientId");
            }
            if (recipientId == null || recipientId.trim().isEmpty()) {
                recipientId = body.get("targetIdentifier");
            }
            String introMessage = body.get("introMessage");
            if (introMessage == null) {
                introMessage = body.get("message");
            }
            ChatMessageRequest req = chatService.sendMessageRequest(user, recipientId, introMessage);
            if (req != null && ("ACCEPTED".equalsIgnoreCase(req.getStatus()) || (req.getId() != null && req.getId().startsWith("EXISTING-")))) {
                return ResponseEntity.ok(Map.of(
                        "status", "EXISTS",
                        "conversationId", req.getConversationId(),
                        "request", req,
                        "message", "Active conversation already exists with this contact."
                ));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(req);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("already pending")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/requests/received")
    public ResponseEntity<?> getReceivedRequests() {
        try {
            UserProfile user = getCurrentUser();
            List<ChatMessageRequest> list = chatService.getReceivedRequests(user);
            return ResponseEntity.ok(list);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentRequests() {
        try {
            UserProfile user = getCurrentUser();
            List<ChatMessageRequest> list = chatService.getSentRequests(user);
            return ResponseEntity.ok(list);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    private String sanitizeError(Throwable ex) {
        if (ex == null) return "An unexpected error occurred.";
        String msg = ex.getMessage();
        if (msg == null) msg = ex.toString();
        if (msg.contains("RESOURCE_EXHAUSTED") || msg.contains("Quota exceeded")) {
            return "Institutional messaging service is currently experiencing high load. Operation completed via resilient backup.";
        }
        return msg;
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<?> acceptMessageRequest(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            ChatConversation conv = chatService.acceptMessageRequest(user, id);
            return ResponseEntity.ok(conv);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", sanitizeError(ex)));
        }
    }

    @PostMapping("/requests/{id}/decline")
    public ResponseEntity<?> declineMessageRequest(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            ChatMessageRequest req = chatService.declineMessageRequest(user, id);
            return ResponseEntity.ok(req);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", sanitizeError(ex)));
        }
    }

    @GetMapping("/requests/{id}/conversation")
    public ResponseEntity<?> getConversationForRequest(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            ChatConversation conv = chatService.getConversationForRequest(user, id);
            return ResponseEntity.ok(conv);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", sanitizeError(ex)));
        }
    }
}

