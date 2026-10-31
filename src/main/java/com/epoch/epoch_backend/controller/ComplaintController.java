package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.ComplaintStatus;
import com.epoch.epoch_backend.model.StudentComplaint;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.ComplaintService;
import com.epoch.epoch_backend.service.PdfGenerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final PdfGenerationService pdfService;

    public ComplaintController(ComplaintService complaintService, PdfGenerationService pdfService) {
        this.complaintService = complaintService;
        this.pdfService = pdfService;
    }

    private UserProfile getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserProfile p) {
            return p;
        }
        throw new SecurityException("User not authenticated");
    }

    @PostMapping({"", "/submit"})
    public ResponseEntity<?> submitComplaint(@RequestBody StudentComplaint complaint) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only students can submit complaints"));
            }
            StudentComplaint created = complaintService.submitComplaint(user.getIdentifier(), complaint);
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/student")
    public ResponseEntity<?> getStudentComplaints() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }
            List<StudentComplaint> list = complaintService.getStudentComplaints(user.getIdentifier());
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/principal")
    public ResponseEntity<?> getPrincipalComplaints() {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Only Principal can view student complaints."));
            }
            List<StudentComplaint> list = complaintService.getAllComplaintsForPrincipal();
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            StudentComplaint cmp = complaintService.getComplaintById(id);
            if (cmp == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Complaint not found"));
            if (user.getRole() == UserRole.STUDENT && !cmp.getRegNo().equals(user.getIdentifier())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }
            if (user.getRole() != UserRole.STUDENT && user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }
            return ResponseEntity.ok(cmp);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<?> principalRespond(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            UserProfile user = getCurrentUser();
            if (user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Only Principal can respond to complaints."));
            }
            String statusStr = body.getOrDefault("status", "RESOLVED");
            ComplaintStatus status = ComplaintStatus.valueOf(statusStr);
            String response = body.getOrDefault("response", "");
            StudentComplaint updated = complaintService.principalRespond(id, status, response);
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadComplaintPdf(@PathVariable String id) {
        try {
            UserProfile user = getCurrentUser();
            StudentComplaint cmp = complaintService.getComplaintById(id);
            if (cmp == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Complaint not found");

            // Authorization: Only the student themselves or the Principal can download
            if (user.getRole() == UserRole.STUDENT && (cmp.getRegNo() == null || !cmp.getRegNo().trim().equalsIgnoreCase(user.getIdentifier().trim()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }
            if (user.getRole() != UserRole.STUDENT && user.getRole() != UserRole.PRINCIPAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            byte[] pdfBytes = pdfService.generateComplaintPdf(cmp);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"EPOCH-CMP-" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "PDF generation failed"));
        }
    }
}