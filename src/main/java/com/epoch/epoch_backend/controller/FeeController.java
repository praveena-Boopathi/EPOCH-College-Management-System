package com.epoch.epoch_backend.controller;

import com.epoch.epoch_backend.model.*;
import com.epoch.epoch_backend.service.FeeService;
import com.epoch.epoch_backend.service.PdfGenerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Fees & Payments module has been removed from EPOCH.
// @RestController
// @RequestMapping("/api/fees")
public class FeeController {

    private final FeeService feeService;
    private final PdfGenerationService pdfGenerationService;

    public FeeController(FeeService feeService, PdfGenerationService pdfGenerationService) {
        this.feeService = feeService;
        this.pdfGenerationService = pdfGenerationService;
    }

    // ==================== Settings & Categories ====================

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(feeService.getSettings());
    }

    @RequestMapping(value = "/settings", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal UserProfile user, @RequestBody FeeSettings settings) {
        try {
            return ResponseEntity.ok(feeService.updateSettings(user, settings));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(feeService.getCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@AuthenticationPrincipal UserProfile user, @RequestBody FeeCategory category) {
        try {
            return ResponseEntity.ok(feeService.addCategory(user, category));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== Fee Assignments ====================

    @PostMapping("/assign")
    public ResponseEntity<?> assignFee(@AuthenticationPrincipal UserProfile user, @RequestBody FeeAssignment req) {
        try {
            return ResponseEntity.ok(feeService.assignFee(user, req));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/assign-bulk")
    public ResponseEntity<?> assignBulkFees(@AuthenticationPrincipal UserProfile user, @RequestBody Map<String, Object> req) {
        try {
            @SuppressWarnings("unchecked")
            List<String> studentIds = (List<String>) req.get("studentIds");
            String category = (String) req.get("category");
            String description = (String) req.get("description");
            double totalAmount = ((Number) req.get("totalAmount")).doubleValue();
            String dueDate = (String) req.get("dueDate");
            String installmentPlan = (String) req.get("installmentPlan");
            String paymentInstructions = (String) req.get("paymentInstructions");

            return ResponseEntity.ok(feeService.assignBulkFees(user, studentIds, category, description, totalAmount, dueDate, installmentPlan, paymentInstructions));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<?> updateFeeAssignment(@AuthenticationPrincipal UserProfile user,
                                                @PathVariable String id,
                                                @RequestBody Map<String, Object> body) {
        try {
            Double newAmount = body.containsKey("totalAmount") ? ((Number) body.get("totalAmount")).doubleValue() : null;
            String newDueDate = (String) body.get("dueDate");
            String newCategory = (String) body.get("category");
            String newDescription = (String) body.get("description");
            String newInstallmentPlan = (String) body.get("installmentPlan");
            String reason = (String) body.get("reason");
            return ResponseEntity.ok(feeService.updateFeeAssignment(user, id, newAmount, newDueDate, newCategory, newDescription, newInstallmentPlan, reason));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/my-fees")
    public ResponseEntity<?> getMyFees(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getFeesForStudent(user, user.getIdentifier()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentFees(@AuthenticationPrincipal UserProfile user, @PathVariable String studentId) {
        try {
            return ResponseEntity.ok(feeService.getFeesForStudent(user, studentId));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllFees(@AuthenticationPrincipal UserProfile user,
                                       @RequestParam(required = false) String section,
                                       @RequestParam(required = false) String category,
                                       @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(feeService.getAllFees(user, section, category, status));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/section-students")
    public ResponseEntity<?> getSectionStudents(@AuthenticationPrincipal UserProfile user,
                                                @RequestParam(required = false) String section) {
        try {
            return ResponseEntity.ok(feeService.getSectionStudentsWithFees(user, section));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== UPI Payment Submission ====================

    @PostMapping("/submit-payment")
    public ResponseEntity<?> submitPayment(@AuthenticationPrincipal UserProfile user, @RequestBody Map<String, Object> body) {
        try {
            String feeAssignmentId = (String) body.get("feeAssignmentId");
            double amount = ((Number) body.get("amount")).doubleValue();
            String utrNumber = (String) body.get("utrNumber");
            String screenshotUrl = (String) body.get("screenshotUrl");

            return ResponseEntity.ok(feeService.submitPayment(user, feeAssignmentId, amount, utrNumber, screenshotUrl));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== Payment Verification Queue (Admin) ====================

    @GetMapping("/payments/pending")
    public ResponseEntity<?> getPendingPayments(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getPendingPayments(user));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/payments/my-payments")
    public ResponseEntity<?> getMyPayments(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getPaymentsForStudent(user, user.getIdentifier()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/payments/student/{studentId}")
    public ResponseEntity<?> getStudentPayments(@AuthenticationPrincipal UserProfile user, @PathVariable String studentId) {
        try {
            return ResponseEntity.ok(feeService.getPaymentsForStudent(user, studentId));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/payments/{id}/verify")
    public ResponseEntity<?> verifyPayment(@AuthenticationPrincipal UserProfile user, @PathVariable String id) {
        try {
            FeeReceipt receipt = feeService.verifyPayment(user, id);
            return ResponseEntity.ok(receipt);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/payments/{id}/reject")
    public ResponseEntity<?> rejectPayment(@AuthenticationPrincipal UserProfile user,
                                          @PathVariable String id,
                                          @RequestBody Map<String, String> body) {
        try {
            String reason = body.get("reason");
            return ResponseEntity.ok(feeService.rejectPayment(user, id, reason));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== Receipts & PDF Downloads ====================

    @GetMapping("/receipts/{id}")
    public ResponseEntity<?> getReceipt(@AuthenticationPrincipal UserProfile user, @PathVariable String id) {
        try {
            return ResponseEntity.ok(feeService.getReceipt(user, id));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/receipts/{id}/pdf")
    public ResponseEntity<?> downloadReceiptPdf(@AuthenticationPrincipal UserProfile user, @PathVariable String id) {
        try {
            FeeReceipt receipt = feeService.getReceipt(user, id);
            byte[] pdfBytes = pdfGenerationService.generateFeeReceiptPdf(receipt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "EPOCH_Fee_Receipt_" + receipt.getId() + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to generate receipt PDF: " + ex.getMessage()));
        }
    }

    @GetMapping("/receipts/my-receipts")
    public ResponseEntity<?> getMyReceipts(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getReceiptsForStudent(user, user.getIdentifier()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/receipts/student/{studentId}")
    public ResponseEntity<?> getStudentReceipts(@AuthenticationPrincipal UserProfile user, @PathVariable String studentId) {
        try {
            return ResponseEntity.ok(feeService.getReceiptsForStudent(user, studentId));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ==================== Financial Summary & Audit Logs ====================

    @GetMapping("/admin-summary")
    public ResponseEntity<?> getAdminSummary(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getAdminDashboardSummary(user));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getFinancialSummary(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getFinancialSummary(user));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@AuthenticationPrincipal UserProfile user) {
        try {
            return ResponseEntity.ok(feeService.getAuditLogs(user));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
