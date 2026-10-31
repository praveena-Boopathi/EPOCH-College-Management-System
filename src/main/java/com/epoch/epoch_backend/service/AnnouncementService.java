package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.Announcement;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteBatch;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

@Service
public class AnnouncementService {

    private final Firestore db;
    private final NotificationService notificationService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // In-memory durable cache for high reliability and 0ms reads
    private static final Map<String, Announcement> ANNOUNCEMENT_CACHE = new ConcurrentHashMap<>();

    // Cache to prevent accidental duplicate rapid-fire double clicks (senderId + title + message + audience -> timestamp)
    private final Map<String, Long> duplicateCache = new ConcurrentHashMap<>();

    public AnnouncementService(Firestore db, NotificationService notificationService) {
        this.db = db;
        this.notificationService = notificationService;
    }

    public Announcement createAnnouncement(UserProfile sender, Announcement req) throws ExecutionException, InterruptedException {
        // 1. Role validation: Only Class Advisors, HOD, and Principal can publish official announcements.
        // Students and Administrators are strictly forbidden.
        if (sender == null || sender.getRole() == UserRole.STUDENT || sender.getRole() == UserRole.ADMIN) {
            String roleStr = sender != null && sender.getRole() != null ? sender.getRole().name() : "Unauthenticated user";
            throw new SecurityException("Unauthorized: " + roleStr + "s are not permitted to publish official announcements. Only Class Advisors, HOD, and Principal have permission.");
        }

        // 2. Input validation
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Announcement title is required.");
        }
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("Announcement content is required.");
        }

        // 3. Multi-Select Target Sections Resolution & Normalization
        List<String> rawSections = req.getTargetSections();
        List<String> selectedSections = new ArrayList<>();

        if (rawSections != null && !rawSections.isEmpty()) {
            for (String s : rawSections) {
                if (s == null) continue;
                String clean = s.trim().toUpperCase();
                if (clean.equals("ALL") || clean.equals("ALL_STUDENTS") || clean.contains("ALL STUDENTS")) {
                    selectedSections = new ArrayList<>(List.of("ALL"));
                    break;
                } else if (clean.contains("CSE-A") || clean.equals("A")) {
                    if (!selectedSections.contains("CSE-A")) selectedSections.add("CSE-A");
                } else if (clean.contains("CSE-B") || clean.equals("B")) {
                    if (!selectedSections.contains("CSE-B")) selectedSections.add("CSE-B");
                } else if (clean.contains("CSE-C") || clean.equals("C")) {
                    if (!selectedSections.contains("CSE-C")) selectedSections.add("CSE-C");
                }
            }
        }

        // Fallback to legacy single targetSection if targetSections was empty
        if (selectedSections.isEmpty()) {
            String rawTargetSec = req.getTargetSection() != null ? req.getTargetSection().trim().toUpperCase() : "ALL";
            if (rawTargetSec.contains("CSE-A") || "A".equals(rawTargetSec)) {
                selectedSections.add("CSE-A");
            } else if (rawTargetSec.contains("CSE-B") || "B".equals(rawTargetSec)) {
                selectedSections.add("CSE-B");
            } else if (rawTargetSec.contains("CSE-C") || "C".equals(rawTargetSec)) {
                selectedSections.add("CSE-C");
            } else {
                selectedSections = new ArrayList<>(List.of("ALL"));
            }
        }

        // 4. Role-Based Jurisdiction & Scope Validation
        if (sender.getRole() == UserRole.ADVISOR) {
            // Determine advisor's authoritative assigned section
            String assignedSection = sender.getSection() != null ? sender.getSection().trim().toUpperCase() : null;
            if (assignedSection == null || assignedSection.isEmpty()) {
                String cleanId = sender.getIdentifier() != null ? sender.getIdentifier().trim().toLowerCase() : "";
                if ("arularasi".equals(cleanId)) assignedSection = "CSE-A";
                else if ("divyabharathi".equals(cleanId) || "dhivyabharathi".equals(cleanId)) assignedSection = "CSE-B";
                else if ("rajavathijayapriya".equals(cleanId) || "rajavathi".equals(cleanId)) assignedSection = "CSE-C";
                else assignedSection = "CSE-A";
            }

            // Class Advisors must only be allowed to publish to their assigned section
            if (selectedSections.contains("ALL") ||
                (req.getTargetAudience() != null && ("ALL".equalsIgnoreCase(req.getTargetAudience()) || "ALL_COLLEGE".equalsIgnoreCase(req.getTargetAudience())))) {
                throw new SecurityException("Unauthorized: Class Advisors cannot broadcast college-wide ('All Students'). You may only publish to your assigned section (" + assignedSection + ").");
            }

            for (String sec : selectedSections) {
                if (!assignedSection.equalsIgnoreCase(sec)) {
                    throw new SecurityException("Unauthorized: Class Advisors are only permitted to publish announcements to their assigned section (" + assignedSection + "). You cannot publish to " + sec + ".");
                }
            }

            selectedSections = new ArrayList<>(List.of(assignedSection));
        } else if (sender.getRole() == UserRole.HOD || sender.getRole() == UserRole.PRINCIPAL) {
            // HOD & Principal are authorized for any combination of CSE-A, CSE-B, CSE-C or ALL
            if (selectedSections.contains("ALL")) {
                selectedSections = new ArrayList<>(List.of("ALL"));
            }
        }

        // Sort sections alphabetically for consistent ordering
        if (!selectedSections.contains("ALL")) {
            selectedSections = new ArrayList<>(selectedSections);
            Collections.sort(selectedSections);
        }

        // Determine Audience Label
        String audienceLabel;
        if (selectedSections.contains("ALL")) {
            audienceLabel = "All Students";
        } else {
            audienceLabel = String.join(", ", selectedSections);
        }

        // 5. Duplicate Submission Prevention (3-second window)
        long now = System.currentTimeMillis();
        cleanDuplicateCache(now);
        String duplicateKey = sender.getIdentifier() + "::" + req.getTitle().trim().toLowerCase() + "::" + 
                req.getMessage().trim().toLowerCase() + "::" + audienceLabel;
        Long lastSubmitted = duplicateCache.get(duplicateKey);
        if (lastSubmitted != null && (now - lastSubmitted) < 3000) {
            throw new IllegalArgumentException("Duplicate announcement: A notice with the identical title, message, and audience was already submitted moments ago.");
        }
        duplicateCache.put(duplicateKey, now);

        // 6. Construct official announcement with trusted sender metadata
        String annId = "ANN-" + now + "-" + (int)(1000 + Math.random() * 9000);
        String formattedNow = LocalDateTime.now().format(formatter);

        req.setId(annId);
        req.setTitle(req.getTitle().trim());
        req.setMessage(req.getMessage().trim());
        req.setSenderId(sender.getIdentifier());
        req.setSenderName(sender.getName());
        req.setSenderRole(sender.getRole().name());
        req.setSenderSection(sender.getSection());
        req.setTargetAudience("STUDENT"); // Announcements are for students only
        req.setTargetDept(sender.getDepartment() != null ? sender.getDepartment() : "CSE");
        req.setTargetSections(selectedSections);
        req.setTargetSection(selectedSections.contains("ALL") ? "ALL" : String.join(", ", selectedSections));
        req.setTargetAudienceLabel(audienceLabel);
        req.setCreatedAt(formattedNow);
        req.setCreatedAtMs(now);
        if (req.getPriority() == null || req.getPriority().trim().isEmpty()) {
            req.setPriority("NORMAL");
        }
        if (req.getReadBy() == null) {
            req.setReadBy(new ArrayList<>());
        }

        // Sender display formatting:
        // "Announcement by Arularasi — Class Advisor, CSE-A"
        // "Announcement by Dhivya Bharathi — Class Advisor, CSE-B"
        // "Announcement by Rajavathi Jaya Priya — Class Advisor, CSE-C"
        // "Announcement by Dr. Gopinath — HOD"
        // "Announcement by Dr. B. Sanjay Gandhi — Principal"
        String senderDisplay;
        if (sender.getRole() == UserRole.ADVISOR) {
            String sec = sender.getSection() != null ? sender.getSection() : "CSE-A";
            senderDisplay = "Announcement by " + sender.getName() + " — Class Advisor, " + sec;
        } else if (sender.getRole() == UserRole.HOD) {
            senderDisplay = "Announcement by " + (sender.getName() != null && !sender.getName().isEmpty() ? sender.getName() + " — " : "") + "HOD";
        } else if (sender.getRole() == UserRole.PRINCIPAL) {
            senderDisplay = "Announcement by " + (sender.getName() != null && !sender.getName().isEmpty() ? sender.getName() + " — " : "") + "Principal";
        } else {
            senderDisplay = "Announcement by " + sender.getName();
        }
        req.setSenderDisplay(senderDisplay);

        // Store in high-reliability cache
        ANNOUNCEMENT_CACHE.put(annId, req);

        // Persist to Firestore
        try {
            db.collection("announcements").document(annId).set(req).get();
        } catch (Exception ex) {
            System.err.println("Firestore announcement write (persisted in cache): " + ex.getMessage());
        }

        // Deliver in-app notifications to STUDENTS ONLY
        dispatchStudentNotifications(req, sender, selectedSections, formattedNow);

        return req;
    }

    private void dispatchStudentNotifications(Announcement req, UserProfile sender, List<String> targetSections, String formattedNow) {
        try {
            Set<String> uniqueStudentRegNos = new HashSet<>();

            if (req.getTargetStudentId() != null && !req.getTargetStudentId().trim().isEmpty()) {
                uniqueStudentRegNos.add(req.getTargetStudentId().trim());
            } else if (targetSections.contains("ALL")) {
                for (UserProfile st : InstitutionalRoster.getStudentsForSection("ALL")) {
                    uniqueStudentRegNos.add(st.getIdentifier().trim());
                }
                try {
                    var stSnap = db.collection("students").get().get();
                    for (DocumentSnapshot sDoc : stSnap.getDocuments()) {
                        String studentRegNo = sDoc.getString("regNo") != null ? sDoc.getString("regNo") : sDoc.getId();
                        if (studentRegNo != null && !studentRegNo.trim().isEmpty()) {
                            uniqueStudentRegNos.add(studentRegNo.trim());
                        }
                    }
                } catch (Exception ignored) {}
            } else {
                for (String sec : targetSections) {
                    for (UserProfile st : InstitutionalRoster.getStudentsForSection(sec)) {
                        uniqueStudentRegNos.add(st.getIdentifier().trim());
                    }
                    try {
                        var stSnap = db.collection("students").whereEqualTo("section", sec).get().get();
                        for (DocumentSnapshot sDoc : stSnap.getDocuments()) {
                            String studentRegNo = sDoc.getString("regNo") != null ? sDoc.getString("regNo") : sDoc.getId();
                            if (studentRegNo != null && !studentRegNo.trim().isEmpty()) {
                                uniqueStudentRegNos.add(studentRegNo.trim());
                            }
                        }
                    } catch (Exception ignored) {}
                }
            }

            String notifTitle = targetSections.contains("ALL")
                    ? ("📢 Official Announcement: " + req.getTitle())
                    : ("📢 Class Announcement (" + req.getTargetAudienceLabel() + "): " + req.getTitle());
            String notifType = targetSections.contains("ALL") ? "ANNOUNCEMENT" : "CLASS_ANNOUNCEMENT";

            // Deliver notifications via NotificationService (immediate in-memory + Firestore)
            for (String studentRegNo : uniqueStudentRegNos) {
                notificationService.createNotification(
                        studentRegNo,
                        notifTitle,
                        req.getMessage(),
                        notifType,
                        req.getId(),
                        null,
                        "STUDENT"
                );
            }
        } catch (Exception ex) {
            System.err.println("Announcement notification broadcast error: " + ex.getMessage());
        }
    }

    private void cleanDuplicateCache(long now) {
        duplicateCache.entrySet().removeIf(entry -> (now - entry.getValue()) > 30000);
    }

    public List<Announcement> getSentAnnouncements(UserProfile user) {
        Map<String, Announcement> map = new LinkedHashMap<>();

        // 1. Populate from in-memory cache first
        for (Announcement a : ANNOUNCEMENT_CACHE.values()) {
            if (a != null && a.getSenderId() != null && a.getSenderId().equalsIgnoreCase(user.getIdentifier())) {
                map.put(a.getId(), a);
            }
        }

        // 2. Fetch from Firestore
        try {
            var snap = db.collection("announcements")
                    .whereEqualTo("senderId", user.getIdentifier())
                    .get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                Announcement a = doc.toObject(Announcement.class);
                if (a != null) {
                    ANNOUNCEMENT_CACHE.put(a.getId(), a);
                    map.put(a.getId(), a);
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore sent announcements read note: " + ex.getMessage());
        }

        List<Announcement> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Long.compare(b.getCreatedAtMs(), a.getCreatedAtMs()));
        return list;
    }

    public List<Announcement> getAnnouncementsForUser(UserProfile user) {
        Map<String, Announcement> map = new LinkedHashMap<>();

        // 1. Populate from in-memory cache first
        for (Announcement a : ANNOUNCEMENT_CACHE.values()) {
            if (a != null && isEligibleAudience(user, a)) {
                map.put(a.getId(), a);
            }
        }

        // 2. Query Firestore if reachable
        try {
            var snap = db.collection("announcements").get().get();
            for (DocumentSnapshot doc : snap.getDocuments()) {
                Announcement a = doc.toObject(Announcement.class);
                if (a != null) {
                    ANNOUNCEMENT_CACHE.put(a.getId(), a);
                    if (isEligibleAudience(user, a)) {
                        map.put(a.getId(), a);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore announcements read note: " + ex.getMessage());
        }

        List<Announcement> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Long.compare(b.getCreatedAtMs(), a.getCreatedAtMs()));
        return list;
    }

    private boolean isEligibleAudience(UserProfile user, Announcement a) {
        if (user == null || a == null) return false;

        // Senders can always see their own published notices
        if (a.getSenderId() != null && a.getSenderId().equalsIgnoreCase(user.getIdentifier())) {
            return true;
        }

        // Student audience rules:
        // A student sees only notices targeted to their section OR targeted to ALL students
        if (user.getRole() == UserRole.STUDENT) {
            String studentSec = user.getSection() != null ? user.getSection().trim().toUpperCase() : "";

            // If a specific student was targeted
            if (a.getTargetStudentId() != null && !a.getTargetStudentId().trim().isEmpty()) {
                return a.getTargetStudentId().trim().equalsIgnoreCase(user.getIdentifier().trim());
            }

            List<String> targetSecs = a.getTargetSections();
            if (targetSecs != null && !targetSecs.isEmpty()) {
                if (targetSecs.contains("ALL") || targetSecs.contains("ALL_STUDENTS")) {
                    return true;
                }
                return targetSecs.contains(studentSec);
            }

            // Fallback for older announcements
            String targetSec = a.getTargetSection() != null ? a.getTargetSection().trim().toUpperCase() : "ALL";
            if ("ALL".equals(targetSec) || "ALL_STUDENTS".equals(targetSec) || targetSec.isEmpty()) {
                return true;
            }
            return targetSec.contains(studentSec);
        }

        // Advisor view: sees their sent notices, announcements containing their section, or college-wide notices
        if (user.getRole() == UserRole.ADVISOR) {
            String advSec = user.getSection() != null ? user.getSection().trim().toUpperCase() : "";
            List<String> targetSecs = a.getTargetSections();
            if (targetSecs != null && !targetSecs.isEmpty()) {
                return targetSecs.contains("ALL") || targetSecs.contains(advSec);
            }
            String targetSec = a.getTargetSection() != null ? a.getTargetSection().trim().toUpperCase() : "ALL";
            return "ALL".equals(targetSec) || targetSec.contains(advSec);
        }

        // Administrative oversight: HOD, Principal, and Admin can review all published circulars
        return user.getRole() == UserRole.HOD || user.getRole() == UserRole.PRINCIPAL || user.getRole() == UserRole.ADMIN;
    }

    public void markAsRead(UserProfile user, String announcementId) {
        Announcement cached = ANNOUNCEMENT_CACHE.get(announcementId);
        if (cached != null) {
            List<String> readBy = cached.getReadBy() != null ? new ArrayList<>(cached.getReadBy()) : new ArrayList<>();
            if (!readBy.contains(user.getIdentifier())) {
                readBy.add(user.getIdentifier());
                cached.setReadBy(readBy);
            }
        }
        try {
            DocumentReference ref = db.collection("announcements").document(announcementId);
            DocumentSnapshot snap = ref.get().get();
            if (snap.exists()) {
                Announcement a = snap.toObject(Announcement.class);
                if (a != null) {
                    List<String> readBy = a.getReadBy() != null ? new ArrayList<>(a.getReadBy()) : new ArrayList<>();
                    if (!readBy.contains(user.getIdentifier())) {
                        readBy.add(user.getIdentifier());
                        ref.update("readBy", readBy).get();
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Failed to mark announcement as read in Firestore: " + ex.getMessage());
        }
    }

    public void deleteAnnouncement(UserProfile user, String announcementId) throws ExecutionException, InterruptedException {
        Announcement a = ANNOUNCEMENT_CACHE.get(announcementId);
        if (a == null) {
            try {
                DocumentSnapshot snap = db.collection("announcements").document(announcementId).get().get();
                if (snap.exists()) {
                    a = snap.toObject(Announcement.class);
                }
            } catch (Exception ignored) {}
        }

        if (a == null) {
            throw new IllegalArgumentException("Announcement not found: " + announcementId);
        }

        boolean isSender = user.getIdentifier().equalsIgnoreCase(a.getSenderId());
        boolean isPrincipal = user.getRole() == UserRole.PRINCIPAL;

        if (!isSender && !isPrincipal) {
            throw new SecurityException("Unauthorized: You cannot delete this announcement.");
        }

        ANNOUNCEMENT_CACHE.remove(announcementId);
        try {
            db.collection("announcements").document(announcementId).delete().get();
        } catch (Exception ignored) {}
    }
}
