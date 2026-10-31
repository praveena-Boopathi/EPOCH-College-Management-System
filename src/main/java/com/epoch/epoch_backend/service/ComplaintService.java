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

        // Notify Principal
        notificationService.createNotification(
                "bsanjaygandhi",
                "New Student Complaint Received",
                "A new complaint (" + id + ") has been submitted directly to the Principal by " + student.getName() + " (" + student.getSection() + ", " + dept + ", " + yr + ", " + sType + "). Subject: " + payload.getSubject(),
                "COMPLAINT_NEW",
                id,
                null,
                null
        );

        // Notify Student
        notificationService.createNotification(
                student.getIdentifier(),
                "Complaint Registered",
                "Your complaint (" + id + ") has been submitted directly to Principal Dr. B. Sanjay Gandhi.",
                "COMPLAINT_SUBMITTED",
                id,
                null,
                null
        );

        return cmp;
    }

    public StudentComplaint getComplaintById(String id) {
        if (memoryComplaints.containsKey(id)) {
            return memoryComplaints.get(id);
        }
        try {
            DocumentSnapshot doc = db.collection("complaints").document(id).get().get();
            if (doc.exists()) {
                StudentComplaint c = doc.toObject(StudentComplaint.class);
                if (c != null) {
                    memoryComplaints.put(id, c);
                    return c;
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for complaint " + id + ": " + ex.getMessage());
        }
        return memoryComplaints.get(id);
    }

    public List<StudentComplaint> getStudentComplaints(String regNo) {
        java.util.Map<String, StudentComplaint> map = new java.util.LinkedHashMap<>();
        for (StudentComplaint c : memoryComplaints.values()) {
            if (regNo != null && regNo.equalsIgnoreCase(c.getRegNo())) {
                map.put(c.getId(), c);
            }
        }

        try {
            var snap = db.collection("complaints").whereEqualTo("regNo", regNo).get().get();
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
        java.util.Map<String, StudentComplaint> map = new java.util.LinkedHashMap<>(memoryComplaints);

        try {
            var snap = db.collection("complaints").get().get();
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
                "Principal"
        );

        return cmp;
    }
}