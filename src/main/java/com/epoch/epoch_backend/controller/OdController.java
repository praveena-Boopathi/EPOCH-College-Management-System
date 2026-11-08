package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.OdRequest;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.OdService;
import com.epoch.epoch_backend.service.PdfGenerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/od")
public class OdController {

    private final OdService odService;
    private final PdfGenerationService pdfService;

    public OdController(OdService odService, PdfGenerationService pdfService) {
        this.odService = odService;
        this.pdfService = pdfService;
    }

    private Map<String, Object> errorBody(String msg) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("error", msg != null && !msg.trim().isEmpty() ? msg : "An unexpected error occurred");
        return map;
    }

    private Map<String, Object> errorBody(Exception ex) {
        String msg = ex != null ? ex.getMessage() : null;
        if (msg == null || msg.trim().isEmpty()) {
            msg = ex != null ? ex.getClass().getSimpleName() : "An unexpected error occurred";
        }
        return errorBody(msg);
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @PostMapping("/draft")
    public ResponseEntity<?> saveDraft(@RequestBody OdRequest request) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Only students can save OD drafts"));
            }
            OdRequest draft = odService.saveDraftOd(user.getIdentifier(), request);
            return ResponseEntity.ok(draft);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitOd(@RequestBody OdRequest request) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Only students can submit OD requests"));
            }
            OdRequest created = odService.submitOd(user.getIdentifier(), request);
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }

    @GetMapping("/student")
    public ResponseEntity<?> getStudentRequests() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
            }
            List<OdRequest> list = odService.getStudentRequests(user.getIdentifier());
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(ex));
        }
    }

    @GetMapping("/advisor")
    public ResponseEntity<?> getAdvisorRequests() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.ADVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
            }
            String sec = user.getSection();
            if (sec == null || sec.trim().isEmpty()) {
                String cleanId = user.getIdentifier() != null ? user.getIdentifier().trim().toLowerCase() : "";
                if (cleanId.contains("dhivya") || cleanId.contains("divya")) sec = "CSE-B";
                else if (cleanId.contains("raja") || cleanId.contains("jayapriya")) sec = "CSE-C";
                else sec = "CSE-A";
            }
            // Strict section isolation
            List<OdRequest> list = odService.getAdvisorRequests(sec);
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(ex));
        }
    }

    @GetMapping("/hod")
    public ResponseEntity<?> getHodRequests() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.HOD) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
            }
            List<OdRequest> list = odService.getHodRequests();
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(ex));
        }
    }

    @GetMapping("/principal")
    public ResponseEntity<?> getPrincipalRequests() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
            }
            List<OdRequest> list = odService.getPrincipalRequests();
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(ex));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            OdRequest req = odService.getRequestById(id);
            if (req == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Request not found"));
            
            // Authorization checks:
            if (user.getRole() == UserRole.STUDENT && !req.getRegNo().equals(user.getIdentifier())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied: You are not authorized to view other students' requests."));
            }
            if (user.getRole() == UserRole.ADVISOR) {
                String advSec = user.getSection();
                if (advSec == null || advSec.trim().isEmpty()) {
                    advSec = OdService.getSectionForAdvisor(user.getIdentifier());
                }
                if (advSec != null && req.getSection() != null && !OdService.isSameSection(advSec, req.getSection())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied: Request belongs to another class section."));
                }
            }
            return ResponseEntity.ok(req);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(ex));
        }
    }

    @PostMapping("/{id}/advisor-action")
    public ResponseEntity<?> advisorAction(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.ADVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Only Class Advisors can perform this action"));
            }
            String sec = user.getSection();
            if (sec == null || sec.trim().isEmpty()) {
                String cleanId = user.getIdentifier() != null ? user.getIdentifier().trim().toLowerCase() : "";
                if (cleanId.contains("dhivya") || cleanId.contains("divya")) sec = "CSE-B";
                else if (cleanId.contains("raja") || cleanId.contains("jayapriya")) sec = "CSE-C";
                else sec = "CSE-A";
            }
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String reason = (String) body.get("reason");
            OdRequest updated = odService.advisorAction(id, user.getIdentifier(), user.getName(), sec, approved, reason);
            return ResponseEntity.ok(updated);
        } catch (SecurityException sex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(sex));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }

    @PostMapping("/{id}/hod-action")
    public ResponseEntity<?> hodAction(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.HOD) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Only HOD can perform this action"));
            }
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String reason = (String) body.get("reason");
            OdRequest updated = odService.hodAction(id, user.getIdentifier(), user.getName(), approved, reason);
            return ResponseEntity.ok(updated);
        } catch (SecurityException sex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(sex));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }

    @PostMapping("/{id}/principal-action")
    public ResponseEntity<?> principalAction(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Only Principal can perform this action"));
            }
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String reason = (String) body.get("reason");
            OdRequest updated = odService.principalAction(id, user.getIdentifier(), user.getName(), approved, reason);
            return ResponseEntity.ok(updated);
        } catch (SecurityException sex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(sex));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadPdf(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            OdRequest req = odService.getRequestById(id);
            if (req == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Request not found"));

            // Authorization: Only the student themselves or authorized staff can download
            if (user.getRole() == UserRole.STUDENT && !req.getRegNo().equals(user.getIdentifier())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
            }
            if (user.getRole() == UserRole.ADVISOR) {
                String advSec = user.getSection();
                if (advSec == null || advSec.trim().isEmpty()) {
                    advSec = OdService.getSectionForAdvisor(user.getIdentifier());
                }
                if (advSec != null && req.getSection() != null && !OdService.isSameSection(advSec, req.getSection())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Access denied"));
                }
            }

            byte[] pdfBytes = pdfService.generateApprovedPdf(req);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex));
        }
    }
}