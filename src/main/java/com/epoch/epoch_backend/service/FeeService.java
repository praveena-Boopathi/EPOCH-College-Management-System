package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.*;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FeeService {

    private final Firestore db;
    private final UserService userService;
    private final NotificationService notificationService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final Map<String, List<FeeAssignment>> inMemoryAssignments = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<String, List<FeePayment>> inMemoryPayments = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<String, List<FeeReceipt>> inMemoryReceipts = new java.util.concurrent.ConcurrentHashMap<>();

    public FeeService(Firestore db, UserService userService, NotificationService notificationService) {
        this.db = db;
        this.userService = userService;
        this.notificationService = notificationService;
        initDefaultFees();
    }

    private void initDefaultFees() {
        FeeAssignment f1 = new FeeAssignment();
        f1.setId("FEE-2026-001");
        f1.setStudentId("620823104002");
        f1.setStudentName("ABINAYA G");
        f1.setDepartment("Computer Science & Engineering");
        f1.setAcademicYear(UserService.CURRENT_ACADEMIC_YEAR);
        f1.setSection("CSE-A");
        f1.setCategory("Tuition Fee");
        f1.setDescription("Even Semester Tuition Fee 2026");
        f1.setTotalAmount(45000.0);
        f1.setAmountPaid(0.0);
        f1.setBalance(45000.0);
        f1.setStatus("UNPAID");
        f1.setAssignmentDate("20 Oct 2026");
        f1.setDueDate("15 Nov 2026");
        f1.setCreatedBy("Dr. S. K. Ramesh (Admin Officer)");
        f1.setCreatedAt(1729400000000L);
        f1.setUpdatedAt(1729400000000L);

        FeeAssignment f2 = new FeeAssignment();
        f2.setId("FEE-2026-002");
        f2.setStudentId("620823104015");
        f2.setStudentName("ARUNACHALAM M");
        f2.setDepartment("Computer Science & Engineering");
        f2.setAcademicYear(UserService.CURRENT_ACADEMIC_YEAR);
        f2.setSection("CSE-A");
        f2.setCategory("Examination Fee");
        f2.setDescription("Autonomous End-Semester Examination Fee 2026");
        f2.setTotalAmount(3500.0);
        f2.setAmountPaid(0.0);
        f2.setBalance(3500.0);
        f2.setStatus("UNPAID");
        f2.setAssignmentDate("22 Oct 2026");
        f2.setDueDate("10 Nov 2026");
        f2.setCreatedBy("Dr. S. K. Ramesh (Admin Officer)");
        f2.setCreatedAt(1729500000000L);
        f2.setUpdatedAt(1729500000000L);

        FeeAssignment f3 = new FeeAssignment();
        f3.setId("FEE-2026-003");
        f3.setStudentId("620823104066");
        f3.setStudentName("JANSI G");
        f3.setDepartment("Computer Science & Engineering");
        f3.setAcademicYear(UserService.CURRENT_ACADEMIC_YEAR);
        f3.setSection("CSE-B");
        f3.setCategory("Hostel & Mess Fee");
        f3.setDescription("Semester Hostel Accommodation & Mess Charges");
        f3.setTotalAmount(38000.0);
        f3.setAmountPaid(20000.0);
        f3.setBalance(18000.0);
        f3.setStatus("PARTIALLY_PAID");
        f3.setAssignmentDate("15 Oct 2026");
        f3.setDueDate("05 Nov 2026");
        f3.setCreatedBy("Dr. S. K. Ramesh (Admin Officer)");
        f3.setCreatedAt(1729200000000L);
        f3.setUpdatedAt(1729300000000L);

        FeeAssignment f4 = new FeeAssignment();
        f4.setId("FEE-2026-004");
        f4.setStudentId("620823104133");
        f4.setStudentName("PRAVEENA B");
        f4.setDepartment("Computer Science & Engineering");
        f4.setAcademicYear(UserService.CURRENT_ACADEMIC_YEAR);
        f4.setSection("CSE-C");
        f4.setCategory("Tuition Fee");
        f4.setDescription("Even Semester Tuition Fee 2026");
        f4.setTotalAmount(45000.0);
        f4.setAmountPaid(45000.0);
        f4.setBalance(0.0);
        f4.setStatus("PAID");
        f4.setAssignmentDate("10 Oct 2026");
        f4.setDueDate("30 Oct 2026");
        f4.setCreatedBy("Dr. S. K. Ramesh (Admin Officer)");
        f4.setCreatedAt(1729000000000L);
        f4.setUpdatedAt(1729100000000L);

        inMemoryAssignments.put("620823104002", new ArrayList<>(List.of(f1)));
        inMemoryAssignments.put("620823104015", new ArrayList<>(List.of(f2)));
        inMemoryAssignments.put("620823104066", new ArrayList<>(List.of(f3)));
        inMemoryAssignments.put("620823104133", new ArrayList<>(List.of(f4)));
    }

    // =========================================================================
    // 1. Fee Settings (Merchant UPI ID, College Details)
    // =========================================================================

    public FeeSettings getSettings() {
        try {
            DocumentSnapshot doc = db.collection("fee_settings").document("general").get().get();
            if (doc.exists()) {
                FeeSettings settings = doc.toObject(FeeSettings.class);
                if (settings != null) return settings;
            }
        } catch (Exception ignored) {}
        return new FeeSettings();
    }

    public FeeSettings updateSettings(UserProfile admin, FeeSettings settings) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can update payment settings.");
        }
        settings.setUpdatedAt(System.currentTimeMillis());
        settings.setUpdatedBy(admin.getName());
        db.collection("fee_settings").document("general").set(settings).get();

        recordAuditLog("UPDATE_SETTINGS", "general", null, admin, "Updated college merchant UPI payment settings.");
        return settings;
    }

    // =========================================================================
    // 2. Fee Categories
    // =========================================================================

    public List<FeeCategory> getCategories() {
        try {
            var snap = db.collection("fee_categories").get().get();
            if (!snap.isEmpty()) {
                List<FeeCategory> list = new ArrayList<>();
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    FeeCategory cat = doc.toObject(FeeCategory.class);
                    if (cat != null) list.add(cat);
                }
                return list;
            }
        } catch (Exception ignored) {}

        // Default categories
        return List.of(
                new FeeCategory("TUITION", "Tuition Fee", "Semester tuition and instructional charges", true),
                new FeeCategory("EXAMINATION", "Examination Fee", "Autonomous end-semester theory and practical exams", true),
                new FeeCategory("HOSTEL", "Hostel & Mess Fee", "Campus accommodation, boarding and utilities", true),
                new FeeCategory("TRANSPORT", "Transport Fee", "Institutional bus transport routes", true),
                new FeeCategory("OTHER", "Other College Fee", "Library, laboratory, and special development fees", true)
        );
    }

    public FeeCategory addCategory(UserProfile admin, FeeCategory category) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can add fee categories.");
        }
        if (category.getId() == null || category.getId().trim().isEmpty()) {
            category.setId(category.getName().toUpperCase().replaceAll("[^A-Z0-9]", "_"));
        }
        db.collection("fee_categories").document(category.getId()).set(category).get();
        recordAuditLog("ADD_CATEGORY", category.getId(), null, admin, "Added new fee category: " + category.getName());
        return category;
    }

    // =========================================================================
    // 3. Fee Assignments (Single & Bulk)
    // =========================================================================

    public FeeAssignment assignFee(UserProfile admin, FeeAssignment assignment) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can assign fees.");
        }
        if (assignment.getStudentId() == null || assignment.getStudentId().trim().isEmpty()) {
            throw new IllegalArgumentException("Student registration number is required.");
        }
        if (assignment.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Fee amount must be greater than zero.");
        }

        UserProfile student = userService.findStudent(assignment.getStudentId().trim());
        if (student == null) {
            throw new IllegalArgumentException("Student not found for registration number: " + assignment.getStudentId());
        }

        String feeId = "FEE-" + System.currentTimeMillis() + "-" + (int)(1000 + Math.random() * 9000);
        long now = System.currentTimeMillis();
        String formattedNow = LocalDateTime.now().format(dateOnlyFormatter);

        assignment.setId(feeId);
        assignment.setStudentId(student.getIdentifier());
        assignment.setStudentName(student.getName());
        assignment.setDepartment(student.getDepartment() != null ? student.getDepartment() : "CSE");
        assignment.setAcademicYear(student.getAcademicYear() != null ? student.getAcademicYear() : UserService.CURRENT_ACADEMIC_YEAR);
        assignment.setSection(student.getSection() != null ? student.getSection() : "CSE-A");
        assignment.setAmountPaid(0.0);
        assignment.setBalance(assignment.getTotalAmount());
        assignment.setStatus("UNPAID");
        assignment.setAssignmentDate(formattedNow);
        if (assignment.getDueDate() == null || assignment.getDueDate().trim().isEmpty()) {
            assignment.setDueDate(LocalDateTime.now().plusDays(30).format(dateOnlyFormatter));
        }
        assignment.setCreatedBy(admin.getName());
        assignment.setCreatedAt(now);
        assignment.setUpdatedAt(now);

        Map<String, Object> initialAudit = new HashMap<>();
        initialAudit.put("action", "ASSIGNED");
        initialAudit.put("amount", assignment.getTotalAmount());
        initialAudit.put("changedBy", admin.getName());
        initialAudit.put("timestamp", LocalDateTime.now().format(formatter));
        initialAudit.put("reason", "Initial fee assignment");
        assignment.getAuditHistory().add(initialAudit);

        inMemoryAssignments.computeIfAbsent(student.getIdentifier(), k -> new ArrayList<>()).add(assignment);
        try {
            db.collection("fee_assignments").document(feeId).set(assignment).get();
        } catch (Exception ex) {
            System.err.println("[FeeService] Firestore assignFee write error: " + ex.getMessage());
        }

        // Notify Student
        notificationService.createNotification(
                student.getIdentifier(),
                "New Fee Assigned: " + assignment.getCategory(),
                "A college fee of ₹" + String.format("%.2f", assignment.getTotalAmount()) + " has been assigned. Due date: " + assignment.getDueDate(),
                "FEE_ASSIGNED",
                feeId,
                null,
                "ACCOUNTS",
                "Fee Operations",
                "Dr. S. K. Ramesh",
                "Accounts Officer"
        );

        recordAuditLog("ASSIGN_FEE", feeId, student.getIdentifier(), admin,
                "Assigned " + assignment.getCategory() + " fee of ₹" + assignment.getTotalAmount() + " to " + student.getName());

        return assignment;
    }

    public List<FeeAssignment> assignBulkFees(UserProfile admin, List<String> studentIds, String category,
                                             String description, double totalAmount, String dueDate,
                                             String installmentPlan, String paymentInstructions) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can assign bulk fees.");
        }
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("At least one student must be selected.");
        }
        if (totalAmount <= 0) {
            throw new IllegalArgumentException("Fee amount must be greater than zero.");
        }

        List<FeeAssignment> created = new ArrayList<>();
        for (String sId : studentIds) {
            try {
                UserProfile student = userService.findStudent(sId.trim());
                if (student == null) continue;

                // Check for duplicate active assignment with same category and description
                var dupCheck = db.collection("fee_assignments")
                        .whereEqualTo("studentId", student.getIdentifier())
                        .whereEqualTo("category", category)
                        .whereEqualTo("description", description)
                        .get().get();
                if (!dupCheck.isEmpty()) {
                    continue; // Skip duplicate assignment for this student
                }

                FeeAssignment fa = new FeeAssignment();
                fa.setStudentId(student.getIdentifier());
                fa.setCategory(category);
                fa.setDescription(description);
                fa.setTotalAmount(totalAmount);
                fa.setDueDate(dueDate);
                fa.setInstallmentPlan(installmentPlan);
                fa.setPaymentInstructions(paymentInstructions);

                FeeAssignment saved = assignFee(admin, fa);
                created.add(saved);
            } catch (Exception ex) {
                System.err.println("Bulk assignment error for student " + sId + ": " + ex.getMessage());
            }
        }

        recordAuditLog("BULK_ASSIGN_FEES", null, null, admin,
                "Bulk assigned " + category + " fee of ₹" + totalAmount + " to " + created.size() + " students.");

        return created;
    }

    public FeeAssignment updateFeeAssignment(UserProfile admin, String feeId, Double newAmount,
                                            String newDueDate, String newCategory, String newDescription,
                                            String newInstallmentPlan, String reason) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can modify fees.");
        }
        DocumentReference ref = db.collection("fee_assignments").document(feeId);
        DocumentSnapshot snap = ref.get().get();
        if (!snap.exists()) {
            throw new IllegalArgumentException("Fee assignment not found: " + feeId);
        }

        FeeAssignment fa = snap.toObject(FeeAssignment.class);
        if (fa == null) throw new IllegalArgumentException("Corrupt fee record");

        double prevAmount = fa.getTotalAmount();
        String prevDueDate = fa.getDueDate();
        String prevCategory = fa.getCategory();
        String prevInstallment = fa.getInstallmentPlan();
        long now = System.currentTimeMillis();

        if (newAmount != null && newAmount > 0) {
            if (newAmount < fa.getAmountPaid()) {
                throw new IllegalArgumentException("New total amount (₹" + newAmount + ") cannot be less than already confirmed paid amount (₹" + fa.getAmountPaid() + ").");
            }
            fa.setTotalAmount(newAmount);
            fa.setBalance(newAmount - fa.getAmountPaid());
            if (fa.getBalance() <= 0.01) {
                fa.setStatus("PAID");
            } else if (fa.getAmountPaid() > 0) {
                fa.setStatus("PARTIALLY_PAID");
            } else {
                fa.setStatus("UNPAID");
            }
        }

        if (newDueDate != null && !newDueDate.trim().isEmpty()) {
            fa.setDueDate(newDueDate.trim());
        }

        if (newCategory != null && !newCategory.trim().isEmpty()) {
            fa.setCategory(newCategory.trim());
        }

        if (newDescription != null && !newDescription.trim().isEmpty()) {
            fa.setDescription(newDescription.trim());
        }

        if (newInstallmentPlan != null && !newInstallmentPlan.trim().isEmpty()) {
            fa.setInstallmentPlan(newInstallmentPlan.trim());
        }

        fa.setUpdatedAt(now);

        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("action", "MODIFIED");
        auditEntry.put("previousAmount", prevAmount);
        auditEntry.put("newAmount", fa.getTotalAmount());
        auditEntry.put("previousDueDate", prevDueDate);
        auditEntry.put("newDueDate", fa.getDueDate());
        auditEntry.put("previousCategory", prevCategory);
        auditEntry.put("newCategory", fa.getCategory());
        auditEntry.put("previousInstallmentPlan", prevInstallment);
        auditEntry.put("newInstallmentPlan", fa.getInstallmentPlan());
        auditEntry.put("changedBy", admin.getName());
        auditEntry.put("adminId", admin.getIdentifier());
        auditEntry.put("timestamp", LocalDateTime.now().format(formatter));
        auditEntry.put("reason", reason != null ? reason : "Administrative revision");
        fa.getAuditHistory().add(auditEntry);

        ref.set(fa).get();

        // Notify Student
        notificationService.createNotification(
                fa.getStudentId(),
                "Fee Revised: " + fa.getCategory(),
                "Your " + fa.getCategory() + " fee has been revised to ₹" + String.format("%.2f", fa.getTotalAmount()) +
                        ". Balance: ₹" + String.format("%.2f", fa.getBalance()) + ". Reason: " + (reason != null ? reason : "Administrative update."),
                "FEE_REVISED",
                feeId,
                null,
                "ACCOUNTS",
                "Fee Operations",
                "Dr. S. K. Ramesh",
                "Accounts Officer"
        );

        recordAuditLog("UPDATE_FEE", feeId, fa.getStudentId(), admin,
                "Revised " + fa.getCategory() + " fee for student " + fa.getStudentId() + " from ₹" + prevAmount + " to ₹" + fa.getTotalAmount() + ". Reason: " + reason);

        return fa;
    }

    public FeeAssignment updateFeeAssignment(UserProfile admin, String feeId, Double newAmount, String newDueDate, String reason) throws ExecutionException, InterruptedException {
        return updateFeeAssignment(admin, feeId, newAmount, newDueDate, null, null, null, reason);
    }

    // =========================================================================
    // 4. Queries (Student, Section, Department, All)
    // =========================================================================

    public List<FeeAssignment> getFeesForStudent(UserProfile user, String studentId) throws ExecutionException, InterruptedException {
        // Enforce strict access control
        boolean isOwner = user.getRole() == UserRole.STUDENT && user.getIdentifier().equalsIgnoreCase(studentId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isAdvisor = user.getRole() == UserRole.ADVISOR;
        boolean isHod = user.getRole() == UserRole.HOD;
        boolean isPrincipal = user.getRole() == UserRole.PRINCIPAL;

        if (!isOwner && !isAdmin && !isAdvisor && !isHod && !isPrincipal) {
            throw new SecurityException("Unauthorized: You do not have permission to view fees for this student.");
        }

        List<FeeAssignment> list = new ArrayList<>();
        try {
            var snap = db.collection("fee_assignments")
                    .whereEqualTo("studentId", studentId)
                    .get().get();

            for (DocumentSnapshot doc : snap.getDocuments()) {
                FeeAssignment fa = doc.toObject(FeeAssignment.class);
                if (fa != null) list.add(fa);
            }
        } catch (Exception ex) {
            System.err.println("[FeeService] getFeesForStudent Firestore error: " + ex.getMessage());
        }

        // Merge in-memory assignments
        List<FeeAssignment> mem = inMemoryAssignments.get(studentId.trim());
        if (mem != null) {
            for (FeeAssignment m : mem) {
                if (list.stream().noneMatch(x -> x.getId().equals(m.getId()))) {
                    list.add(m);
                }
            }
        }

        list.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
        return list;
    }

    public List<FeeAssignment> getAllFees(UserProfile user, String section, String category, String status) throws ExecutionException, InterruptedException {
        if (user.getRole() == UserRole.STUDENT) {
            throw new SecurityException("Unauthorized: Students cannot access administrative fee listings.");
        }

        var query = db.collection("fee_assignments");
        var snap = query.get().get();

        List<FeeAssignment> list = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            FeeAssignment fa = doc.toObject(FeeAssignment.class);
            if (fa == null) continue;

            // Class advisor jurisdiction filter
            if (user.getRole() == UserRole.ADVISOR && user.getSection() != null) {
                if (!user.getSection().equalsIgnoreCase(fa.getSection())) {
                    continue;
                }
            }

            // Filters
            if (section != null && !section.equalsIgnoreCase("ALL") && !section.equalsIgnoreCase(fa.getSection())) {
                continue;
            }
            if (category != null && !category.equalsIgnoreCase("ALL") && !category.equalsIgnoreCase(fa.getCategory())) {
                continue;
            }
            if (status != null && !status.equalsIgnoreCase("ALL") && !status.equalsIgnoreCase(fa.getStatus())) {
                continue;
            }

            list.add(fa);
        }
        list.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
        return list;
    }

    public List<Map<String, Object>> getSectionStudentsWithFees(UserProfile user, String requestedSection) throws ExecutionException, InterruptedException {
        // Enforce role-based security
        String targetSection = requestedSection;
        if (user.getRole() == UserRole.ADVISOR) {
            String advisorSec = user.getSection() != null ? user.getSection().trim() : "CSE-A";
            // Advisor can strictly only view their assigned section
            targetSection = advisorSec;
        } else if (user.getRole() == UserRole.STUDENT) {
            throw new SecurityException("Unauthorized: Students cannot view section fee directories.");
        } else if (targetSection == null || targetSection.trim().isEmpty() || "ALL".equalsIgnoreCase(targetSection)) {
            targetSection = "CSE-A";
        }

        Map<String, List<FeeAssignment>> feesByStudent = new HashMap<>();
        Map<String, List<FeeReceipt>> receiptsByStudent = new HashMap<>();
        Map<String, List<FeePayment>> paymentsByStudent = new HashMap<>();
        List<? extends DocumentSnapshot> studentDocs = null;

        try {
            // 1. Fetch all authoritative students in this section from Firestore
            var studentSnap = db.collection("students")
                    .whereEqualTo("section", targetSection)
                    .get().get();
            studentDocs = studentSnap.getDocuments();

            // 2. Fetch all fee assignments for this section
            var feeSnap = db.collection("fee_assignments")
                    .whereEqualTo("section", targetSection)
                    .get().get();

            for (DocumentSnapshot doc : feeSnap.getDocuments()) {
                FeeAssignment fa = doc.toObject(FeeAssignment.class);
                if (fa != null && fa.getStudentId() != null) {
                    feesByStudent.computeIfAbsent(fa.getStudentId().trim(), k -> new ArrayList<>()).add(fa);
                }
            }

            // 3. Fetch all confirmed receipts for this section
            var receiptSnap = db.collection("fee_receipts")
                    .whereEqualTo("section", targetSection)
                    .get().get();

            for (DocumentSnapshot doc : receiptSnap.getDocuments()) {
                FeeReceipt rcpt = doc.toObject(FeeReceipt.class);
                if (rcpt != null && rcpt.getStudentId() != null) {
                    receiptsByStudent.computeIfAbsent(rcpt.getStudentId().trim(), k -> new ArrayList<>()).add(rcpt);
                }
            }

            // 4. Fetch all payments for this section (to get last payment date and pending status)
            var paySnap = db.collection("fee_payments")
                    .whereEqualTo("section", targetSection)
                    .get().get();

            for (DocumentSnapshot doc : paySnap.getDocuments()) {
                FeePayment p = doc.toObject(FeePayment.class);
                if (p != null && p.getStudentId() != null) {
                    paymentsByStudent.computeIfAbsent(p.getStudentId().trim(), k -> new ArrayList<>()).add(p);
                }
            }
        } catch (Exception ex) {
            System.err.println("[FeeService] Firestore error in getSectionStudentsWithFees: " + ex.getMessage() + ". Using InstitutionalRoster fallback.");
            studentDocs = null;
        }

        // Merge in-memory assignments
        for (Map.Entry<String, List<FeeAssignment>> entry : inMemoryAssignments.entrySet()) {
            List<FeeAssignment> existing = feesByStudent.computeIfAbsent(entry.getKey(), k -> new ArrayList<>());
            for (FeeAssignment m : entry.getValue()) {
                if (targetSection.equalsIgnoreCase(m.getSection()) && existing.stream().noneMatch(x -> x.getId().equals(m.getId()))) {
                    existing.add(m);
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();

        if (studentDocs != null && !studentDocs.isEmpty()) {
            for (DocumentSnapshot sDoc : studentDocs) {
                String regNo = sDoc.getString("regNo") != null ? sDoc.getString("regNo") : sDoc.getId();
                String name = sDoc.getString("name");
                String dept = sDoc.getString("dept") != null ? sDoc.getString("dept") : "CSE";
                String section = sDoc.getString("section") != null ? sDoc.getString("section") : targetSection;
                String academicYear = sDoc.getString("academicYear") != null ? sDoc.getString("academicYear") : UserService.CURRENT_ACADEMIC_YEAR;
                String email = sDoc.getString("email");

                result.add(buildStudentFeeRow(regNo, name, dept, section, academicYear, email, feesByStudent, receiptsByStudent, paymentsByStudent));
            }
        } else {
            // Authoritative Institutional Roster (CSE-A: 61, CSE-B: 62, CSE-C: 52)
            List<UserProfile> rosterStudents = InstitutionalRoster.getStudentsForSection(targetSection);
            for (UserProfile st : rosterStudents) {
                result.add(buildStudentFeeRow(st.getIdentifier(), st.getName(), st.getDepartment(), targetSection, st.getAcademicYear(), st.getEmail(), feesByStudent, receiptsByStudent, paymentsByStudent));
            }
        }

        // Sort alphabetically by student registration number
        result.sort((a, b) -> ((String) a.get("studentId")).compareTo((String) b.get("studentId")));

        return result;
    }

    private Map<String, Object> buildStudentFeeRow(String regNo, String name, String dept, String section,
                                                  String academicYear, String email,
                                                  Map<String, List<FeeAssignment>> feesByStudent,
                                                  Map<String, List<FeeReceipt>> receiptsByStudent,
                                                  Map<String, List<FeePayment>> paymentsByStudent) {
        List<FeeAssignment> studentAssignments = feesByStudent.getOrDefault(regNo.trim(), Collections.emptyList());
        List<FeeReceipt> studentReceipts = receiptsByStudent.getOrDefault(regNo.trim(), Collections.emptyList());
        List<FeePayment> studentPayments = paymentsByStudent.getOrDefault(regNo.trim(), Collections.emptyList());

        double totalAssigned = 0.0;
        double totalPaid = 0.0;
        double balance = 0.0;
        String nearestDueDate = "-";
        boolean hasPendingVerification = false;
        List<String> categoriesList = new ArrayList<>();

        for (FeeAssignment fa : studentAssignments) {
            totalAssigned += fa.getTotalAmount();
            totalPaid += fa.getAmountPaid();
            balance += fa.getBalance();
            if (fa.getCategory() != null && !categoriesList.contains(fa.getCategory())) {
                categoriesList.add(fa.getCategory());
            }
            if (fa.getBalance() > 0 && fa.getDueDate() != null && !fa.getDueDate().isEmpty()) {
                if ("-".equals(nearestDueDate) || fa.getDueDate().compareTo(nearestDueDate) < 0) {
                    nearestDueDate = fa.getDueDate();
                }
            }
            if ("PENDING_VERIFICATION".equalsIgnoreCase(fa.getStatus())) {
                hasPendingVerification = true;
            }
        }

        for (FeePayment p : studentPayments) {
            if ("PENDING_VERIFICATION".equalsIgnoreCase(p.getStatus())) {
                hasPendingVerification = true;
            }
        }

        String paymentStatus;
        if (studentAssignments.isEmpty()) {
            paymentStatus = "NO_FEES";
        } else if (hasPendingVerification) {
            paymentStatus = "PENDING_VERIFICATION";
        } else if (balance <= 0.01 && totalPaid > 0) {
            paymentStatus = "PAID";
        } else if (totalPaid > 0) {
            paymentStatus = "PARTIALLY_PAID";
        } else {
            paymentStatus = "UNPAID";
        }

        String lastPaymentDate = "-";
        long latestPayTime = 0;
        for (FeePayment p : studentPayments) {
            if (p.getSubmittedAt() > latestPayTime) {
                latestPayTime = p.getSubmittedAt();
                lastPaymentDate = p.getPaymentDate() != null ? p.getPaymentDate() : "-";
            }
        }

        String advisorName = "Mrs. P. Arularasi";
        if ("CSE-B".equalsIgnoreCase(section)) {
            advisorName = "Dr. Divyabharathi";
        } else if ("CSE-C".equalsIgnoreCase(section)) {
            advisorName = "Mrs. Rajavathi Jayapriya";
        }

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("studentId", regNo);
        row.put("studentName", name);
        row.put("department", dept != null ? dept : "CSE");
        row.put("section", section);
        row.put("academicYear", academicYear != null ? academicYear : UserService.CURRENT_ACADEMIC_YEAR);
        row.put("advisorName", advisorName);
        row.put("email", email);
        row.put("totalAssigned", totalAssigned);
        row.put("amountPaid", totalPaid);
        row.put("balance", balance);
        row.put("dueDate", nearestDueDate);
        row.put("status", paymentStatus);
        row.put("lastPaymentDate", lastPaymentDate);
        row.put("categories", categoriesList);
        row.put("categorySummary", categoriesList.isEmpty() ? "None" : String.join(", ", categoriesList));
        row.put("feeAssignments", studentAssignments);
        row.put("receiptCount", studentReceipts.size());
        row.put("receipts", studentReceipts);

        return row;
    }

    // =========================================================================
    // 5. UPI QR Payment Submission
    // =========================================================================

    public FeePayment submitPayment(UserProfile student, String feeAssignmentId, double amount,
                                   String utrNumber, String screenshotUrl) throws ExecutionException, InterruptedException {
        if (student.getRole() != UserRole.STUDENT) {
            throw new SecurityException("Unauthorized: Only authenticated students can submit fee payments.");
        }

        if (utrNumber == null || utrNumber.trim().length() < 6) {
            throw new IllegalArgumentException("A valid UPI UTR / Transaction Reference Number (minimum 6 characters) is required.");
        }
        String cleanUtr = utrNumber.trim().toUpperCase();

        // 1. Prevent duplicate UTR across all payments
        var dupUtrSnap = db.collection("fee_payments")
                .whereEqualTo("utrNumber", cleanUtr)
                .get().get();
        for (DocumentSnapshot doc : dupUtrSnap.getDocuments()) {
            FeePayment existing = doc.toObject(FeePayment.class);
            if (existing != null && !"REJECTED".equalsIgnoreCase(existing.getStatus())) {
                throw new IllegalArgumentException("This UTR / Transaction reference (" + cleanUtr + ") has already been submitted. Duplicate references are rejected.");
            }
        }

        // 2. Validate fee assignment exists and belongs to this student
        DocumentReference feeRef = db.collection("fee_assignments").document(feeAssignmentId);
        DocumentSnapshot feeSnap = feeRef.get().get();
        if (!feeSnap.exists()) {
            throw new IllegalArgumentException("Fee assignment not found: " + feeAssignmentId);
        }

        FeeAssignment fa = feeSnap.toObject(FeeAssignment.class);
        if (fa == null || !student.getIdentifier().equalsIgnoreCase(fa.getStudentId())) {
            throw new SecurityException("Unauthorized: This fee does not belong to your student account.");
        }

        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        if (amount > fa.getBalance() + 0.01) {
            throw new IllegalArgumentException("Payment amount (₹" + amount + ") cannot exceed the remaining balance of ₹" + fa.getBalance());
        }

        String paymentId = "PAY-" + System.currentTimeMillis() + "-" + (int)(1000 + Math.random() * 9000);
        long now = System.currentTimeMillis();
        String formattedNow = LocalDateTime.now().format(formatter);

        FeePayment payment = new FeePayment();
        payment.setId(paymentId);
        payment.setFeeAssignmentId(feeAssignmentId);
        payment.setStudentId(student.getIdentifier());
        payment.setStudentName(student.getName());
        payment.setDepartment(student.getDepartment() != null ? student.getDepartment() : "CSE");
        payment.setSection(student.getSection() != null ? student.getSection() : "CSE-A");
        payment.setCategory(fa.getCategory());
        payment.setAmount(amount);
        payment.setUtrNumber(cleanUtr);
        payment.setScreenshotUrl(screenshotUrl);
        payment.setStatus("PENDING_VERIFICATION");
        payment.setPaymentDate(formattedNow);
        payment.setSubmittedAt(now);

        db.collection("fee_payments").document(paymentId).set(payment).get();

        // Update assignment status to PENDING_VERIFICATION
        fa.setStatus("PENDING_VERIFICATION");
        fa.setUpdatedAt(now);
        feeRef.set(fa).get();

        // Notify Admin
        notificationService.createNotification(
                "admin",
                "New UPI Payment Submitted: ₹" + amount,
                student.getName() + " (" + student.getIdentifier() + ") submitted UPI payment for " + fa.getCategory() + ". UTR: " + cleanUtr + ". Verification required.",
                "PAYMENT_SUBMITTED",
                paymentId,
                null,
                "ADMIN"
        );

        recordAuditLog("SUBMIT_PAYMENT", paymentId, student.getIdentifier(), student,
                "Submitted UPI payment of ₹" + amount + " with UTR: " + cleanUtr + " for " + fa.getCategory());

        return payment;
    }

    // =========================================================================
    // 6. Payment Verification & Rejection (Admin Directorate)
    // =========================================================================

    public FeeReceipt verifyPayment(UserProfile admin, String paymentId) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can verify and confirm fee payments.");
        }

        DocumentReference payRef = db.collection("fee_payments").document(paymentId);
        DocumentSnapshot paySnap = payRef.get().get();
        if (!paySnap.exists()) {
            throw new IllegalArgumentException("Payment record not found: " + paymentId);
        }

        FeePayment payment = paySnap.toObject(FeePayment.class);
        if (payment == null) throw new IllegalArgumentException("Corrupt payment record");

        if ("CONFIRMED".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("This payment is already verified and confirmed.");
        }

        DocumentReference feeRef = db.collection("fee_assignments").document(payment.getFeeAssignmentId());
        DocumentSnapshot feeSnap = feeRef.get().get();
        if (!feeSnap.exists()) {
            throw new IllegalArgumentException("Associated fee assignment not found: " + payment.getFeeAssignmentId());
        }

        FeeAssignment fa = feeSnap.toObject(FeeAssignment.class);
        if (fa == null) throw new IllegalArgumentException("Corrupt fee assignment record");

        long now = System.currentTimeMillis();
        String formattedNow = LocalDateTime.now().format(formatter);

        // 1. Atomically update balances
        double newAmountPaid = fa.getAmountPaid() + payment.getAmount();
        double newBalance = Math.max(0.0, fa.getTotalAmount() - newAmountPaid);

        fa.setAmountPaid(newAmountPaid);
        fa.setBalance(newBalance);
        fa.setStatus(newBalance <= 0.01 ? "PAID" : "PARTIALLY_PAID");
        fa.setUpdatedAt(now);

        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("action", "PAYMENT_CONFIRMED");
        auditEntry.put("amount", payment.getAmount());
        auditEntry.put("utr", payment.getUtrNumber());
        auditEntry.put("verifiedBy", admin.getName());
        auditEntry.put("timestamp", formattedNow);
        fa.getAuditHistory().add(auditEntry);

        feeRef.set(fa).get();

        // 2. Generate Official Receipt
        String receiptId = "RCPT-" + LocalDateTime.now().getYear() + "-" + payment.getStudentId() + "-" + (int)(100 + Math.random() * 900);
        FeeReceipt receipt = new FeeReceipt();
        receipt.setId(receiptId);
        receipt.setPaymentId(paymentId);
        receipt.setFeeAssignmentId(fa.getId());
        receipt.setStudentId(payment.getStudentId());
        receipt.setStudentName(payment.getStudentName());
        receipt.setDepartment(payment.getDepartment());
        receipt.setAcademicYear(fa.getAcademicYear());
        receipt.setSection(payment.getSection());
        receipt.setCategory(payment.getCategory());
        receipt.setDescription(fa.getDescription());
        receipt.setAmountReceived(payment.getAmount());
        receipt.setRemainingBalance(newBalance);
        receipt.setPaymentMode("UPI QR (Online)");
        receipt.setUtrNumber(payment.getUtrNumber());
        receipt.setPaymentDate(payment.getPaymentDate());
        receipt.setVerifiedDate(formattedNow);
        receipt.setVerifiedBy(admin.getName() + " (Accounts Directorate)");
        receipt.setGeneratedAt(now);

        db.collection("fee_receipts").document(receiptId).set(receipt).get();

        // 3. Update payment status to CONFIRMED
        payment.setStatus("CONFIRMED");
        payment.setVerifiedBy(admin.getName());
        payment.setVerifiedAt(formattedNow);
        payment.setReceiptId(receiptId);
        payRef.set(payment).get();

        // 4. Notify Student with Receipt details
        notificationService.createNotification(
                payment.getStudentId(),
                "Payment Confirmed: ₹" + String.format("%.2f", payment.getAmount()),
                "Your payment for " + payment.getCategory() + " (UTR: " + payment.getUtrNumber() +
                        ") is verified. Receipt " + receiptId + " is now available for download.",
                "PAYMENT_CONFIRMED",
                receiptId,
                null,
                "ACCOUNTS",
                "Fee Operations",
                "Dr. S. K. Ramesh",
                "Accounts Officer"
        );

        // 5. Notify assigned Class Advisor automatically with complete receipt details
        String advisorId = OdService.getAdvisorForSection(payment.getSection());
        if (advisorId != null) {
            String advisorMsg = String.format("Verified fee receipt issued for %s (%s, %s). Amount received: ₹%.2f for %s (UTR: %s). Confirmation Date: %s. Receipt ID: %s.",
                    payment.getStudentName(), payment.getStudentId(), payment.getSection(),
                    payment.getAmount(), payment.getCategory(), payment.getUtrNumber(),
                    formattedNow, receiptId);

            notificationService.createNotification(
                    advisorId,
                    "Official Receipt: " + payment.getStudentName() + " (" + payment.getSection() + ")",
                    advisorMsg,
                    "ADVISOR_RECEIPT_DELIVERY",
                    receiptId,
                    null,
                    "ACCOUNTS",
                    "Fee Operations",
                    "Dr. S. K. Ramesh",
                    "Accounts Officer"
            );
            if ("divyabharathi".equalsIgnoreCase(advisorId) || "dhivyabharathi".equalsIgnoreCase(advisorId)) {
                notificationService.createNotification(
                        "dhivyabharathi",
                        "Official Receipt: " + payment.getStudentName() + " (" + payment.getSection() + ")",
                        advisorMsg,
                        "ADVISOR_RECEIPT_DELIVERY",
                        receiptId,
                        null,
                        "ACCOUNTS",
                        "Fee Operations",
                        "Dr. S. K. Ramesh",
                        "Accounts Officer"
                );
            }
        }

        recordAuditLog("VERIFY_PAYMENT", paymentId, payment.getStudentId(), admin,
                "Verified UPI payment of ₹" + payment.getAmount() + " (UTR: " + payment.getUtrNumber() + "). Issued receipt: " + receiptId);

        return receipt;
    }

    public FeePayment rejectPayment(UserProfile admin, String paymentId, String reason) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can reject fee payments.");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A specific rejection reason is mandatory.");
        }

        DocumentReference payRef = db.collection("fee_payments").document(paymentId);
        DocumentSnapshot paySnap = payRef.get().get();
        if (!paySnap.exists()) {
            throw new IllegalArgumentException("Payment record not found: " + paymentId);
        }

        FeePayment payment = paySnap.toObject(FeePayment.class);
        if (payment == null) throw new IllegalArgumentException("Corrupt payment record");

        if ("CONFIRMED".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("Cannot reject an already confirmed payment.");
        }

        long now = System.currentTimeMillis();
        String formattedNow = LocalDateTime.now().format(formatter);

        payment.setStatus("REJECTED");
        payment.setRejectionReason(reason.trim());
        payment.setVerifiedBy(admin.getName());
        payment.setVerifiedAt(formattedNow);
        payRef.set(payment).get();

        // Restore fee assignment status
        DocumentReference feeRef = db.collection("fee_assignments").document(payment.getFeeAssignmentId());
        DocumentSnapshot feeSnap = feeRef.get().get();
        if (feeSnap.exists()) {
            FeeAssignment fa = feeSnap.toObject(FeeAssignment.class);
            if (fa != null) {
                fa.setStatus(fa.getAmountPaid() > 0 ? "PARTIALLY_PAID" : "UNPAID");
                fa.setUpdatedAt(now);
                feeRef.set(fa).get();
            }
        }

        // Notify Student with clear rejection reason
        notificationService.createNotification(
                payment.getStudentId(),
                "Payment Rejected: " + payment.getCategory(),
                "Your payment submission of ₹" + payment.getAmount() + " (UTR: " + payment.getUtrNumber() +
                        ") was rejected. Reason: " + reason.trim() + ". Please re-submit with accurate transaction proof.",
                "PAYMENT_REJECTED",
                paymentId,
                reason.trim(),
                "ACCOUNTS",
                "Fee Operations",
                "Dr. S. K. Ramesh",
                "Accounts Officer"
        );

        recordAuditLog("REJECT_PAYMENT", paymentId, payment.getStudentId(), admin,
                "Rejected payment submission (UTR: " + payment.getUtrNumber() + "). Reason: " + reason.trim());

        return payment;
    }

    // =========================================================================
    // 7. Receipts & History
    // =========================================================================

    public List<FeePayment> getPaymentsForStudent(UserProfile user, String studentId) throws ExecutionException, InterruptedException {
        boolean isOwner = user.getRole() == UserRole.STUDENT && user.getIdentifier().equalsIgnoreCase(studentId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isAdvisor = user.getRole() == UserRole.ADVISOR;
        boolean isHod = user.getRole() == UserRole.HOD;

        if (!isOwner && !isAdmin && !isAdvisor && !isHod) {
            throw new SecurityException("Unauthorized access to payment history.");
        }

        var snap = db.collection("fee_payments")
                .whereEqualTo("studentId", studentId)
                .get().get();

        List<FeePayment> list = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            FeePayment fp = doc.toObject(FeePayment.class);
            if (fp != null) list.add(fp);
        }
        list.sort((a, b) -> Long.compare(b.getSubmittedAt(), a.getSubmittedAt()));
        return list;
    }

    public List<FeePayment> getPendingPayments(UserProfile admin) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only Administrators can access pending verification queue.");
        }
        var snap = db.collection("fee_payments")
                .whereEqualTo("status", "PENDING_VERIFICATION")
                .get().get();

        List<FeePayment> list = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            FeePayment fp = doc.toObject(FeePayment.class);
            if (fp != null) list.add(fp);
        }
        list.sort((a, b) -> Long.compare(b.getSubmittedAt(), a.getSubmittedAt()));
        return list;
    }

    private FeeReceipt findInMemoryReceipt(String receiptId) {
        if (receiptId == null) return null;
        for (List<FeeReceipt> list : inMemoryReceipts.values()) {
            for (FeeReceipt r : list) {
                if (receiptId.equalsIgnoreCase(r.getId())) return r;
            }
        }
        if ("RCPT-2026-001".equalsIgnoreCase(receiptId)) {
            FeeReceipt r = new FeeReceipt();
            r.setId("RCPT-2026-001");
            r.setPaymentId("PAY-2026-001");
            r.setFeeAssignmentId("FEE-2026-001");
            r.setStudentId("620823104002");
            r.setStudentName("Abinaya G");
            r.setDepartment("Computer Science & Engineering");
            r.setAcademicYear("IV Year B.E.");
            r.setSection("CSE-A");
            r.setCategory("Tuition Fee");
            r.setDescription("Even Semester Tuition Fee 2026");
            r.setAmountReceived(45000.0);
            r.setRemainingBalance(0.0);
            r.setPaymentMode("UPI QR (Online)");
            r.setUtrNumber("987654321012");
            r.setPaymentDate("26 Mar 2026, 10:15 am");
            r.setVerifiedBy("Dr. S. K. Ramesh (Admin Officer)");
            r.setVerifiedDate("26 Mar 2026, 10:16 am");
            r.setGeneratedAt(System.currentTimeMillis());
            inMemoryReceipts.computeIfAbsent("620823104002", k -> new ArrayList<>()).add(r);
            return r;
        }
        return null;
    }

    public FeeReceipt getReceipt(UserProfile user, String receiptId) throws ExecutionException, InterruptedException {
        FeeReceipt receipt = findInMemoryReceipt(receiptId);

        if (receipt == null) {
            try {
                DocumentSnapshot doc = db.collection("fee_receipts").document(receiptId).get().get();
                if (doc.exists()) {
                    receipt = doc.toObject(FeeReceipt.class);
                }
            } catch (Exception ex) {
                System.err.println("Firestore read failed for receipt " + receiptId + ": " + ex.getMessage());
            }
        }

        if (receipt == null) {
            throw new IllegalArgumentException("Receipt not found: " + receiptId);
        }

        // Permission check
        boolean isOwner = user.getRole() == UserRole.STUDENT && user.getIdentifier().equalsIgnoreCase(receipt.getStudentId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isAdvisor = user.getRole() == UserRole.ADVISOR && (user.getSection() != null && user.getSection().equalsIgnoreCase(receipt.getSection()));
        boolean isHod = user.getRole() == UserRole.HOD;
        boolean isPrincipal = user.getRole() == UserRole.PRINCIPAL;

        if (!isOwner && !isAdmin && !isAdvisor && !isHod && !isPrincipal) {
            throw new SecurityException("Unauthorized: You cannot access this receipt.");
        }
        return receipt;
    }

    public List<FeeReceipt> getReceiptsForStudent(UserProfile user, String studentId) throws ExecutionException, InterruptedException {
        boolean isOwner = user.getRole() == UserRole.STUDENT && user.getIdentifier().equalsIgnoreCase(studentId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isAdvisor = user.getRole() == UserRole.ADVISOR;
        boolean isHod = user.getRole() == UserRole.HOD;

        if (!isOwner && !isAdmin && !isAdvisor && !isHod) {
            throw new SecurityException("Unauthorized access to receipts.");
        }

        var snap = db.collection("fee_receipts")
                .whereEqualTo("studentId", studentId)
                .get().get();

        List<FeeReceipt> list = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            FeeReceipt fr = doc.toObject(FeeReceipt.class);
            if (fr != null) list.add(fr);
        }
        list.sort((a, b) -> Long.compare(b.getGeneratedAt(), a.getGeneratedAt()));
        return list;
    }

    // =========================================================================
    // 8. Financial Metrics & Reports
    // =========================================================================

    public Map<String, Object> getFinancialSummary(UserProfile user) throws ExecutionException, InterruptedException {
        if (user.getRole() == UserRole.STUDENT) {
            throw new SecurityException("Unauthorized: Students cannot access institution financial summaries.");
        }

        var snapFees = db.collection("fee_assignments").get().get();
        var snapPayments = db.collection("fee_payments").get().get();

        double totalAssigned = 0;
        double confirmedCollected = 0;
        double pendingVerificationAmount = 0;
        double outstandingBalance = 0;
        int overdueCount = 0;
        int totalStudents = 0;
        Set<String> studentSet = new HashSet<>();

        String filterSection = user.getRole() == UserRole.ADVISOR ? user.getSection() : null;

        for (DocumentSnapshot doc : snapFees.getDocuments()) {
            FeeAssignment fa = doc.toObject(FeeAssignment.class);
            if (fa == null) continue;
            if (filterSection != null && !filterSection.equalsIgnoreCase(fa.getSection())) continue;

            totalAssigned += fa.getTotalAmount();
            confirmedCollected += fa.getAmountPaid();
            outstandingBalance += fa.getBalance();
            if ("OVERDUE".equalsIgnoreCase(fa.getStatus())) overdueCount++;
            studentSet.add(fa.getStudentId());
        }

        for (DocumentSnapshot doc : snapPayments.getDocuments()) {
            FeePayment fp = doc.toObject(FeePayment.class);
            if (fp == null) continue;
            if (filterSection != null && !filterSection.equalsIgnoreCase(fp.getSection())) continue;

            if ("PENDING_VERIFICATION".equalsIgnoreCase(fp.getStatus())) {
                pendingVerificationAmount += fp.getAmount();
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAssigned", totalAssigned);
        summary.put("confirmedCollected", confirmedCollected);
        summary.put("pendingVerificationAmount", pendingVerificationAmount);
        summary.put("outstandingBalance", outstandingBalance);
        summary.put("overdueCount", overdueCount);
        summary.put("totalStudentsWithFees", studentSet.size());
        summary.put("jurisdiction", filterSection != null ? filterSection : "Institution-Wide");

        return summary;
    }

    public Map<String, Object> getAdminDashboardSummary(UserProfile admin) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can access admin dashboard summaries.");
        }

        int cseACount = 0;
        int cseBCount = 0;
        int cseCCount = 0;
        int totalStudents = 0;
        double totalAssigned = 0.0;
        double totalConfirmedPayments = 0.0;
        double totalOutstandingBalance = 0.0;
        int pendingPaymentsCount = 0;

        try {
            // 1. Count actual students class-wise from Firestore
            var studentsSnap = db.collection("students").get().get();
            for (DocumentSnapshot doc : studentsSnap.getDocuments()) {
                totalStudents++;
                String sec = doc.getString("section");
                if ("CSE-A".equalsIgnoreCase(sec)) {
                    cseACount++;
                } else if ("CSE-B".equalsIgnoreCase(sec)) {
                    cseBCount++;
                } else if ("CSE-C".equalsIgnoreCase(sec)) {
                    cseCCount++;
                }
            }

            // 2. Aggregate fee totals from fee_assignments
            var feeSnap = db.collection("fee_assignments").get().get();
            for (DocumentSnapshot doc : feeSnap.getDocuments()) {
                FeeAssignment fa = doc.toObject(FeeAssignment.class);
                if (fa != null) {
                    totalAssigned += fa.getTotalAmount();
                    totalConfirmedPayments += fa.getAmountPaid();
                    totalOutstandingBalance += fa.getBalance();
                }
            }

            // 3. Pending payments count
            var paySnap = db.collection("fee_payments")
                    .whereEqualTo("status", "PENDING_VERIFICATION")
                    .get().get();
            pendingPaymentsCount = paySnap.size();
        } catch (Exception ex) {
            System.err.println("[FeeService] Admin summary Firestore error: " + ex.getMessage() + ". Using InstitutionalRoster fallback.");
            cseACount = InstitutionalRoster.getCountForSection("CSE-A");
            cseBCount = InstitutionalRoster.getCountForSection("CSE-B");
            cseCCount = InstitutionalRoster.getCountForSection("CSE-C");
            totalStudents = InstitutionalRoster.getTotalCount();

            for (List<FeeAssignment> assignments : inMemoryAssignments.values()) {
                for (FeeAssignment fa : assignments) {
                    totalAssigned += fa.getTotalAmount();
                    totalConfirmedPayments += fa.getAmountPaid();
                    totalOutstandingBalance += fa.getBalance();
                }
            }
        }

        if (totalStudents < 100) {
            cseACount = InstitutionalRoster.getCountForSection("CSE-A");
            cseBCount = InstitutionalRoster.getCountForSection("CSE-B");
            cseCCount = InstitutionalRoster.getCountForSection("CSE-C");
            totalStudents = InstitutionalRoster.getTotalCount();

            for (List<FeeAssignment> assignments : inMemoryAssignments.values()) {
                for (FeeAssignment fa : assignments) {
                    totalAssigned += fa.getTotalAmount();
                    totalConfirmedPayments += fa.getAmountPaid();
                    totalOutstandingBalance += fa.getBalance();
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalStudents", totalStudents);
        summary.put("cseACount", cseACount);
        summary.put("cseBCount", cseBCount);
        summary.put("cseCCount", cseCCount);
        summary.put("advisorCSE_A", "Mrs. P. Arularasi");
        summary.put("advisorCSE_B", "Dr. Divyabharathi");
        summary.put("advisorCSE_C", "Mrs. Rajavathi Jayapriya");
        summary.put("totalAssigned", totalAssigned);
        summary.put("totalConfirmedPayments", totalConfirmedPayments);
        summary.put("totalOutstandingBalance", totalOutstandingBalance);
        summary.put("pendingPaymentsCount", pendingPaymentsCount);

        return summary;
    }

    // =========================================================================
    // 9. Financial Audit Trail
    // =========================================================================

    public void recordAuditLog(String action, String targetId, String studentId, UserProfile actor, String details) {
        try {
            String logId = "AUDIT-" + System.currentTimeMillis() + "-" + (int)(100 + Math.random() * 900);
            FeeAuditLog log = new FeeAuditLog();
            log.setId(logId);
            log.setAction(action);
            log.setTargetId(targetId);
            log.setStudentId(studentId);
            log.setActorId(actor.getIdentifier());
            log.setActorName(actor.getName());
            log.setActorRole(actor.getRole().name());
            log.setDetails(details);
            log.setTimestamp(System.currentTimeMillis());
            log.setFormattedDate(LocalDateTime.now().format(formatter));

            db.collection("fee_audit_logs").document(logId).set(log);
        } catch (Exception ex) {
            System.err.println("Failed to write audit log: " + ex.getMessage());
        }
    }

    public List<FeeAuditLog> getAuditLogs(UserProfile admin) throws ExecutionException, InterruptedException {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("Unauthorized: Only an Administrator can access financial audit logs.");
        }
        var snap = db.collection("fee_audit_logs").limit(100).get().get();
        List<FeeAuditLog> logs = new ArrayList<>();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            FeeAuditLog l = doc.toObject(FeeAuditLog.class);
            if (l != null) logs.add(l);
        }
        logs.sort((a, b) -> Long.compare(b.getTimestamp(), a.getTimestamp()));
        return logs;
    }
}
