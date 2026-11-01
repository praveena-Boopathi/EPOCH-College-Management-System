package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.ComplaintStatus;
import com.epoch.epoch_backend.model.StudentComplaint;
import com.epoch.epoch_backend.model.UserProfile;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class ComplaintService {

    private final Firestore db;
    private final UserService userService;
    private final NotificationService notificationService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final java.util.Map<String, StudentComplaint> memoryComplaints = new java.util.concurrent.ConcurrentHashMap<>();

    public ComplaintService(Firestore db, UserService userService, NotificationService notificationService) {
        this.db = db;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public StudentComplaint submitComplaint(String regNo, StudentComplaint payload) {
        UserProfile student = null;
        try {
            student = userService.findStudent(regNo);
        } catch (Exception ex) {
            System.err.println("Could not find student in Firestore: " + ex.getMessage());
        }
        if (student == null) {
            throw new IllegalArgumentException("Student not found for regNo: " + regNo);
        }

        String id = "EPOCH-CMP-" + System.currentTimeMillis() + "-" + (int)(1000 + Math.random() * 9000);
        String timestamp = LocalDateTime.now().format(formatter);

        String dept = payload.getDepartment() != null && !payload.getDepartment().trim().isEmpty()
                ? payload.getDepartment()
                : (student.getDepartment() != null ? student.getDepartment() : "CSE");
        String yr = payload.getYear() != null && !payload.getYear().trim().isEmpty()
                ? payload.getYear()
                : (student.getYear() != null ? student.getYear() : "IV Year");
        String sType = payload.getStudentType() != null && !payload.getStudentType().trim().isEmpty()
                ? payload.getStudentType()
                : (student.getStudentType() != null ? student.getStudentType() : "Day Scholar");

        StudentComplaint cmp = new StudentComplaint();
        cmp.setId(id);
        cmp.setRegNo(student.getIdentifier());
        cmp.setStudentName(student.getName());
        cmp.setSection(student.getSection());
        cmp.setDepartment(dept);
        cmp.setYear(yr);
        cmp.setStudentType(sType);
        cmp.setSubject(payload.getSubject());
        cmp.setCategory(payload.getCategory() != null ? payload.getCategory() : "General");
        cmp.setDescription(payload.getDescription());
        cmp.setSupportingInfo(payload.getSupportingInfo() != null ? payload.getSupportingInfo() : payload.getSupportingDetails());
        cmp.setStatus(ComplaintStatus.SUBMITTED);
        cmp.setSubmittedAt(timestamp);

        // Save in-memory immediately
        memoryComplaints.put(id, cmp);

        // DIRECT ROUTING: Student -> Principal exclusively! Never routed to Advisor or HOD
        try {
            db.collection("complaints").document(id).set(cmp);
        } catch (Exception ex) {
            System.err.println("Firestore write failed for complaint (persisted in-memory): " + ex.getMessage());
        }

        // Notify Principal directly
        notificationService.createNotification(
                "bsanjaygandhi",
                "New Student Complaint Received",
                "A confidential student complaint (" + id + ") has been submitted directly to the Principal by " + student.getName() + " (" + student.getSection() + ", " + dept + ", " + yr + ", " + sType + "). Subject: " + payload.getSubject(),
                "COMPLAINT_NEW",
                id,
                null,
                null,
                "Student Complaint",
                student.getName(),
                "Student (" + student.getSection() + ")"
        );

        // Notify Student
        notificationService.createNotification(
                student.getIdentifier(),
                "Complaint Registered",
                "Your confidential complaint (" + id + ") has been submitted directly to Principal Dr. B. Sanjay Gandhi.",
                "COMPLAINT_SUBMITTED",
                id,
                null,
                null,
                "Student Complaint",
                "EPOCH Grievance Cell",
                "Administration"
        );

        return cmp;
    }

    public synchronized void seedDefaultComplaintsIfEmpty() {
        if (!memoryComplaints.isEmpty()) return;

        // 1. EPOCH-CMP-2026-01 (ABINAYA G, CSE-A)
        StudentComplaint c1 = new StudentComplaint();
        c1.setId("EPOCH-CMP-2026-01");
        c1.setRegNo("620823104002");
        c1.setStudentName("ABINAYA G");
        c1.setSection("CSE-A");
        c1.setDepartment("CSE");
        c1.setYear("IV Year");
        c1.setStudentType("Day Scholar");
        c1.setSubject("GPU Cluster Access for Final Year Deep Learning Project");
        c1.setCategory("Laboratory & Infrastructure");
        c1.setDescription("High performance computing GPU cluster node access is required for model fine-tuning in the departmental AI laboratory.");
        c1.setSupportingInfo("Project guide recommendation letter endorsed.");
        c1.setStatus(ComplaintStatus.RECEIVED);
        c1.setSubmittedAt("27 Mar 2026, 02:45 pm");
        memoryComplaints.put(c1.getId(), c1);
        try { db.collection("complaints").document(c1.getId()).set(c1); } catch (Exception ignored) {}

        // 2. EPOCH-CMP-2026-02 (PRAVEENA B, CSE-C)
        StudentComplaint c2 = new StudentComplaint();
        c2.setId("EPOCH-CMP-2026-02");
        c2.setRegNo("620823104034");
        c2.setStudentName("PRAVEENA B");
        c2.setSection("CSE-C");
        c2.setDepartment("CSE");
        c2.setYear("IV Year");
        c2.setStudentType("Hosteller");
        c2.setSubject("Library Digital Journal Access Permissions");
        c2.setCategory("Academic Resources");
        c2.setDescription("Digital library proxy credentials require institutional renewal for accessing IEEE and ACM digital libraries.");
        c2.setSupportingInfo("Student library card verified.");
        c2.setStatus(ComplaintStatus.UNDER_REVIEW);
        c2.setSubmittedAt("28 Mar 2026, 11:20 am");
        memoryComplaints.put(c2.getId(), c2);
        try { db.collection("complaints").document(c2.getId()).set(c2); } catch (Exception ignored) {}
    }

    public StudentComplaint getComplaintById(String id) {
        if (id == null || id.trim().isEmpty()) return null;
        String cleanId = id.trim();
        seedDefaultComplaintsIfEmpty();

        if (memoryComplaints.containsKey(cleanId)) {
            return memoryComplaints.get(cleanId);
        }
        for (StudentComplaint c : memoryComplaints.values()) {
            if (c.getId() != null && c.getId().equalsIgnoreCase(cleanId)) {
                return c;
            }
        }
        try {
            DocumentSnapshot doc = db.collection("complaints").document(cleanId).get().get(1200, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (doc.exists()) {
                StudentComplaint c = doc.toObject(StudentComplaint.class);
                if (c != null) {
                    memoryComplaints.put(cleanId, c);
                    return c;
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for complaint " + cleanId + ": " + ex.getMessage());
        }
        return memoryComplaints.get(cleanId);
    }

    public List<StudentComplaint> getStudentComplaints(String regNo) {
        seedDefaultComplaintsIfEmpty();
        java.util.Map<String, StudentComplaint> map = new java.util.LinkedHashMap<>();
        for (StudentComplaint c : memoryComplaints.values()) {
            if (regNo != null && regNo.equalsIgnoreCase(c.getRegNo())) {
                map.put(c.getId(), c);
            }
        }

        try {
            var snap = db.collection("complaints").whereEqualTo("regNo", regNo).get().get(1200, java.util.concurrent.TimeUnit.MILLISECONDS);
            for (DocumentSnapshot doc : snap.getDocuments()) {
                StudentComplaint c = doc.toObject(StudentComplaint.class);
                if (c != null) {
                    map.put(c.getId(), c);
                    memoryComplaints.put(c.getId(), c);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for student complaints (serving in-memory cache): " + ex.getMessage());
        }

        List<StudentComplaint> list = new ArrayList<>(map.values());
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return list;
    }

    public List<StudentComplaint> getAllComplaintsForPrincipal() {
        seedDefaultComplaintsIfEmpty();
        java.util.Map<String, StudentComplaint> map = new java.util.LinkedHashMap<>(memoryComplaints);

        try {
            var snap = db.collection("complaints").get().get(1200, java.util.concurrent.TimeUnit.MILLISECONDS);
            for (DocumentSnapshot doc : snap.getDocuments()) {
                StudentComplaint c = doc.toObject(StudentComplaint.class);
                if (c != null) {
                    map.put(c.getId(), c);
                    memoryComplaints.put(c.getId(), c);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for principal complaints (serving in-memory cache): " + ex.getMessage());
        }

        List<StudentComplaint> list = new ArrayList<>(map.values());
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        return list;
    }

    public StudentComplaint principalRespond(String complaintId, ComplaintStatus newStatus, String responseText) {
        StudentComplaint cmp = getComplaintById(complaintId);
        if (cmp == null) throw new IllegalArgumentException("Complaint not found: " + complaintId);

        String now = LocalDateTime.now().format(formatter);
        cmp.setStatus(newStatus);
        cmp.setPrincipalResponse(responseText);
        cmp.setRespondedAt(now);

        memoryComplaints.put(complaintId, cmp);

        try {
            DocumentReference ref = db.collection("complaints").document(complaintId);
            ref.set(cmp);
        } catch (Exception ex) {
            System.err.println("Firestore update failed for principal response: " + ex.getMessage());
        }

        String statusTitle = (newStatus == ComplaintStatus.RESOLVED)
                ? "Complaint Resolved by Principal"
                : ((newStatus == ComplaintStatus.CLOSED)
                        ? "Complaint Closed by Principal"
                        : "Principal Updated Complaint Status (" + newStatus + ")");

        // Notify Student of Principal's update
        notificationService.createNotification(
                cmp.getRegNo(),
                statusTitle,
                "Principal Dr. B. Sanjay Gandhi updated your complaint status to " + newStatus + (responseText != null && !responseText.isEmpty() ? ". Response: " + responseText : "."),
                "COMPLAINT_UPDATE_" + newStatus,
                cmp.getId(),
                null,
                "Principal",
                "Student Complaint",
                "Dr. B. Sanjay Gandhi",
                "Principal"
        );

        return cmp;
    }
}