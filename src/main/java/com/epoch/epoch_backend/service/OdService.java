package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.OdRequest;
import com.epoch.epoch_backend.model.OdStatus;
import com.epoch.epoch_backend.model.StaffSignature;
import com.epoch.epoch_backend.model.UserProfile;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class OdService {

    private final Firestore db;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SignatureService signatureService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final java.util.Map<String, OdRequest> memoryRequests = new java.util.concurrent.ConcurrentHashMap<>();

    public OdService(Firestore db, UserService userService, NotificationService notificationService, SignatureService signatureService) {
        this.db = db;
        this.userService = userService;
        this.notificationService = notificationService;
        this.signatureService = signatureService;
    }

    public static String normalizeSection(String section) {
        if (section == null) return "CSE-A";
        String s = section.replaceAll("(?i)CSE[-_ ]*", "").replaceAll("(?i)SECTION[-_ ]*", "").trim().toUpperCase();
        if (s.contains("C") || s.endsWith("C")) return "CSE-C";
        if (s.contains("B") || s.endsWith("B")) return "CSE-B";
        return "CSE-A";
    }

    public static boolean isSameSection(String sec1, String sec2) {
        if (sec1 == null || sec2 == null) return false;
        return normalizeSection(sec1).equalsIgnoreCase(normalizeSection(sec2));
    }

    public static String getAdvisorForSection(String section) {
        String norm = normalizeSection(section);
        if ("CSE-C".equalsIgnoreCase(norm)) return "rajavathijayapriya";
        if ("CSE-B".equalsIgnoreCase(norm)) return "divyabharathi";
        return "arularasi";
    }

    public static String getAdvisorNameForSection(String section) {
        String norm = normalizeSection(section);
        if ("CSE-C".equalsIgnoreCase(norm)) return "Dr. Rajavathi Jaya Priya";
        if ("CSE-B".equalsIgnoreCase(norm)) return "Mrs. Dhivya Bharathi";
        return "Mrs. P. Arularasi";
    }

    private void addTimelineEvent(OdRequest req, String eventType, String action, String actorId, String actorName, String actorRole, String decision, String remarks, String signatureSnapshot) {
        if (req.getWorkflowTimeline() == null) {
            req.setWorkflowTimeline(new ArrayList<>());
        }
        String timestamp = LocalDateTime.now().format(formatter);
        Map<String, Object> event = new HashMap<>();
        event.put("stage", req.getCurrentStage() != null ? req.getCurrentStage() : "WORKFLOW");
        event.put("eventId", "EVT-" + System.currentTimeMillis() + "-" + (int)(100 + Math.random() * 900));
        event.put("eventType", eventType);
        event.put("action", action);
        event.put("actorId", actorId != null ? actorId : "SYSTEM");
        event.put("actorName", actorName != null ? actorName : "System");
        event.put("actorRole", actorRole != null ? actorRole : "SYSTEM");
        event.put("decision", decision != null ? decision : "PROCESSED");
        event.put("timestamp", timestamp);
        event.put("remarks", remarks != null ? remarks : "");
        if (signatureSnapshot != null && !signatureSnapshot.isEmpty()) {
            event.put("signatureSnapshot", signatureSnapshot);
        }
        req.getWorkflowTimeline().add(event);
        req.setLastUpdatedAt(timestamp);
    }

    public static List<Map<String, Object>> ensureWorkflowTimeline(OdRequest req) {
        if (req.getWorkflowTimeline() != null && !req.getWorkflowTimeline().isEmpty()) {
            return req.getWorkflowTimeline();
        }
        List<Map<String, Object>> timeline = new ArrayList<>();
        Map<String, Object> e1 = new HashMap<>();
        e1.put("eventId", "EVT-SUB-" + (req.getId() != null ? req.getId() : "0"));
        e1.put("eventType", "SUBMISSION");
        e1.put("stage", "STUDENT");
        e1.put("action", "Submitted Request");
        e1.put("actorId", req.getRegNo());
        e1.put("actorName", req.getStudentName() != null ? req.getStudentName() : "Student");
        e1.put("actorRole", "STUDENT");
        e1.put("decision", "SUBMITTED");
        e1.put("timestamp", req.getSubmittedAt() != null ? req.getSubmittedAt() : "Official Record");
        e1.put("remarks", req.getReason() != null ? req.getReason() : "");
        timeline.add(e1);

        if (req.getAdvisorDecision() != null) {
            Map<String, Object> adv = req.getAdvisorDecision();
            Map<String, Object> e2 = new HashMap<>();
            boolean isApp = "APPROVED".equalsIgnoreCase((String) adv.get("status"));
            e2.put("eventId", "EVT-ADV-" + (req.getId() != null ? req.getId() : "0"));
            e2.put("eventType", isApp ? "ADVISOR_APPROVAL" : "ADVISOR_REJECTION");
            e2.put("stage", "CLASS_ADVISOR");
            e2.put("action", isApp ? "Approved by Class Advisor" : "Rejected by Class Advisor");
            e2.put("actorId", adv.get("approver"));
            e2.put("actorName", adv.get("signerName") != null ? adv.get("signerName") : adv.get("approver"));
            e2.put("actorRole", "CLASS_ADVISOR");
            e2.put("decision", adv.get("status"));
            e2.put("timestamp", adv.get("timestamp") != null ? adv.get("timestamp") : req.getSubmittedAt());
            e2.put("remarks", adv.get("reason") != null ? adv.get("reason") : "");
            if (adv.get("signatureBase64") != null) e2.put("signatureSnapshot", adv.get("signatureBase64"));
            timeline.add(e2);
        }

        if (req.getHodDecision() != null) {
            Map<String, Object> hod = req.getHodDecision();
            Map<String, Object> e3 = new HashMap<>();
            boolean isApp = "APPROVED".equalsIgnoreCase((String) hod.get("status"));
            e3.put("eventId", "EVT-HOD-" + (req.getId() != null ? req.getId() : "0"));
            e3.put("eventType", isApp ? "HOD_APPROVAL" : "HOD_REJECTION");
            e3.put("stage", "HOD");
            e3.put("action", isApp ? "Approved by Head of Department" : "Rejected by Head of Department");
            e3.put("actorId", hod.get("approver"));
            e3.put("actorName", hod.get("signerName") != null ? hod.get("signerName") : "Dr. K. Gopinath");
            e3.put("actorRole", "HOD");
            e3.put("decision", hod.get("status"));
            e3.put("timestamp", hod.get("timestamp") != null ? hod.get("timestamp") : req.getSubmittedAt());
            e3.put("remarks", hod.get("reason") != null ? hod.get("reason") : "");
            if (hod.get("signatureBase64") != null) e3.put("signatureSnapshot", hod.get("signatureBase64"));
            timeline.add(e3);
        }

        if (req.getPrincipalDecision() != null) {
            Map<String, Object> prin = req.getPrincipalDecision();
            Map<String, Object> e4 = new HashMap<>();
            boolean isApp = "APPROVED".equalsIgnoreCase((String) prin.get("status"));
            e4.put("eventId", "EVT-PRIN-" + (req.getId() != null ? req.getId() : "0"));
            e4.put("eventType", isApp ? "PRINCIPAL_APPROVAL" : "PRINCIPAL_REJECTION");
            e4.put("stage", "PRINCIPAL");
            e4.put("action", isApp ? "Approved by Principal" : "Rejected by Principal");
            e4.put("actorId", prin.get("approver"));
            e4.put("actorName", prin.get("signerName") != null ? prin.get("signerName") : "Dr. B. Sanjay Gandhi");
            e4.put("actorRole", "PRINCIPAL");
            e4.put("decision", prin.get("status"));
            e4.put("timestamp", prin.get("timestamp") != null ? prin.get("timestamp") : req.getSubmittedAt());
            e4.put("remarks", prin.get("reason") != null ? prin.get("reason") : "");
            if (prin.get("signatureBase64") != null) e4.put("signatureSnapshot", prin.get("signatureBase64"));
            timeline.add(e4);
        }
        req.setWorkflowTimeline(timeline);
        return timeline;
    }

    public void seedDefaultRequestsIfEmpty() {
        try {
            var docRef = db.collection("od_requests").document("EPOCH-OD-2026-002");
            var snap = docRef.get().get();
            if (!snap.exists()) {
                OdRequest req = new OdRequest();
                req.setId("EPOCH-OD-2026-002");
                req.setRegNo("620823104002");
                req.setStudentName("ABINAYA G");
                req.setDept("CSE");
                req.setSection("CSE-A");
                req.setOdType("Placement Drive / Interview");
                req.setEventTitle("Zoho Corporation Placement Interview");
                req.setOrganizer("Zoho Corporation");
                req.setVenue("Zoho Corporation, Estancia IT Park, Chennai");
                req.setStartDate("2026-03-24");
                req.setEndDate("2026-03-25");
                req.setNumberOfDays(2);
                req.setReason("Attending final round technical interview at Zoho Corporation campus.");
                req.setSupportingDetails("Shortlist verified by Department Placement Coordinator");
                req.setStatus(OdStatus.PENDING_HOD);
                req.setCurrentStage("HOD");
                req.setRequiresPrincipalApproval(false);
                req.setSubmittedAt("18 Mar 2026, 09:15 am");
                req.setLastUpdatedAt("18 Mar 2026, 11:30 am");
                req.setAssignedReviewerId("gopinath");
                req.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
                req.setAssignedReviewerRole("HOD");

                Map<String, Object> advDecision = new HashMap<>();
                advDecision.put("approver", "arularasi");
                advDecision.put("approverRole", "Class Advisor");
                advDecision.put("signerName", "Mrs. P. Arularasi");
                advDecision.put("status", "APPROVED");
                advDecision.put("timestamp", "18 Mar 2026, 11:30 am");
                advDecision.put("reason", "Placement drive shortlist verified. Recommended for department approval.");
                StaffSignature sig = signatureService.getSignature("arularasi");
                if (sig != null) {
                    advDecision.put("signatureBase64", sig.getSignatureBase64());
                }
                req.setAdvisorDecision(advDecision);

                List<Map<String, Object>> timeline = new ArrayList<>();
                Map<String, Object> evt1 = new HashMap<>();
                evt1.put("eventId", "EVT-1001");
                evt1.put("eventType", "SUBMISSION");
                evt1.put("action", "Submitted Request");
                evt1.put("actorId", "620823104002");
                evt1.put("actorName", "ABINAYA G");
                evt1.put("actorRole", "STUDENT");
                evt1.put("decision", "SUBMITTED");
                evt1.put("timestamp", "18 Mar 2026, 09:15 am");
                evt1.put("remarks", "Attending final round technical interview at Zoho Corporation campus.");
                timeline.add(evt1);

                Map<String, Object> evt2 = new HashMap<>();
                evt2.put("eventId", "EVT-1002");
                evt2.put("eventType", "ADVISOR_APPROVAL");
                evt2.put("action", "Approved by Class Advisor");
                evt2.put("actorId", "arularasi");
                evt2.put("actorName", "Mrs. P. Arularasi");
                evt2.put("actorRole", "CLASS_ADVISOR");
                evt2.put("decision", "APPROVED");
                evt2.put("timestamp", "18 Mar 2026, 11:30 am");
                evt2.put("remarks", "Placement drive shortlist verified. Recommended for department approval.");
                if (sig != null) evt2.put("signatureSnapshot", sig.getSignatureBase64());
                timeline.add(evt2);

                Map<String, Object> evt3 = new HashMap<>();
                evt3.put("eventId", "EVT-1003");
                evt3.put("eventType", "FORWARDED_HOD");
                evt3.put("action", "Forwarded to Head of Department");
                evt3.put("actorId", "arularasi");
                evt3.put("actorName", "Mrs. P. Arularasi");
                evt3.put("actorRole", "CLASS_ADVISOR");
                evt3.put("decision", "FORWARDED");
                evt3.put("timestamp", "18 Mar 2026, 11:30 am");
                evt3.put("remarks", "Endorsed and forwarded to HOD review queue.");
                timeline.add(evt3);

                req.setWorkflowTimeline(timeline);
                docRef.set(req).get();
            }
        } catch (Exception e) {
            System.err.println("Could not seed demo requests: " + e.getMessage());
        }
    }

    public OdRequest saveDraftOd(String studentRegNo, OdRequest payload) throws ExecutionException, InterruptedException {
        UserProfile student = userService.findStudent(studentRegNo);
        if (student == null) {
            throw new IllegalArgumentException("Student record not found for: " + studentRegNo);
        }

        String id = (payload.getId() != null && payload.getId().startsWith("EPOCH-OD-"))
                ? payload.getId()
                : "EPOCH-OD-DRAFT-" + System.currentTimeMillis() + "-" + (int)(1000 + Math.random() * 9000);

        String timestamp = LocalDateTime.now().format(formatter);

        OdRequest req = new OdRequest();
        req.setId(id);
        req.setRegNo(student.getIdentifier());
        req.setStudentName(student.getName());
        req.setDept(student.getDepartment());
        req.setSection(student.getSection());
        req.setOdType(payload.getOdType() != null ? payload.getOdType() : "Other");
        req.setEventTitle(payload.getEventTitle());
        req.setOrganizer(payload.getOrganizer());
        req.setVenue(payload.getVenue());
        req.setStartDate(payload.getStartDate());
        req.setEndDate(payload.getEndDate());
        req.setNumberOfDays(payload.getNumberOfDays() > 0 ? payload.getNumberOfDays() : 1);
        req.setReason(payload.getReason());
        req.setSupportingDetails(payload.getSupportingDetails());
        req.setDocumentName(payload.getDocumentName());
        req.setDocumentType(payload.getDocumentType());
        req.setDocumentData(payload.getDocumentData());
        req.setDocumentSize(payload.getDocumentSize());
        req.setStatus(OdStatus.DRAFT);
        req.setCurrentStage("DRAFT");
        req.setSubmittedAt(timestamp);

        db.collection("od_requests").document(id).set(req).get();
        return req;
    }

    public OdRequest submitOd(String studentRegNo, OdRequest payload) throws ExecutionException, InterruptedException {
        // Resolve student profile from authoritative Firestore record - NEVER TRUST FRONTEND SECTION
        UserProfile student = userService.findStudent(studentRegNo);
        if (student == null) {
            throw new IllegalArgumentException("Student record not found for: " + studentRegNo);
        }

        // Auto-fill sensible defaults for Bonafide and Leave requests if omitted
        if (payload.isBonafide()) {
            if (payload.getOrganizer() == null || payload.getOrganizer().trim().isEmpty()) {
                payload.setOrganizer("Gnanamani College of Technology");
            }
            if (payload.getVenue() == null || payload.getVenue().trim().isEmpty()) {
                payload.setVenue(payload.getEventTitle() != null ? payload.getEventTitle() : "Campus");
            }
            if (payload.getStartDate() == null || payload.getStartDate().trim().isEmpty()) {
                payload.setStartDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            }
            if (payload.getEndDate() == null || payload.getEndDate().trim().isEmpty()) {
                payload.setEndDate(payload.getStartDate());
            }
            if (payload.getEventTitle() == null || payload.getEventTitle().trim().isEmpty()) {
                payload.setEventTitle(payload.getOdType() != null ? payload.getOdType() : "Bonafide Certificate");
            }
        } else if (payload.isLeave()) {
            if (payload.getOrganizer() == null || payload.getOrganizer().trim().isEmpty()) {
                payload.setOrganizer("College Attendance / Leave");
            }
            if (payload.getVenue() == null || payload.getVenue().trim().isEmpty()) {
                payload.setVenue("Personal");
            }
            if (payload.getEventTitle() == null || payload.getEventTitle().trim().isEmpty()) {
                payload.setEventTitle(payload.getOdType());
            }
        }

        // Validate required fields
        if (payload.getOdType() == null || payload.getOdType().trim().isEmpty()) {
            throw new IllegalArgumentException("Request category/type is required.");
        }
        if (payload.getEventTitle() == null || payload.getEventTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Event / Purpose title is required.");
        }
        if (payload.getOrganizer() == null || payload.getOrganizer().trim().isEmpty()) {
            throw new IllegalArgumentException("Organizing institution or body is required.");
        }
        if (payload.getVenue() == null || payload.getVenue().trim().isEmpty()) {
            throw new IllegalArgumentException("Event venue/location is required.");
        }
        if (payload.getStartDate() == null || payload.getStartDate().trim().isEmpty()) {
            throw new IllegalArgumentException("Start date is required.");
        }
        if (payload.getEndDate() == null || payload.getEndDate().trim().isEmpty()) {
            throw new IllegalArgumentException("End date is required.");
        }
        if (payload.getReason() == null || payload.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Reason / description is required.");
        }

        // Date range validation
        if (payload.getStartDate().compareTo(payload.getEndDate()) > 0) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        // File size validation if document present (5MB max)
        if (payload.getDocumentSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Supporting document size exceeds maximum allowed limit of 5MB.");
        }

        // Prevent duplicate pending submissions for the same student on overlapping dates
        List<OdRequest> existingRequests = new ArrayList<>();
        for (OdRequest exist : memoryRequests.values()) {
            if (student.getIdentifier().equals(exist.getRegNo())) {
                existingRequests.add(exist);
            }
        }
        try {
            var existingSnap = db.collection("od_requests")
                    .whereEqualTo("regNo", student.getIdentifier())
                    .get().get();
            for (DocumentSnapshot doc : existingSnap.getDocuments()) {
                OdRequest exist = doc.toObject(OdRequest.class);
                if (exist != null) existingRequests.add(exist);
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed during duplicate check (using in-memory cache): " + ex.getMessage());
        }

        String payloadStart = payload.getStartDate().trim();
        String payloadEnd = payload.getEndDate().trim();
        String currentDraftId = payload.getId();

        for (OdRequest exist : existingRequests) {
            if (exist == null) continue;
            // Ignore current draft if we're promoting it
            if (currentDraftId != null && currentDraftId.equals(exist.getId())) continue;

            // Only check active pending or approved requests of the same type
            if (exist.getStatus() == OdStatus.PENDING_ADVISOR ||
                exist.getStatus() == OdStatus.PENDING_HOD ||
                exist.getStatus() == OdStatus.PENDING_PRINCIPAL ||
                exist.getStatus() == OdStatus.APPROVED) {

                String exStart = exist.getStartDate();
                String exEnd = exist.getEndDate() != null ? exist.getEndDate() : exStart;

                if (exStart != null && exEnd != null && !payload.isBonafide() && !exist.isBonafide()) {
                    // Check date overlap: (StartA <= EndB) and (EndA >= StartB)
                    if (payloadStart.compareTo(exEnd) <= 0 && payloadEnd.compareTo(exStart) >= 0) {
                        throw new IllegalArgumentException("You already have an active request (" + exist.getId() + ") for overlapping dates (" + exStart + " to " + exEnd + "). Accidental duplicate submission prevented.");
                    }
                }
            }
        }

        // Generate ID with appropriate institutional prefix
        String id;
        if (currentDraftId != null && (currentDraftId.startsWith("EPOCH-OD-DRAFT-") || currentDraftId.startsWith("EPOCH-OD-") || currentDraftId.startsWith("EPOCH-BNF-") || currentDraftId.startsWith("EPOCH-LV-"))) {
            id = currentDraftId.replace("-DRAFT-", "-");
            if (currentDraftId.contains("-DRAFT-")) {
                try {
                    db.collection("od_requests").document(currentDraftId).delete();
                } catch (Exception ignored) {}
            }
        } else if (payload.isBonafide()) {
            id = "EPOCH-BNF-2026-" + (int)(100 + Math.random() * 900);
        } else if (payload.isLeave()) {
            id = "EPOCH-LV-2026-" + (int)(100 + Math.random() * 900);
        } else {
            id = "EPOCH-OD-" + System.currentTimeMillis() + "-" + (int)(1000 + Math.random() * 9000);
        }

        String timestamp = LocalDateTime.now().format(formatter);

        OdRequest req = new OdRequest();
        req.setId(id);
        req.setRegNo(student.getIdentifier());
        req.setStudentName(student.getName());
        req.setDept(student.getDepartment());
        req.setSection(student.getSection()); // Strict authoritative section from Firestore
        String sType = payload.getStudentType() != null && !payload.getStudentType().trim().isEmpty()
                ? payload.getStudentType()
                : (student.getStudentType() != null ? student.getStudentType() : "Day Scholar");
        req.setStudentType(sType);
        req.setAcademicYear(student.getAcademicYear() != null ? student.getAcademicYear() : "IV Year B.E.");
        req.setHostelDetails(payload.getHostelDetails());
        req.setParentContact(payload.getParentContact());
        req.setOdType(payload.getOdType());
        req.setEventTitle(payload.getEventTitle());
        req.setOrganizer(payload.getOrganizer());
        req.setVenue(payload.getVenue());
        req.setStartDate(payload.getStartDate());
        req.setEndDate(payload.getEndDate());
        req.setNumberOfDays(payload.getNumberOfDays() > 0 ? payload.getNumberOfDays() : 1);
        req.setReason(payload.getReason());
        req.setSupportingDetails(payload.getSupportingDetails() != null ? payload.getSupportingDetails() : (payload.getOrganizer() + " - " + payload.getVenue()));
        req.setDocumentName(payload.getDocumentName());
        req.setDocumentType(payload.getDocumentType());
        req.setDocumentData(payload.getDocumentData());
        req.setDocumentSize(payload.getDocumentSize());
        req.setStatus(OdStatus.PENDING_ADVISOR);
        req.setCurrentStage("ADVISOR");
        req.setSubmittedAt(timestamp);

        String advisorUsername = getAdvisorForSection(student.getSection());
        String advisorDisplayName = getAdvisorNameForSection(student.getSection());

        req.setAssignedReviewerId(advisorUsername);
        req.setAssignedReviewerName(advisorDisplayName + " (" + student.getSection() + ")");
        req.setAssignedReviewerRole("CLASS_ADVISOR");
        req.setLastUpdatedAt(timestamp);

        // Initialize timeline
        addTimelineEvent(req, "SUBMISSION", "Submitted Request", student.getIdentifier(), student.getName(), "STUDENT", "SUBMITTED", payload.getReason(), null);
        addTimelineEvent(req, "ASSIGNMENT", "Forwarded for Review", "SYSTEM", "EPOCH Workflow Engine", "SYSTEM", "ASSIGNED", "Assigned to Class Advisor (" + advisorDisplayName + ")", null);

        // WORKFLOW RULE:
        // 1. Bonafide Certificate -> 3 Approval Stages (Advisor -> HOD -> Principal)
        // 2. All Other Requests (OD, Leave) -> 2 Approval Stages (Advisor -> HOD)
        boolean reqPrincipal = req.isBonafide();
        req.setRequiresPrincipalApproval(reqPrincipal);

        // Save to in-memory cache
        memoryRequests.put(id, req);

        // Save to Firestore
        try {
            db.collection("od_requests").document(id).set(req);
        } catch (Exception ex) {
            System.err.println("Firestore write failed for OD request (persisted in-memory): " + ex.getMessage());
        }

        String typeDesc = req.isBonafide() ? "Bonafide Certificate" : (req.isLeave() ? "Leave Application" : req.getOdType());

        // Notify Student
        notificationService.createNotification(
                student.getIdentifier(),
                typeDesc + " Submitted",
                "Your " + typeDesc + " request (" + id + ") has been submitted to Class Advisor for review.",
                "REQUEST_SUBMITTED",
                id,
                null,
                null
        );

        // Notify Section Advisor
        notificationService.createNotification(
                advisorUsername,
                "New " + typeDesc + " Pending Review",
                "Student " + student.getName() + " (" + student.getIdentifier() + ", " + student.getSection() + ") has submitted " + typeDesc + ": " + id,
                "REQUEST_PENDING_ADVISOR",
                id,
                null,
                null
        );

        return req;
    }

    public List<OdRequest> getStudentRequests(String regNo) {
        seedDefaultRequestsIfEmpty();
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest r : memoryRequests.values()) {
            if (regNo != null && regNo.equalsIgnoreCase(r.getRegNo())) {
                map.put(r.getId(), r);
            }
        }
        try {
            var snap = db.collection("od_requests").whereEqualTo("regNo", regNo).get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    map.put(req.getId(), req);
                    memoryRequests.put(req.getId(), req);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for student requests (serving in-memory cache): " + ex.getMessage());
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt() : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt() : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0) return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public List<OdRequest> getAdvisorRequests(String section) {
        seedDefaultRequestsIfEmpty();
        String normSec = normalizeSection(section);
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest r : memoryRequests.values()) {
            if (isSameSection(r.getSection(), normSec)) {
                map.put(r.getId(), r);
            }
        }
        try {
            var snap = db.collection("od_requests").whereEqualTo("section", normSec).get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    map.put(req.getId(), req);
                    memoryRequests.put(req.getId(), req);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for advisor requests (serving in-memory cache): " + ex.getMessage());
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt() : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt() : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0) return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public List<OdRequest> getHodRequests() {
        seedDefaultRequestsIfEmpty();
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest req : memoryRequests.values()) {
            boolean isPendingHod = req.getStatus() == OdStatus.PENDING_HOD 
                    || "HOD".equalsIgnoreCase(req.getCurrentStage()) 
                    || "gopinath".equalsIgnoreCase(req.getAssignedReviewerId());
            boolean hasHodDecision = req.getHodDecision() != null;
            boolean isApprovedOrForwarded = req.getStatus() == OdStatus.PENDING_PRINCIPAL || req.getStatus() == OdStatus.APPROVED;

            if (isPendingHod || hasHodDecision || isApprovedOrForwarded) {
                if (req.getStatus() == OdStatus.PENDING_HOD || "HOD".equalsIgnoreCase(req.getCurrentStage())) {
                    if (req.getAssignedReviewerId() == null || req.getAssignedReviewerId().isEmpty()) {
                        req.setAssignedReviewerId("gopinath");
                        req.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
                        req.setAssignedReviewerRole("HOD");
                    }
                }
                map.put(req.getId(), req);
            }
        }
        try {
            var snap = db.collection("od_requests").get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    boolean isPendingHod = req.getStatus() == OdStatus.PENDING_HOD 
                            || "HOD".equalsIgnoreCase(req.getCurrentStage()) 
                            || "gopinath".equalsIgnoreCase(req.getAssignedReviewerId());
                    boolean hasHodDecision = req.getHodDecision() != null;
                    boolean isApprovedOrForwarded = req.getStatus() == OdStatus.PENDING_PRINCIPAL || req.getStatus() == OdStatus.APPROVED;

                    if (isPendingHod || hasHodDecision || isApprovedOrForwarded) {
                        if (req.getStatus() == OdStatus.PENDING_HOD || "HOD".equalsIgnoreCase(req.getCurrentStage())) {
                            if (req.getAssignedReviewerId() == null || req.getAssignedReviewerId().isEmpty()) {
                                req.setAssignedReviewerId("gopinath");
                                req.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
                                req.setAssignedReviewerRole("HOD");
                            }
                        }
                        map.put(req.getId(), req);
                        memoryRequests.put(req.getId(), req);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for HOD requests (serving in-memory cache): " + ex.getMessage());
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt() : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt() : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0) return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public List<OdRequest> getPrincipalRequests() {
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest req : memoryRequests.values()) {
            if (req.isRequiresPrincipalApproval()) {
                boolean isPendingPrin = req.getStatus() == OdStatus.PENDING_PRINCIPAL || "PRINCIPAL".equalsIgnoreCase(req.getCurrentStage()) || "bsanjaygandhi".equalsIgnoreCase(req.getAssignedReviewerId());
                boolean hasPrinDecision = req.getPrincipalDecision() != null;
                if (isPendingPrin || hasPrinDecision) {
                    map.put(req.getId(), req);
                }
            }
        }
        try {
            var snap = db.collection("od_requests").get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null && req.isRequiresPrincipalApproval()) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    boolean isPendingPrin = req.getStatus() == OdStatus.PENDING_PRINCIPAL || "PRINCIPAL".equalsIgnoreCase(req.getCurrentStage()) || "bsanjaygandhi".equalsIgnoreCase(req.getAssignedReviewerId());
                    boolean hasPrinDecision = req.getPrincipalDecision() != null;
                    if (isPendingPrin || hasPrinDecision) {
                        map.put(req.getId(), req);
                        memoryRequests.put(req.getId(), req);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for Principal requests (serving in-memory cache): " + ex.getMessage());
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt() : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt() : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0) return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public OdRequest getRequestById(String id) {
        if (memoryRequests.containsKey(id)) {
            OdRequest req = memoryRequests.get(id);
            ensureWorkflowTimeline(req);
            return req;
        }
        try {
            DocumentSnapshot doc = db.collection("od_requests").document(id).get().get();
            if (doc.exists()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    memoryRequests.put(id, req);
                    return req;
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for request " + id + ": " + ex.getMessage());
        }
        return memoryRequests.get(id);
    }

    public OdRequest advisorAction(String id, String advisorUsername, String advisorSection, boolean approved, String reason) throws ExecutionException, InterruptedException {
        String advName = getAdvisorNameForSection(advisorSection);
        return advisorAction(id, advisorUsername, advName, advisorSection, approved, reason);
    }

    public OdRequest advisorAction(String id, String advisorId, String advisorName, String advisorSection, boolean approved, String reason) {
        OdRequest req = getRequestById(id);
        if (req == null) throw new IllegalArgumentException("Request not found: " + id);

        // Prevent student from approving their own request
        if (advisorId != null && advisorId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        // Section isolation security check
        if (!isSameSection(advisorSection, req.getSection())) {
            throw new SecurityException("Unauthorized: Advisor is assigned to " + advisorSection + " but request belongs to " + req.getSection());
        }

        // Must be in PENDING_ADVISOR stage
        if (req.getStatus() != OdStatus.PENDING_ADVISOR) {
            throw new IllegalStateException("Request is not currently in PENDING_ADVISOR stage (current status: " + req.getStatus() + ")");
        }

        // Prevent duplicate action
        if (req.getAdvisorDecision() != null) {
            throw new IllegalStateException("Class Advisor has already acted on this request.");
        }

        String now = LocalDateTime.now().format(formatter);
        String advDisplayName = advisorName != null && !advisorName.isEmpty() ? advisorName : getAdvisorNameForSection(req.getSection());
        String canonicalAdvId = advisorId != null && !advisorId.isEmpty() ? advisorId : getAdvisorForSection(req.getSection());

        Map<String, Object> decision = new HashMap<>();
        decision.put("approver", canonicalAdvId);
        decision.put("approverRole", "Class Advisor");
        decision.put("status", approved ? "APPROVED" : "REJECTED");
        decision.put("timestamp", now);
        decision.put("reason", reason != null ? reason : "");
        decision.put("signerName", advDisplayName);

        String sigSnapshot = null;
        if (approved) {
            StaffSignature sig = signatureService.getSignature(canonicalAdvId);
            if (sig != null && sig.getSignatureBase64() != null) {
                sigSnapshot = sig.getSignatureBase64();
                decision.put("signatureBase64", sigSnapshot);
                if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                    decision.put("signerName", sig.getSignerName());
                    advDisplayName = sig.getSignerName();
                }
            }
        }
        req.setAdvisorDecision(decision);

        String typeDesc = req.isBonafide() ? "Bonafide Certificate" : (req.isLeave() ? "Leave Application" : req.getOdType());

        ensureWorkflowTimeline(req);

        if (!approved) {
            req.setStatus(OdStatus.REJECTED);
            req.setCurrentStage("REJECTED");
            req.setRejectionReason(reason);
            req.setRejectedBy("Class Advisor (" + advDisplayName + ")");
            req.setAssignedReviewerId(null);
            req.setAssignedReviewerName(null);
            req.setAssignedReviewerRole("NONE");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "ADVISOR_REJECTION", "Rejected by Class Advisor", canonicalAdvId, advDisplayName, "CLASS_ADVISOR", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for advisor rejection (persisted in-memory): " + ex.getMessage());
            }

            // Rejection notification to student with full required details
            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Rejected by Class Advisor",
                    "Your " + typeDesc + " request (" + req.getId() + ") was rejected by Class Advisor.",
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "Class Advisor"
            );
        } else {
            // Forward to HOD
            req.setStatus(OdStatus.PENDING_HOD);
            req.setCurrentStage("HOD");
            req.setAssignedReviewerId("gopinath");
            req.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
            req.setAssignedReviewerRole("HOD");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "ADVISOR_APPROVAL", "Approved by Class Advisor", canonicalAdvId, advDisplayName, "CLASS_ADVISOR", "APPROVED", reason, sigSnapshot);
            addTimelineEvent(req, "FORWARDED_HOD", "Forwarded to Head of Department", canonicalAdvId, advDisplayName, "CLASS_ADVISOR", "FORWARDED", "Endorsed and forwarded to HOD review queue", null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for advisor approval (persisted in-memory): " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Approved by Advisor",
                    "Your " + typeDesc + " request (" + req.getId() + ") was approved by Class Advisor and forwarded to HOD for review.",
                    "REQUEST_APPROVED_STEP",
                    req.getId(),
                    null,
                    "Class Advisor"
            );

            notificationService.createNotification(
                    "gopinath",
                    "New " + typeDesc + " Forwarded to HOD",
                    typeDesc + " request " + req.getId() + " for student " + req.getStudentName() + " (" + req.getSection() + ") has been approved by Class Advisor and awaits your review.",
                    "REQUEST_PENDING_HOD",
                    req.getId(),
                    null,
                    null
            );
        }
        return req;
    }

    public OdRequest hodAction(String id, String hodUsername, boolean approved, String reason) throws ExecutionException, InterruptedException {
        return hodAction(id, hodUsername, "Dr. K. Gopinath", approved, reason);
    }

    public OdRequest hodAction(String id, String hodId, String hodName, boolean approved, String reason) {
        OdRequest req = getRequestById(id);
        if (req == null) throw new IllegalArgumentException("Request not found: " + id);

        // Prevent student from approving their own request
        if (hodId != null && hodId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        if (req.getStatus() != OdStatus.PENDING_HOD) {
            throw new IllegalStateException("Request is not currently in PENDING_HOD stage (current status: " + req.getStatus() + ")");
        }
        if (req.getAdvisorDecision() == null || !"APPROVED".equalsIgnoreCase((String) req.getAdvisorDecision().get("status"))) {
            throw new IllegalStateException("Class Advisor approval is required before HOD action");
        }

        // Prevent duplicate action
        if (req.getHodDecision() != null) {
            throw new IllegalStateException("Head of Department has already acted on this request.");
        }

        String now = LocalDateTime.now().format(formatter);
        String hodDisplayName = hodName != null && !hodName.isEmpty() ? hodName : "Dr. K. Gopinath";
        String canonicalHodId = hodId != null && !hodId.isEmpty() ? hodId : "gopinath";

        Map<String, Object> decision = new HashMap<>();
        decision.put("approver", canonicalHodId);
        decision.put("approverRole", "Head of Department");
        decision.put("status", approved ? "APPROVED" : "REJECTED");
        decision.put("timestamp", now);
        decision.put("reason", reason != null ? reason : "");
        decision.put("signerName", hodDisplayName);

        String sigSnapshot = null;
        if (approved) {
            StaffSignature sig = signatureService.getSignature(canonicalHodId);
            if (sig != null && sig.getSignatureBase64() != null) {
                sigSnapshot = sig.getSignatureBase64();
                decision.put("signatureBase64", sigSnapshot);
                if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                    decision.put("signerName", sig.getSignerName());
                    hodDisplayName = sig.getSignerName();
                }
            }
        }
        req.setHodDecision(decision);

        String typeDesc = req.isBonafide() ? "Bonafide Certificate" : (req.isLeave() ? "Leave Application" : req.getOdType());

        ensureWorkflowTimeline(req);

        if (!approved) {
            req.setStatus(OdStatus.REJECTED);
            req.setCurrentStage("REJECTED");
            req.setRejectionReason(reason);
            req.setRejectedBy("Head of Department (" + hodDisplayName + ")");
            req.setAssignedReviewerId(null);
            req.setAssignedReviewerName(null);
            req.setAssignedReviewerRole("NONE");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "HOD_REJECTION", "Rejected by Head of Department", canonicalHodId, hodDisplayName, "HOD", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for HOD rejection (persisted in-memory): " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Rejected by HOD",
                    "Your " + typeDesc + " request (" + req.getId() + ") was rejected by HOD.",
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "HOD"
            );
        } else {
            if (req.isRequiresPrincipalApproval()) {
                // Bonafide Certificate workflow -> moves to Principal stage
                req.setStatus(OdStatus.PENDING_PRINCIPAL);
                req.setCurrentStage("PRINCIPAL");
                req.setAssignedReviewerId("bsanjaygandhi");
                req.setAssignedReviewerName("Dr. B. Sanjay Gandhi (Principal)");
                req.setAssignedReviewerRole("PRINCIPAL");
                req.setLastUpdatedAt(now);

                addTimelineEvent(req, "HOD_APPROVAL", "Approved by Head of Department", canonicalHodId, hodDisplayName, "HOD", "APPROVED", reason, sigSnapshot);
                addTimelineEvent(req, "FORWARDED_PRINCIPAL", "Forwarded to Principal", canonicalHodId, hodDisplayName, "HOD", "FORWARDED", "Endorsed and forwarded for institutional sanction", null);

                memoryRequests.put(id, req);
                try {
                    db.collection("od_requests").document(id).set(req);
                } catch (Exception ex) {
                    System.err.println("Firestore update failed for HOD forwarding to Principal: " + ex.getMessage());
                }

                notificationService.createNotification(
                    req.getRegNo(),
                    "Bonafide Certificate Approved by HOD",
                    "Your Bonafide Certificate request (" + req.getId() + ") was approved by HOD and forwarded to Principal for final approval.",
                    "REQUEST_APPROVED_STEP",
                    req.getId(),
                    null,
                    "HOD"
                );

                notificationService.createNotification(
                    "bsanjaygandhi",
                    "Bonafide Certificate Awaiting Principal Approval",
                    "Bonafide Certificate request " + req.getId() + " for student " + req.getStudentName() + " (" + req.getSection() + ") has been approved by HOD and awaits Principal final approval.",
                    "REQUEST_PENDING_PRINCIPAL",
                    req.getId(),
                    null,
                    null
                );
            } else {
                // OD, Leave, and all other non-Bonafide requests -> Final Approval right here at HOD!
                req.setStatus(OdStatus.APPROVED);
                req.setCurrentStage("COMPLETED");
                req.setAssignedReviewerId(null);
                req.setAssignedReviewerName(null);
                req.setAssignedReviewerRole("NONE");
                req.setLastUpdatedAt(now);

                addTimelineEvent(req, "HOD_APPROVAL", "Approved by Head of Department", canonicalHodId, hodDisplayName, "HOD", "APPROVED", reason, sigSnapshot);
                addTimelineEvent(req, "FINAL_COMPLETION", "Official Approval Sanctioned", canonicalHodId, hodDisplayName, "HOD", "COMPLETED", "Final approval granted by Head of Department. Official form generated.", null);

                memoryRequests.put(id, req);
                try {
                    db.collection("od_requests").document(id).set(req);
                } catch (Exception ex) {
                    System.err.println("Firestore update failed for HOD final approval: " + ex.getMessage());
                }

                notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Officially Approved",
                    "Your " + typeDesc + " request (" + req.getId() + ") has received final approval from HOD. You can now download your official form.",
                    "REQUEST_APPROVED_FINAL",
                    req.getId(),
                    null,
                    null
                );
            }
        }
        return req;
    }

    public OdRequest principalAction(String id, String principalUsername, boolean approved, String reason) throws ExecutionException, InterruptedException {
        return principalAction(id, principalUsername, "Dr. B. Sanjay Gandhi", approved, reason);
    }

    public OdRequest principalAction(String id, String principalId, String principalName, boolean approved, String reason) {
        OdRequest req = getRequestById(id);
        if (req == null) {
            throw new IllegalArgumentException("Request not found: " + id);
        }

        // Prevent student from approving their own request
        if (principalId != null && principalId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        if (!req.isRequiresPrincipalApproval()) {
            throw new IllegalStateException("This request type (" + req.getOdType() + ") does not require Principal approval.");
        }
        if (req.getStatus() != OdStatus.PENDING_PRINCIPAL) {
            throw new IllegalStateException("Request is not currently in PENDING_PRINCIPAL stage (current status: " + req.getStatus() + ")");
        }
        if (req.getAdvisorDecision() == null || !"APPROVED".equalsIgnoreCase((String) req.getAdvisorDecision().get("status"))) {
            throw new IllegalStateException("Class Advisor approval is required before Principal sanction");
        }
        if (req.getHodDecision() == null || !"APPROVED".equalsIgnoreCase((String) req.getHodDecision().get("status"))) {
            throw new IllegalStateException("Head of Department approval is required before Principal sanction");
        }

        // Prevent duplicate action
        if (req.getPrincipalDecision() != null) {
            throw new IllegalStateException("Principal has already acted on this request.");
        }

        String now = LocalDateTime.now().format(formatter);
        String prinDisplayName = principalName != null && !principalName.isEmpty() ? principalName : "Dr. B. Sanjay Gandhi";
        String canonicalPrinId = principalId != null && !principalId.isEmpty() ? principalId : "bsanjaygandhi";

        Map<String, Object> decision = new HashMap<>();
        decision.put("approver", canonicalPrinId);
        decision.put("approverRole", "Principal");
        decision.put("status", approved ? "APPROVED" : "REJECTED");
        decision.put("timestamp", now);
        decision.put("reason", reason != null ? reason : "");
        decision.put("signerName", prinDisplayName);

        String sigSnapshot = null;
        if (approved) {
            StaffSignature sig = signatureService.getSignature(canonicalPrinId);
            if (sig != null && sig.getSignatureBase64() != null) {
                sigSnapshot = sig.getSignatureBase64();
                decision.put("signatureBase64", sigSnapshot);
                if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                    decision.put("signerName", sig.getSignerName());
                    prinDisplayName = sig.getSignerName();
                }
            }
        }
        req.setPrincipalDecision(decision);

        String typeDesc = req.isBonafide() ? "Bonafide Certificate" : req.getOdType();

        ensureWorkflowTimeline(req);

        if (!approved) {
            req.setStatus(OdStatus.REJECTED);
            req.setCurrentStage("REJECTED");
            req.setRejectionReason(reason);
            req.setRejectedBy("Principal (" + prinDisplayName + ")");
            req.setAssignedReviewerId(null);
            req.setAssignedReviewerName(null);
            req.setAssignedReviewerRole("NONE");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "PRINCIPAL_REJECTION", "Rejected by Principal", canonicalPrinId, prinDisplayName, "PRINCIPAL", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for Principal rejection: " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Rejected by Principal",
                    "Your " + typeDesc + " request (" + req.getId() + ") was rejected by Principal " + prinDisplayName + ".",
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "Principal"
            );
        } else {
            req.setStatus(OdStatus.APPROVED);
            req.setCurrentStage("COMPLETED");
            req.setAssignedReviewerId(null);
            req.setAssignedReviewerName(null);
            req.setAssignedReviewerRole("NONE");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "PRINCIPAL_APPROVAL", "Approved by Principal", canonicalPrinId, prinDisplayName, "PRINCIPAL", "APPROVED", reason, sigSnapshot);
            addTimelineEvent(req, "FINAL_COMPLETION", "Official Certificate Sanctioned", canonicalPrinId, prinDisplayName, "PRINCIPAL", "COMPLETED", "Final institutional approval granted. Official certificate generated.", null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for Principal approval: " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    "Bonafide Certificate Officially Approved by Principal",
                    "Your Bonafide Certificate request (" + req.getId() + ") has received final approval from Principal " + prinDisplayName + ". Official certificate is now available for download.",
                    "REQUEST_APPROVED_FINAL",
                    req.getId(),
                    null,
                    null
            );
        }
        return req;
    }
}