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
    private volatile long lastRemoteFetchTime = 0;
    private static final long FIRESTORE_FETCH_TTL_MS = 60000; // 60s cache TTL to prevent Firestore quota exhaustion

    public boolean shouldFetchFromFirestore() {
        return (System.currentTimeMillis() - lastRemoteFetchTime > FIRESTORE_FETCH_TTL_MS) || memoryRequests.isEmpty();
    }

    public OdService(Firestore db, UserService userService, NotificationService notificationService,
            SignatureService signatureService) {
        this.db = db;
        this.userService = userService;
        this.notificationService = notificationService;
        this.signatureService = signatureService;
    }

    public static String normalizeSection(String section) {
        if (section == null)
            return "CSE-A";
        String s = section.replaceAll("(?i)CSE[-_ ]*", "").replaceAll("(?i)SECTION[-_ ]*", "").trim().toUpperCase();
        if (s.contains("C") || s.endsWith("C"))
            return "CSE-C";
        if (s.contains("B") || s.endsWith("B"))
            return "CSE-B";
        return "CSE-A";
    }

    public static boolean isSameSection(String sec1, String sec2) {
        if (sec1 == null || sec2 == null)
            return false;
        return normalizeSection(sec1).equalsIgnoreCase(normalizeSection(sec2));
    }

    public static String getAdvisorForSection(String section) {
        String norm = normalizeSection(section);
        if ("CSE-C".equalsIgnoreCase(norm))
            return "rajavathijayapriya";
        if ("CSE-B".equalsIgnoreCase(norm))
            return "divyabharathi";
        return "arularasi";
    }

    public static String getAdvisorNameForSection(String section) {
        String norm = normalizeSection(section);
        if ("CSE-C".equalsIgnoreCase(norm))
            return "Dr. Rajavathi Jaya Priya";
        if ("CSE-B".equalsIgnoreCase(norm))
            return "Mrs. Dhivya Bharathi";
        return "Mrs. P. Arularasi";
    }

    public static String getSectionForAdvisor(String advisorId) {
        if (advisorId == null)
            return "CSE-A";
        String clean = advisorId.trim().toLowerCase();
        if (clean.contains("dhivya") || clean.contains("divya"))
            return "CSE-B";
        if (clean.contains("raja") || clean.contains("jayapriya"))
            return "CSE-C";
        return "CSE-A";
    }

    private void addTimelineEvent(OdRequest req, String eventType, String action, String actorId, String actorName,
            String actorRole, String decision, String remarks, String signatureSnapshot) {
        if (req.getWorkflowTimeline() == null) {
            req.setWorkflowTimeline(new ArrayList<>());
        }
        String timestamp = LocalDateTime.now().format(formatter);
        Map<String, Object> event = new HashMap<>();
        event.put("stage", req.getCurrentStage() != null ? req.getCurrentStage() : "WORKFLOW");
        event.put("eventId", "EVT-" + System.currentTimeMillis() + "-" + (int) (100 + Math.random() * 900));
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
            if (adv.get("signatureBase64") != null)
                e2.put("signatureSnapshot", adv.get("signatureBase64"));
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
            if (hod.get("signatureBase64") != null)
                e3.put("signatureSnapshot", hod.get("signatureBase64"));
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
            if (prin.get("signatureBase64") != null)
                e4.put("signatureSnapshot", prin.get("signatureBase64"));
            timeline.add(e4);
        }
        req.setWorkflowTimeline(timeline);
        return timeline;
    }

    private void seedSingleRequest(OdRequest req) {
        if (req == null || req.getId() == null)
            return;
        ensureWorkflowTimeline(req);
        memoryRequests.put(req.getId(), req);
        try {
            db.collection("od_requests").document(req.getId()).set(req);
        } catch (Exception ignored) {
        }
    }

    public synchronized void seedDefaultRequestsIfEmpty() {
        if (memoryRequests.containsKey("EPOCH-OD-2026-001") &&
                memoryRequests.containsKey("EPOCH-BNF-2026-201") &&
                memoryRequests.containsKey("EPOCH-LV-2026-101")) {
            return;
        }

        try {
            // 1. EPOCH-OD-2026-001 (ABINAYA G, CSE-A, APPROVED)
            OdRequest r1 = new OdRequest();
            r1.setId("EPOCH-OD-2026-001");
            r1.setRegNo("620823104002");
            r1.setStudentName("ABINAYA G");
            r1.setDept("CSE");
            r1.setSection("CSE-A");
            r1.setOdType("Symposium / Conference");
            r1.setEventTitle("PSG Tech National Technical Symposium 2026");
            r1.setOrganizer("PSG College of Technology");
            r1.setVenue("Coimbatore, Tamil Nadu");
            r1.setStartDate("2026-03-10");
            r1.setEndDate("2026-03-11");
            r1.setNumberOfDays(2);
            r1.setReason("Presenting research paper on Distributed Deep Learning Systems at national conference.");
            r1.setSupportingDetails("Paper acceptance confirmation attached and verified by Class Advisor.");
            r1.setStatus(OdStatus.APPROVED);
            r1.setCurrentStage("COMPLETED");
            r1.setRequiresPrincipalApproval(false);
            r1.setSubmittedAt("05 Mar 2026, 10:00 am");
            r1.setLastUpdatedAt("07 Mar 2026, 03:30 pm");
            r1.setAssignedReviewerId(null);
            r1.setAssignedReviewerRole("NONE");
            StaffSignature sigAdv = signatureService.getSignature("arularasi");
            StaffSignature sigHod = signatureService.getSignature("gopinath");
            Map<String, Object> advDec1 = new HashMap<>();
            advDec1.put("approver", "arularasi");
            advDec1.put("approverRole", "Class Advisor");
            advDec1.put("signerName", "Mrs. P. Arularasi");
            advDec1.put("status", "APPROVED");
            advDec1.put("timestamp", "06 Mar 2026, 11:20 am");
            advDec1.put("reason", "Paper presentation verified. Student academic performance is satisfactory.");
            if (sigAdv != null)
                advDec1.put("signatureBase64", sigAdv.getSignatureBase64());
            r1.setAdvisorDecision(advDec1);
            Map<String, Object> hodDec1 = new HashMap<>();
            hodDec1.put("approver", "gopinath");
            hodDec1.put("approverRole", "HOD");
            hodDec1.put("signerName", "Dr. K. Gopinath");
            hodDec1.put("status", "APPROVED");
            hodDec1.put("timestamp", "07 Mar 2026, 03:30 pm");
            hodDec1.put("reason", "Institutional attendance exemption granted. Representation encouraged.");
            if (sigHod != null)
                hodDec1.put("signatureBase64", sigHod.getSignatureBase64());
            r1.setHodDecision(hodDec1);
            seedSingleRequest(r1);

            // 2. EPOCH-OD-2026-002 (ABINAYA G, CSE-A, PENDING_HOD)
            OdRequest r2 = new OdRequest();
            r2.setId("EPOCH-OD-2026-002");
            r2.setRegNo("620823104002");
            r2.setStudentName("ABINAYA G");
            r2.setDept("CSE");
            r2.setSection("CSE-A");
            r2.setOdType("Placement Drive / Interview");
            r2.setEventTitle("Zoho Corporation Placement Interview");
            r2.setOrganizer("Zoho Corporation");
            r2.setVenue("Zoho Corporation, Estancia IT Park, Chennai");
            r2.setStartDate("2026-03-24");
            r2.setEndDate("2026-03-25");
            r2.setNumberOfDays(2);
            r2.setReason("Attending final round technical interview at Zoho Corporation campus.");
            r2.setSupportingDetails("Shortlist verified by Department Placement Coordinator");
            r2.setStatus(OdStatus.PENDING_HOD);
            r2.setCurrentStage("HOD");
            r2.setRequiresPrincipalApproval(false);
            r2.setSubmittedAt("18 Mar 2026, 09:15 am");
            r2.setLastUpdatedAt("18 Mar 2026, 11:30 am");
            r2.setAssignedReviewerId("gopinath");
            r2.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
            r2.setAssignedReviewerRole("HOD");
            Map<String, Object> advDec2 = new HashMap<>();
            advDec2.put("approver", "arularasi");
            advDec2.put("approverRole", "Class Advisor");
            advDec2.put("signerName", "Mrs. P. Arularasi");
            advDec2.put("status", "APPROVED");
            advDec2.put("timestamp", "18 Mar 2026, 11:30 am");
            advDec2.put("reason", "Placement drive shortlist verified. Recommended for department approval.");
            if (sigAdv != null)
                advDec2.put("signatureBase64", sigAdv.getSignatureBase64());
            r2.setAdvisorDecision(advDec2);
            seedSingleRequest(r2);

            // 3. EPOCH-OD-2026-003 (ABINAYA G, CSE-A, PENDING_ADVISOR)
            OdRequest r3 = new OdRequest();
            r3.setId("EPOCH-OD-2026-003");
            r3.setRegNo("620823104002");
            r3.setStudentName("ABINAYA G");
            r3.setDept("CSE");
            r3.setSection("CSE-A");
            r3.setOdType("Sports / Cultural Meet");
            r3.setEventTitle("Anna University Inter-Zonal Sports Tournament");
            r3.setOrganizer("Anna University Sports Board");
            r3.setVenue("Anna University Main Grounds, Chennai");
            r3.setStartDate("2026-04-02");
            r3.setEndDate("2026-04-03");
            r3.setNumberOfDays(2);
            r3.setReason("Representing Gnanamani College of Technology in Inter-Zonal Table Tennis tournament.");
            r3.setSupportingDetails("Selected in collegiate trials by Physical Education Director.");
            r3.setStatus(OdStatus.PENDING_ADVISOR);
            r3.setCurrentStage("ADVISOR");
            r3.setRequiresPrincipalApproval(false);
            r3.setSubmittedAt("28 Mar 2026, 09:20 am");
            r3.setLastUpdatedAt("28 Mar 2026, 09:20 am");
            r3.setAssignedReviewerId("arularasi");
            r3.setAssignedReviewerName("Mrs. P. Arularasi (CSE-A)");
            r3.setAssignedReviewerRole("CLASS_ADVISOR");
            seedSingleRequest(r3);

            // 4. EPOCH-OD-2026-004 (PRAVEENA B, CSE-C, PENDING_ADVISOR)
            OdRequest r4 = new OdRequest();
            r4.setId("EPOCH-OD-2026-004");
            r4.setRegNo("620823104034");
            r4.setStudentName("PRAVEENA B");
            r4.setDept("CSE");
            r4.setSection("CSE-C");
            r4.setOdType("Symposium / Conference");
            r4.setEventTitle("CIT Open National Conference 2026");
            r4.setOrganizer("Coimbatore Institute of Technology");
            r4.setVenue("CIT Campus, Coimbatore");
            r4.setStartDate("2026-04-10");
            r4.setEndDate("2026-04-11");
            r4.setNumberOfDays(2);
            r4.setReason("Paper presentation on Secure Cloud Enclaves for Machine Learning Models.");
            r4.setSupportingDetails("Registration ID CIT-NC-2026-78 verified.");
            r4.setStatus(OdStatus.PENDING_ADVISOR);
            r4.setCurrentStage("ADVISOR");
            r4.setRequiresPrincipalApproval(false);
            r4.setSubmittedAt("28 Mar 2026, 01:15 pm");
            r4.setLastUpdatedAt("28 Mar 2026, 01:15 pm");
            r4.setAssignedReviewerId("rajavathijayapriya");
            r4.setAssignedReviewerName("Mrs. Rajavathi Jayapriya (CSE-C)");
            r4.setAssignedReviewerRole("CLASS_ADVISOR");
            seedSingleRequest(r4);

            // 5. EPOCH-OD-1793516731713-3134 (PRAVEENA B, CSE-C, PENDING_ADVISOR)
            OdRequest r5 = new OdRequest();
            r5.setId("EPOCH-OD-1793516731713-3134");
            r5.setRegNo("620823104034");
            r5.setStudentName("PRAVEENA B");
            r5.setDept("CSE");
            r5.setSection("CSE-C");
            r5.setOdType("Symposium / Conference");
            r5.setEventTitle("National Level Technical Symposium");
            r5.setOrganizer("Government College of Technology");
            r5.setVenue("GCT Auditorium, Coimbatore");
            r5.setStartDate("2026-04-15");
            r5.setEndDate("2026-04-16");
            r5.setNumberOfDays(2);
            r5.setReason("Participating in technical paper presentation and code debugging challenge.");
            r5.setSupportingDetails("Symposium registration kit verified.");
            r5.setStatus(OdStatus.PENDING_ADVISOR);
            r5.setCurrentStage("ADVISOR");
            r5.setRequiresPrincipalApproval(false);
            r5.setSubmittedAt("28 Mar 2026, 02:30 pm");
            r5.setLastUpdatedAt("28 Mar 2026, 02:30 pm");
            r5.setAssignedReviewerId("rajavathijayapriya");
            r5.setAssignedReviewerName("Mrs. Rajavathi Jayapriya (CSE-C)");
            r5.setAssignedReviewerRole("CLASS_ADVISOR");
            seedSingleRequest(r5);

            // 6. EPOCH-OD-2026-B01 (BHARANIDHARAN S, CSE-B, PENDING_ADVISOR)
            OdRequest r6 = new OdRequest();
            r6.setId("EPOCH-OD-2026-B01");
            r6.setRegNo("620823104023");
            r6.setStudentName("BHARANIDHARAN S");
            r6.setDept("CSE");
            r6.setSection("CSE-B");
            r6.setOdType("Hackathon / Codefest");
            r6.setEventTitle("Smart India Hackathon Internal Round");
            r6.setOrganizer("Ministry of Education & AICTE");
            r6.setVenue("Innovation & Incubation Hub, Gnanamani College");
            r6.setStartDate("2026-04-05");
            r6.setEndDate("2026-04-06");
            r6.setNumberOfDays(2);
            r6.setReason("Internal college round evaluation for national hackathon shortlisting.");
            r6.setSupportingDetails("Team lead endorsement submitted.");
            r6.setStatus(OdStatus.PENDING_ADVISOR);
            r6.setCurrentStage("ADVISOR");
            r6.setRequiresPrincipalApproval(false);
            r6.setSubmittedAt("28 Mar 2026, 11:00 am");
            r6.setLastUpdatedAt("28 Mar 2026, 11:00 am");
            r6.setAssignedReviewerId("divyabharathi");
            r6.setAssignedReviewerName("Dr. Divyabharathi (CSE-B)");
            r6.setAssignedReviewerRole("CLASS_ADVISOR");
            seedSingleRequest(r6);

            // 7. EPOCH-BNF-2026-001 (ABINAYA G, CSE-A, PENDING_PRINCIPAL - Bonafide)
            OdRequest r7 = new OdRequest();
            r7.setId("EPOCH-BNF-2026-001");
            r7.setRegNo("620823104002");
            r7.setStudentName("ABINAYA G");
            r7.setDept("CSE");
            r7.setSection("CSE-A");
            r7.setOdType("Bonafide Certificate");
            r7.setEventTitle("National Scholarship Portal Verification");
            r7.setOrganizer("Gnanamani College of Technology");
            r7.setVenue("Institutional Office");
            r7.setStartDate("2026-03-26");
            r7.setEndDate("2026-03-26");
            r7.setNumberOfDays(1);
            r7.setReason("Official Bonafide certificate required for NSP Government Merit Scholarship renewal.");
            r7.setSupportingDetails("Previous year marks and income certificate verified.");
            r7.setStatus(OdStatus.PENDING_PRINCIPAL);
            r7.setCurrentStage("PRINCIPAL");
            r7.setRequiresPrincipalApproval(true);
            r7.setSubmittedAt("24 Mar 2026, 09:00 am");
            r7.setLastUpdatedAt("26 Mar 2026, 09:30 am");
            r7.setAssignedReviewerId("bsanjaygandhi");
            r7.setAssignedReviewerName("Dr. B. Sanjay Gandhi (Principal)");
            r7.setAssignedReviewerRole("PRINCIPAL");
            Map<String, Object> advDec7 = new HashMap<>();
            advDec7.put("approver", "arularasi");
            advDec7.put("approverRole", "Class Advisor");
            advDec7.put("signerName", "Mrs. P. Arularasi");
            advDec7.put("status", "APPROVED");
            advDec7.put("timestamp", "24 Mar 2026, 02:00 pm");
            advDec7.put("reason", "Student bonafide record and academic standing verified.");
            if (sigAdv != null)
                advDec7.put("signatureBase64", sigAdv.getSignatureBase64());
            r7.setAdvisorDecision(advDec7);
            Map<String, Object> hodDec7 = new HashMap<>();
            hodDec7.put("approver", "gopinath");
            hodDec7.put("approverRole", "HOD");
            hodDec7.put("signerName", "Dr. K. Gopinath");
            hodDec7.put("status", "APPROVED");
            hodDec7.put("timestamp", "26 Mar 2026, 09:30 am");
            hodDec7.put("reason", "Departmental endorsement granted for scholarship application.");
            if (sigHod != null)
                hodDec7.put("signatureBase64", sigHod.getSignatureBase64());
            r7.setHodDecision(hodDec7);
            seedSingleRequest(r7);

            // 8. EPOCH-BNF-2026-201 (PRAVEENA B, CSE-C, PENDING_HOD - Bonafide)
            OdRequest r8 = new OdRequest();
            r8.setId("EPOCH-BNF-2026-201");
            r8.setRegNo("620823104034");
            r8.setStudentName("PRAVEENA B");
            r8.setDept("CSE");
            r8.setSection("CSE-C");
            r8.setOdType("Bonafide Certificate");
            r8.setEventTitle("State Passport & Visa Processing");
            r8.setOrganizer("Gnanamani College of Technology");
            r8.setVenue("Institutional Office");
            r8.setStartDate("2026-03-28");
            r8.setEndDate("2026-03-28");
            r8.setNumberOfDays(1);
            r8.setReason("Official Bonafide certificate required for Regional Passport Office verification.");
            r8.setSupportingDetails("Enrolment credentials verified.");
            r8.setStatus(OdStatus.PENDING_HOD);
            r8.setCurrentStage("HOD");
            r8.setRequiresPrincipalApproval(true);
            r8.setSubmittedAt("27 Mar 2026, 11:00 am");
            r8.setLastUpdatedAt("28 Mar 2026, 03:00 pm");
            r8.setAssignedReviewerId("gopinath");
            r8.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
            r8.setAssignedReviewerRole("HOD");
            StaffSignature sigAdvC = signatureService.getSignature("rajavathijayapriya");
            Map<String, Object> advDec8 = new HashMap<>();
            advDec8.put("approver", "rajavathijayapriya");
            advDec8.put("approverRole", "Class Advisor");
            advDec8.put("signerName", "Mrs. Rajavathi Jayapriya");
            advDec8.put("status", "APPROVED");
            advDec8.put("timestamp", "28 Mar 2026, 03:00 pm");
            advDec8.put("reason", "Bonafide verification confirmed. Recommended for HOD endorsement.");
            if (sigAdvC != null)
                advDec8.put("signatureBase64", sigAdvC.getSignatureBase64());
            r8.setAdvisorDecision(advDec8);
            seedSingleRequest(r8);

            // 9. EPOCH-LV-2026-101 (BALAMURUGAN C, CSE-A, PENDING_ADVISOR - Leave)
            OdRequest r9 = new OdRequest();
            r9.setId("EPOCH-LV-2026-101");
            r9.setRegNo("620823104020");
            r9.setStudentName("BALAMURUGAN C");
            r9.setDept("CSE");
            r9.setSection("CSE-A");
            r9.setOdType("Leave Application");
            r9.setEventTitle("Family Medical Emergency");
            r9.setOrganizer("Personal Affairs");
            r9.setVenue("Native Residence");
            r9.setStartDate("2026-03-30");
            r9.setEndDate("2026-04-01");
            r9.setNumberOfDays(3);
            r9.setReason("Attending family medical emergency at native town. Doctor letter available.");
            r9.setSupportingDetails("Parent contact confirmed: 9787286154.");
            r9.setStatus(OdStatus.PENDING_ADVISOR);
            r9.setCurrentStage("ADVISOR");
            r9.setRequiresPrincipalApproval(false);
            r9.setSubmittedAt("28 Mar 2026, 10:45 am");
            r9.setLastUpdatedAt("28 Mar 2026, 10:45 am");
            r9.setAssignedReviewerId("arularasi");
            r9.setAssignedReviewerName("Mrs. P. Arularasi (CSE-A)");
            r9.setAssignedReviewerRole("CLASS_ADVISOR");
            seedSingleRequest(r9);

        } catch (Exception e) {
            System.err.println("Could not seed demo requests: " + e.getMessage());
        }
    }

    public OdRequest saveDraftOd(String studentRegNo, OdRequest payload)
            throws ExecutionException, InterruptedException {
        UserProfile student = userService.findStudent(studentRegNo);
        if (student == null) {
            throw new IllegalArgumentException("Student record not found for: " + studentRegNo);
        }

        String id = (payload.getId() != null && payload.getId().startsWith("EPOCH-OD-"))
                ? payload.getId()
                : "EPOCH-OD-DRAFT-" + System.currentTimeMillis() + "-" + (int) (1000 + Math.random() * 9000);

        String timestamp = LocalDateTime.now().format(formatter);

        OdRequest req = new OdRequest();
        req.setId(id);
        req.setStudentUid(student.getId() != null ? student.getId() : student.getIdentifier());
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
        // Resolve student profile from authoritative Firestore record - NEVER TRUST
        // FRONTEND SECTION
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

        // Prevent duplicate pending submissions for the same student on overlapping
        // dates
        List<OdRequest> existingRequests = new ArrayList<>();
        for (OdRequest exist : memoryRequests.values()) {
            if (student.getIdentifier().equals(exist.getRegNo())) {
                existingRequests.add(exist);
            }
        }
        try {
            var existingSnap = db.collection("od_requests")
                    .whereEqualTo("regNo", student.getIdentifier())
                    .get().get(4000, java.util.concurrent.TimeUnit.MILLISECONDS);
            for (DocumentSnapshot doc : existingSnap.getDocuments()) {
                OdRequest exist = doc.toObject(OdRequest.class);
                if (exist != null)
                    existingRequests.add(exist);
            }
        } catch (Exception ex) {
            System.err.println(
                    "Firestore read failed during duplicate check (using in-memory cache): " + ex.getMessage());
        }

        String payloadStart = payload.getStartDate().trim();
        String payloadEnd = payload.getEndDate().trim();
        String currentDraftId = payload.getId();

        for (OdRequest exist : existingRequests) {
            if (exist == null)
                continue;
            // Ignore current draft if we're promoting it
            if (currentDraftId != null && currentDraftId.equals(exist.getId()))
                continue;

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
                        throw new IllegalArgumentException(
                                "You already have an active request (" + exist.getId() + ") for overlapping dates ("
                                        + exStart + " to " + exEnd + "). Accidental duplicate submission prevented.");
                    }
                }
            }
        }

        // Generate ID with appropriate institutional prefix
        String id;
        if (currentDraftId != null
                && (currentDraftId.startsWith("EPOCH-OD-DRAFT-") || currentDraftId.startsWith("EPOCH-OD-")
                        || currentDraftId.startsWith("EPOCH-BNF-") || currentDraftId.startsWith("EPOCH-LV-"))) {
            id = currentDraftId.replace("-DRAFT-", "-");
            if (currentDraftId.contains("-DRAFT-")) {
                try {
                    db.collection("od_requests").document(currentDraftId).delete();
                } catch (Exception ignored) {
                }
            }
        } else if (payload.isBonafide()) {
            id = "EPOCH-BNF-2026-" + (int) (100 + Math.random() * 900);
        } else if (payload.isLeave()) {
            id = "EPOCH-LV-2026-" + (int) (100 + Math.random() * 900);
        } else {
            id = "EPOCH-OD-" + System.currentTimeMillis() + "-" + (int) (1000 + Math.random() * 9000);
        }

        String timestamp = LocalDateTime.now().format(formatter);

        OdRequest req = new OdRequest();
        req.setId(id);
        req.setStudentUid(student.getId() != null ? student.getId() : student.getIdentifier());
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
        req.setSupportingDetails(payload.getSupportingDetails() != null ? payload.getSupportingDetails()
                : (payload.getOrganizer() + " - " + payload.getVenue()));
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
        addTimelineEvent(req, "SUBMISSION", "Submitted Request", student.getIdentifier(), student.getName(), "STUDENT",
                "SUBMITTED", payload.getReason(), null);
        addTimelineEvent(req, "ASSIGNMENT", "Forwarded for Review", "SYSTEM", "EPOCH Workflow Engine", "SYSTEM",
                "ASSIGNED", "Assigned to Class Advisor (" + advisorDisplayName + ")", null);

        // WORKFLOW RULE:
        // 1. Bonafide Certificate -> 3 Approval Stages (Advisor -> HOD -> Principal)
        // 2. All Other Requests (OD, Leave) -> 2 Approval Stages (Advisor -> HOD)
        boolean reqPrincipal = req.isBonafide();
        req.setRequiresPrincipalApproval(reqPrincipal);

        // Save to in-memory cache
        memoryRequests.put(id, req);

        // Save to Firestore with confirmed persistence
        try {
            db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception ex) {
            System.err.println("Firestore write error for OD request (persisted in-memory): " + ex.getMessage());
        }

        String typeDesc = req.isBonafide() ? "Bonafide Certificate"
                : (req.isLeave() ? "Leave Application" : req.getOdType());

        // Notify Student
        notificationService.createNotification(
                student.getIdentifier(),
                typeDesc + " Submitted",
                "Your " + typeDesc + " request (" + id + ") has been submitted to Class Advisor for review.",
                "REQUEST_SUBMITTED",
                id,
                null,
                "System",
                "Academic Request",
                "EPOCH Workflow Engine",
                "System");

        // Notify Section Advisor
        notificationService.createNotification(
                advisorUsername,
                "New " + typeDesc + " Pending Review",
                "Student " + student.getName() + " (" + student.getIdentifier() + ", " + student.getSection()
                        + ") has submitted " + typeDesc + ": " + id,
                "REQUEST_PENDING_ADVISOR",
                id,
                null,
                null,
                "Academic Request",
                student.getName(),
                "Student (" + student.getSection() + ")");

        return req;
    }

    public List<OdRequest> getStudentRequests(String regNo) {
        seedDefaultRequestsIfEmpty();
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest r : memoryRequests.values()) {
            if (regNo != null && (regNo.equalsIgnoreCase(r.getRegNo()) || regNo.equalsIgnoreCase(r.getStudentUid()))) {
                map.put(r.getId(), r);
            }
        }
        if (shouldFetchFromFirestore()) {
            try {
                var snap = db.collection("od_requests").whereEqualTo("regNo", regNo).get().get(4000,
                        java.util.concurrent.TimeUnit.MILLISECONDS);
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    OdRequest req = doc.toObject(OdRequest.class);
                    if (req != null) {
                        if (req.getId() == null)
                            req.setId(doc.getId());
                        ensureWorkflowTimeline(req);
                        map.put(req.getId(), req);
                        memoryRequests.put(req.getId(), req);
                    }
                }
                lastRemoteFetchTime = System.currentTimeMillis();
            } catch (Exception ex) {
                System.err.println(
                        "Firestore read failed for student requests (serving in-memory cache): " + ex.getMessage());
            }
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt()
                    : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt()
                    : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0)
                return cmp;
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
        if (shouldFetchFromFirestore()) {
            try {
                var snap = db.collection("od_requests").get().get(4000, java.util.concurrent.TimeUnit.MILLISECONDS);
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    OdRequest req = doc.toObject(OdRequest.class);
                    if (req != null && isSameSection(req.getSection(), normSec)) {
                        if (req.getId() == null)
                            req.setId(doc.getId());
                        ensureWorkflowTimeline(req);
                        map.put(req.getId(), req);
                        memoryRequests.put(req.getId(), req);
                    }
                }
                lastRemoteFetchTime = System.currentTimeMillis();
            } catch (Exception ex) {
                System.err.println(
                        "Firestore read failed for advisor requests (serving in-memory cache): " + ex.getMessage());
            }
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt()
                    : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt()
                    : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0)
                return cmp;
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
            boolean isApprovedOrForwarded = req.getStatus() == OdStatus.PENDING_PRINCIPAL
                    || req.getStatus() == OdStatus.APPROVED;
            boolean isRejectedAtHod = req.getStatus() == OdStatus.REJECTED && (
                    "HOD".equalsIgnoreCase(req.getCurrentStage())
                    || (req.getRejectedBy() != null && req.getRejectedBy().toLowerCase().contains("hod"))
                    || hasHodDecision
            );
            boolean isDeptScope = req.getDept() == null || req.getDept().toUpperCase().contains("CSE")
                    || (req.getSection() != null && req.getSection().toUpperCase().contains("CSE"));

            if (isDeptScope || isPendingHod || hasHodDecision || isApprovedOrForwarded || isRejectedAtHod) {
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
        if (shouldFetchFromFirestore()) {
            try {
                var snap = db.collection("od_requests").get().get(4000, java.util.concurrent.TimeUnit.MILLISECONDS);
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    OdRequest req = doc.toObject(OdRequest.class);
                    if (req != null) {
                        if (req.getId() == null)
                            req.setId(doc.getId());
                        ensureWorkflowTimeline(req);
                        boolean isPendingHod = req.getStatus() == OdStatus.PENDING_HOD
                                || "HOD".equalsIgnoreCase(req.getCurrentStage())
                                || "gopinath".equalsIgnoreCase(req.getAssignedReviewerId());
                        boolean hasHodDecision = req.getHodDecision() != null;
                        boolean isApprovedOrForwarded = req.getStatus() == OdStatus.PENDING_PRINCIPAL
                                || req.getStatus() == OdStatus.APPROVED;
                        boolean isRejectedAtHod = req.getStatus() == OdStatus.REJECTED && (
                                "HOD".equalsIgnoreCase(req.getCurrentStage())
                                || (req.getRejectedBy() != null && req.getRejectedBy().toLowerCase().contains("hod"))
                                || hasHodDecision
                        );
                        boolean isDeptScope = req.getDept() == null || req.getDept().toUpperCase().contains("CSE")
                                || (req.getSection() != null && req.getSection().toUpperCase().contains("CSE"));

                        if (isDeptScope || isPendingHod || hasHodDecision || isApprovedOrForwarded || isRejectedAtHod) {
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
                lastRemoteFetchTime = System.currentTimeMillis();
            } catch (Exception ex) {
                System.err.println("Firestore read failed for HOD requests (serving in-memory cache): " + ex.getMessage());
            }
        }
        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt()
                    : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt()
                    : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0)
                return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public List<OdRequest> getPrincipalRequests() {
        Map<String, OdRequest> map = new LinkedHashMap<>();
        for (OdRequest req : memoryRequests.values()) {
            boolean isBonafide = req.isRequiresPrincipalApproval() || req.isBonafide();
            if (isBonafide) {
                boolean isPendingPrin = req.getStatus() == OdStatus.PENDING_PRINCIPAL
                        || "PRINCIPAL".equalsIgnoreCase(req.getCurrentStage())
                        || "bsanjaygandhi".equalsIgnoreCase(req.getAssignedReviewerId());
                boolean hasPrinDecision = req.getPrincipalDecision() != null;
                boolean isApproved = req.getStatus() == OdStatus.APPROVED;
                boolean isRejected = req.getStatus() == OdStatus.REJECTED;
                if (isPendingPrin || hasPrinDecision || isApproved || isRejected) {
                    map.put(req.getId(), req);
                }
            }
        }
        if (shouldFetchFromFirestore()) {
            try {
                var snap = db.collection("od_requests").get().get(4000, java.util.concurrent.TimeUnit.MILLISECONDS);
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    OdRequest req = doc.toObject(OdRequest.class);
                    if (req != null) {
                        if (req.getId() == null)
                            req.setId(doc.getId());
                        ensureWorkflowTimeline(req);
                        boolean isBonafide = req.isRequiresPrincipalApproval() || req.isBonafide();
                        if (isBonafide) {
                            boolean isPendingPrin = req.getStatus() == OdStatus.PENDING_PRINCIPAL
                                    || "PRINCIPAL".equalsIgnoreCase(req.getCurrentStage())
                                    || "bsanjaygandhi".equalsIgnoreCase(req.getAssignedReviewerId());
                            boolean hasPrinDecision = req.getPrincipalDecision() != null;
                            boolean isApproved = req.getStatus() == OdStatus.APPROVED;
                            boolean isRejected = req.getStatus() == OdStatus.REJECTED;
                            if (isPendingPrin || hasPrinDecision || isApproved || isRejected) {
                                map.put(req.getId(), req);
                                memoryRequests.put(req.getId(), req);
                            }
                        }
                    }
                }
                lastRemoteFetchTime = System.currentTimeMillis();
            } catch (Exception ex) {
                System.err.println(
                        "Firestore read failed for Principal requests (serving in-memory cache): " + ex.getMessage());
            }
        }

        List<OdRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> {
            String ta = a.getLastUpdatedAt() != null ? a.getLastUpdatedAt()
                    : (a.getSubmittedAt() != null ? a.getSubmittedAt() : "");
            String tb = b.getLastUpdatedAt() != null ? b.getLastUpdatedAt()
                    : (b.getSubmittedAt() != null ? b.getSubmittedAt() : "");
            int cmp = tb.compareTo(ta);
            if (cmp != 0)
                return cmp;
            return b.getId() != null && a.getId() != null ? b.getId().compareTo(a.getId()) : 0;
        });
        return list;
    }

    public OdRequest getRequestById(String id) {
        if (id == null || id.trim().isEmpty()) return null;
        String cleanId = id.trim().replaceAll("^[#\\s]+", "").replaceAll("[\\s\"']+$", "");

        if (memoryRequests.isEmpty()) {
            seedDefaultRequestsIfEmpty();
        }

        // 1. Direct memory lookup
        if (memoryRequests.containsKey(cleanId)) {
            OdRequest req = memoryRequests.get(cleanId);
            ensureWorkflowTimeline(req);
            return req;
        }

        // 2. Case-insensitive memory lookup
        for (OdRequest r : memoryRequests.values()) {
            if (r.getId() != null && r.getId().equalsIgnoreCase(cleanId)) {
                ensureWorkflowTimeline(r);
                return r;
            }
        }

        // 3. Draft/submitted variation memory lookup
        if (cleanId.contains("-DRAFT-")) {
            String nonDraft = cleanId.replace("-DRAFT-", "-");
            for (OdRequest r : memoryRequests.values()) {
                if (r.getId() != null && r.getId().equalsIgnoreCase(nonDraft)) {
                    ensureWorkflowTimeline(r);
                    return r;
                }
            }
        } else {
            String draftVariant = cleanId.replace("EPOCH-OD-", "EPOCH-OD-DRAFT-")
                                         .replace("EPOCH-BNF-", "EPOCH-BNF-DRAFT-")
                                         .replace("EPOCH-LV-", "EPOCH-LV-DRAFT-");
            for (OdRequest r : memoryRequests.values()) {
                if (r.getId() != null && r.getId().equalsIgnoreCase(draftVariant)) {
                    ensureWorkflowTimeline(r);
                    return r;
                }
            }
        }

        // 4. Firestore document lookup in od_requests
        try {
            DocumentSnapshot doc = db.collection("od_requests").document(cleanId).get().get(2000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (doc.exists()) {
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    memoryRequests.put(cleanId, req);
                    memoryRequests.put(req.getId(), req);
                    return req;
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for request " + cleanId + ": " + ex.getMessage());
        }

        // 5. Firestore query by 'id' field in od_requests
        try {
            var qSnap = db.collection("od_requests").whereEqualTo("id", cleanId).limit(1).get().get(2000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!qSnap.isEmpty()) {
                DocumentSnapshot doc = qSnap.getDocuments().get(0);
                OdRequest req = doc.toObject(OdRequest.class);
                if (req != null) {
                    if (req.getId() == null) req.setId(doc.getId());
                    ensureWorkflowTimeline(req);
                    memoryRequests.put(cleanId, req);
                    memoryRequests.put(req.getId(), req);
                    return req;
                }
            }
        } catch (Exception ignored) {}

        // 6. Check legacy collections (bonafide_requests, leave_requests, requests)
        String[] legacyCols = new String[] { "bonafide_requests", "leave_requests", "requests" };
        for (String col : legacyCols) {
            try {
                DocumentSnapshot doc = db.collection(col).document(cleanId).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (doc.exists()) {
                    OdRequest req = doc.toObject(OdRequest.class);
                    if (req != null) {
                        if (req.getId() == null) req.setId(doc.getId());
                        ensureWorkflowTimeline(req);
                        memoryRequests.put(cleanId, req);
                        memoryRequests.put(req.getId(), req);
                        return req;
                    }
                }
            } catch (Exception ignored) {}
        }

        return memoryRequests.get(cleanId);
    }

    public OdRequest advisorAction(String id, String advisorUsername, String advisorSection, boolean approved,
            String reason) throws ExecutionException, InterruptedException {
        String advName = getAdvisorNameForSection(advisorSection);
        return advisorAction(id, advisorUsername, advName, advisorSection, approved, reason);
    }

    public OdRequest advisorAction(String id, String advisorId, String advisorName, String advisorSection,
            boolean approved, String reason) {
        OdRequest req = getRequestById(id);
        if (req == null)
            throw new IllegalArgumentException("Request not found: " + id);

        // Prevent student from approving their own request
        if (advisorId != null && advisorId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        // Section isolation security check
        if (!isSameSection(advisorSection, req.getSection())) {
            throw new SecurityException("Unauthorized: Advisor is assigned to " + advisorSection
                    + " but request belongs to " + req.getSection());
        }

        // Must be in PENDING_ADVISOR stage
        if (req.getStatus() != OdStatus.PENDING_ADVISOR) {
            throw new IllegalStateException(
                    "Request is not currently in PENDING_ADVISOR stage (current status: " + req.getStatus() + ")");
        }

        // Prevent duplicate action
        if (req.getAdvisorDecision() != null) {
            throw new IllegalStateException("Class Advisor has already acted on this request.");
        }

        if (!approved) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Rejection reason is strictly mandatory when declining a student request.");
            }
        }

        String now = LocalDateTime.now().format(formatter);
        String advDisplayName = advisorName != null && !advisorName.isEmpty() ? advisorName
                : getAdvisorNameForSection(req.getSection());
        String canonicalAdvId = advisorId != null && !advisorId.isEmpty() ? advisorId
                : getAdvisorForSection(req.getSection());

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
            if (sig == null || sig.getSignatureBase64() == null || sig.getSignatureBase64().trim().isEmpty()) {
                throw new IllegalStateException(
                        "Authorized digital signature could not be verified for Class Advisor.");
            }
            sigSnapshot = sig.getSignatureBase64();
            decision.put("signatureBase64", sigSnapshot);
            if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                decision.put("signerName", sig.getSignerName());
                advDisplayName = sig.getSignerName();
            }
        }
        req.setAdvisorDecision(decision);

        String typeDesc = req.isBonafide() ? "Bonafide Certificate"
                : (req.isLeave() ? "Leave Application" : req.getOdType());

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

            addTimelineEvent(req, "ADVISOR_REJECTION", "Rejected by Class Advisor", canonicalAdvId, advDisplayName,
                    "CLASS_ADVISOR", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception ex) {
                System.err.println(
                        "Firestore update failed for advisor rejection (persisted in-memory): " + ex.getMessage());
            }

            // Rejection notification to student with full required details
            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Declined by Class Advisor",
                    "Your " + typeDesc + " request (" + req.getId() + ") was declined by Class Advisor " + advDisplayName + ". Reason: " + reason,
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "Class Advisor",
                    "Official Decision",
                    advDisplayName,
                    "Class Advisor (" + req.getSection() + ")");
        } else {
            // Forward to HOD
            req.setStatus(OdStatus.PENDING_HOD);
            req.setCurrentStage("HOD");
            req.setAssignedReviewerId("gopinath");
            req.setAssignedReviewerName("Dr. K. Gopinath (Head of Department)");
            req.setAssignedReviewerRole("HOD");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "ADVISOR_APPROVAL", "Approved by Class Advisor", canonicalAdvId, advDisplayName,
                    "CLASS_ADVISOR", "APPROVED", reason, sigSnapshot);
            addTimelineEvent(req, "FORWARDED_HOD", "Forwarded to Head of Department", canonicalAdvId, advDisplayName,
                    "CLASS_ADVISOR", "FORWARDED", "Endorsed and forwarded to HOD review queue", null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception ex) {
                System.err.println(
                        "Firestore update failed for advisor approval (persisted in-memory): " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Approved by Advisor",
                    "Your " + typeDesc + " request (" + req.getId()
                            + ") was approved by Class Advisor " + advDisplayName + " and forwarded to HOD for departmental review.",
                    "REQUEST_APPROVED_STEP",
                    req.getId(),
                    null,
                    "Class Advisor",
                    "Official Decision",
                    advDisplayName,
                    "Class Advisor (" + req.getSection() + ")");

            notificationService.createNotification(
                    "gopinath",
                    "New " + typeDesc + " Forwarded to HOD",
                    typeDesc + " request " + req.getId() + " for student " + req.getStudentName() + " ("
                            + req.getSection() + ") has been approved by Class Advisor " + advDisplayName + " and awaits your review.",
                    "REQUEST_PENDING_HOD",
                    req.getId(),
                    null,
                    null,
                    "Academic Request",
                    advDisplayName,
                    "Class Advisor (" + req.getSection() + ")");
        }
        return req;
    }

    public OdRequest hodAction(String id, String hodUsername, boolean approved, String reason)
            throws ExecutionException, InterruptedException {
        return hodAction(id, hodUsername, "Dr. K. Gopinath", approved, reason);
    }

    public OdRequest hodAction(String id, String hodId, String hodName, boolean approved, String reason) {
        OdRequest req = getRequestById(id);
        if (req == null)
            throw new IllegalArgumentException("Request not found: " + id);

        // Prevent student from approving their own request
        if (hodId != null && hodId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        if (req.getStatus() != OdStatus.PENDING_HOD) {
            throw new IllegalStateException(
                    "Request is not currently in PENDING_HOD stage (current status: " + req.getStatus() + ")");
        }
        if (req.getAdvisorDecision() == null
                || !"APPROVED".equalsIgnoreCase((String) req.getAdvisorDecision().get("status"))) {
            throw new IllegalStateException("Class Advisor approval is required before HOD action");
        }

        // Prevent duplicate action
        if (req.getHodDecision() != null) {
            throw new IllegalStateException("Head of Department has already acted on this request.");
        }

        if (!approved) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Rejection reason is strictly mandatory when declining a student request.");
            }
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
            if (sig == null || sig.getSignatureBase64() == null || sig.getSignatureBase64().trim().isEmpty()) {
                throw new IllegalStateException(
                        "Authorized digital signature could not be verified for Head of Department.");
            }
            sigSnapshot = sig.getSignatureBase64();
            decision.put("signatureBase64", sigSnapshot);
            if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                decision.put("signerName", sig.getSignerName());
                hodDisplayName = sig.getSignerName();
            }
        }
        req.setHodDecision(decision);

        String typeDesc = req.isBonafide() ? "Bonafide Certificate"
                : (req.isLeave() ? "Leave Application" : req.getOdType());

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

            addTimelineEvent(req, "HOD_REJECTION", "Rejected by Head of Department", canonicalHodId, hodDisplayName,
                    "HOD", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception ex) {
                System.err
                        .println("Firestore update failed for HOD rejection (persisted in-memory): " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Declined by HOD",
                    "Your " + typeDesc + " request (" + req.getId() + ") was declined by Head of Department " + hodDisplayName + ". Reason: " + reason,
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "HOD",
                    "Official Decision",
                    hodDisplayName,
                    "Head of Department (CSE)");
        } else {
            if (req.isRequiresPrincipalApproval()) {
                // Bonafide Certificate workflow -> moves to Principal stage
                req.setStatus(OdStatus.PENDING_PRINCIPAL);
                req.setCurrentStage("PRINCIPAL");
                req.setAssignedReviewerId("bsanjaygandhi");
                req.setAssignedReviewerName("Dr. B. Sanjay Gandhi (Principal)");
                req.setAssignedReviewerRole("PRINCIPAL");
                req.setLastUpdatedAt(now);

                addTimelineEvent(req, "HOD_APPROVAL", "Approved by Head of Department", canonicalHodId, hodDisplayName,
                        "HOD", "APPROVED", reason, sigSnapshot);
                addTimelineEvent(req, "FORWARDED_PRINCIPAL", "Forwarded to Principal", canonicalHodId, hodDisplayName,
                        "HOD", "FORWARDED", "Endorsed and forwarded for institutional sanction", null);

                memoryRequests.put(id, req);
                try {
                    db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ex) {
                    System.err.println("Firestore update failed for HOD forwarding to Principal: " + ex.getMessage());
                }

                notificationService.createNotification(
                        req.getRegNo(),
                        "Bonafide Certificate Forwarded to Principal",
                        "Your Bonafide Certificate request (" + req.getId()
                                + ") was approved by HOD " + hodDisplayName + " and forwarded to Principal for final sanction.",
                        "REQUEST_APPROVED_STEP",
                        req.getId(),
                        null,
                        "HOD",
                        "Official Decision",
                        hodDisplayName,
                        "Head of Department (CSE)");

                notificationService.createNotification(
                        "bsanjaygandhi",
                        "Bonafide Certificate Awaiting Principal Approval",
                        "Bonafide Certificate request " + req.getId() + " for student " + req.getStudentName() + " ("
                                + req.getSection() + ") has been approved by HOD " + hodDisplayName + " and awaits Principal final approval.",
                        "REQUEST_PENDING_PRINCIPAL",
                        req.getId(),
                        null,
                        null,
                        "Academic Request",
                        hodDisplayName,
                        "Head of Department (CSE)");
            } else {
                // OD, Leave, and all other non-Bonafide requests -> Final Approval right here
                // at HOD!
                req.setStatus(OdStatus.APPROVED);
                req.setCurrentStage("COMPLETED");
                req.setAssignedReviewerId(null);
                req.setAssignedReviewerName(null);
                req.setAssignedReviewerRole("NONE");
                req.setLastUpdatedAt(now);

                addTimelineEvent(req, "HOD_APPROVAL", "Approved by Head of Department", canonicalHodId, hodDisplayName,
                        "HOD", "APPROVED", reason, sigSnapshot);
                addTimelineEvent(req, "FINAL_COMPLETION", "Official Approval Sanctioned", canonicalHodId,
                        hodDisplayName, "HOD", "COMPLETED",
                        "Final approval granted by Head of Department. Official form generated.", null);

                memoryRequests.put(id, req);
                try {
                    db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ex) {
                    System.err.println("Firestore update failed for HOD final approval: " + ex.getMessage());
                }

                notificationService.createNotification(
                        req.getRegNo(),
                        typeDesc + " Officially Approved",
                        "Your " + typeDesc + " request (" + req.getId()
                                + ") has received final approval from HOD " + hodDisplayName + ". Official signed form is available for download.",
                        "REQUEST_APPROVED_FINAL",
                        req.getId(),
                        null,
                        "HOD",
                        "Official Decision",
                        hodDisplayName,
                        "Head of Department (CSE)");
            }
        }
        return req;
    }

    public OdRequest principalAction(String id, String principalUsername, boolean approved, String reason)
            throws ExecutionException, InterruptedException {
        return principalAction(id, principalUsername, "Dr. B. Sanjay Gandhi", approved, reason);
    }

    public OdRequest principalAction(String id, String principalId, String principalName, boolean approved,
            String reason) {
        OdRequest req = getRequestById(id);
        if (req == null) {
            throw new IllegalArgumentException("Request not found: " + id);
        }

        // Prevent student from approving their own request
        if (principalId != null && principalId.equalsIgnoreCase(req.getRegNo())) {
            throw new SecurityException("Students cannot approve their own requests.");
        }

        if (!req.isRequiresPrincipalApproval()) {
            throw new IllegalStateException(
                    "This request type (" + req.getOdType() + ") does not require Principal approval.");
        }
        if (req.getStatus() != OdStatus.PENDING_PRINCIPAL) {
            throw new IllegalStateException(
                    "Request is not currently in PENDING_PRINCIPAL stage (current status: " + req.getStatus() + ")");
        }
        if (req.getAdvisorDecision() == null
                || !"APPROVED".equalsIgnoreCase((String) req.getAdvisorDecision().get("status"))) {
            throw new IllegalStateException("Class Advisor approval is required before Principal sanction");
        }
        if (req.getHodDecision() == null || !"APPROVED".equalsIgnoreCase((String) req.getHodDecision().get("status"))) {
            throw new IllegalStateException("Head of Department approval is required before Principal sanction");
        }

        // Prevent duplicate action
        if (req.getPrincipalDecision() != null) {
            throw new IllegalStateException("Principal has already acted on this request.");
        }

        if (!approved) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Rejection reason is strictly mandatory when declining a student request.");
            }
        }

        String now = LocalDateTime.now().format(formatter);
        String prinDisplayName = principalName != null && !principalName.isEmpty() ? principalName
                : "Dr. B. Sanjay Gandhi";
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
            if (sig == null || sig.getSignatureBase64() == null || sig.getSignatureBase64().trim().isEmpty()) {
                throw new IllegalStateException("Authorized digital signature could not be verified for Principal.");
            }
            sigSnapshot = sig.getSignatureBase64();
            decision.put("signatureBase64", sigSnapshot);
            if (sig.getSignerName() != null && !sig.getSignerName().isEmpty()) {
                decision.put("signerName", sig.getSignerName());
                prinDisplayName = sig.getSignerName();
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

            addTimelineEvent(req, "PRINCIPAL_REJECTION", "Rejected by Principal", canonicalPrinId, prinDisplayName,
                    "PRINCIPAL", "REJECTED", reason, null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for Principal rejection: " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    typeDesc + " Declined by Principal",
                    "Your " + typeDesc + " request (" + req.getId() + ") was declined by Principal " + prinDisplayName + ". Reason: " + reason,
                    "REQUEST_REJECTED",
                    req.getId(),
                    reason,
                    "Principal",
                    "Official Decision",
                    prinDisplayName,
                    "Principal");
        } else {
            req.setStatus(OdStatus.APPROVED);
            req.setCurrentStage("COMPLETED");
            req.setAssignedReviewerId(null);
            req.setAssignedReviewerName(null);
            req.setAssignedReviewerRole("NONE");
            req.setLastUpdatedAt(now);

            addTimelineEvent(req, "PRINCIPAL_APPROVAL", "Approved by Principal", canonicalPrinId, prinDisplayName,
                    "PRINCIPAL", "APPROVED", reason, sigSnapshot);
            addTimelineEvent(req, "FINAL_COMPLETION", "Official Certificate Sanctioned", canonicalPrinId,
                    prinDisplayName, "PRINCIPAL", "COMPLETED",
                    "Final institutional approval granted. Official certificate generated.", null);

            memoryRequests.put(id, req);
            try {
                db.collection("od_requests").document(id).set(req).get(8, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception ex) {
                System.err.println("Firestore update failed for Principal approval: " + ex.getMessage());
            }

            notificationService.createNotification(
                    req.getRegNo(),
                    "Bonafide Certificate Officially Approved by Principal",
                    "Your Bonafide Certificate request (" + req.getId()
                            + ") has received final approval from Principal " + prinDisplayName
                            + ". Official certificate is now available for download.",
                    "REQUEST_APPROVED_FINAL",
                    req.getId(),
                    null,
                    "Principal",
                    "Official Decision",
                    prinDisplayName,
                    "Principal");
        }
        return req;
    }
}