package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.ChatConversation;
import com.epoch.epoch_backend.model.ChatMessage;
import com.epoch.epoch_backend.model.ChatMessageRequest;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class ChatService {

    private final Firestore db;
    private final UserService userService;
    private final NotificationService notificationService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private static final Map<String, ChatConversation> localConversations = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, ChatMessageRequest> localRequests = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, List<ChatMessage>> localMessages = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, Long> lastSyncTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, Long> lastReqSyncTimestamps = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, Long> lastMessageSyncTimestamps = new java.util.concurrent.ConcurrentHashMap<>();

    public ChatService(Firestore db, UserService userService, NotificationService notificationService) {
        this.db = db;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    private final Map<String, UserProfile> fastUserCache = new java.util.concurrent.ConcurrentHashMap<>();

    public UserProfile findUserFast(String identifier) {
        if (identifier == null || identifier.trim().isEmpty())
            return null;
        String clean = identifier.trim().toLowerCase();
        UserProfile cached = fastUserCache.get(clean);
        if (cached != null) {
            String photo = UserService.getCachedPhoto(clean);
            if (photo != null)
                cached.setProfilePhoto(photo);
            return cached;
        }

        UserProfile student = InstitutionalRoster.findStudent(clean);
        if (student != null) {
            String photo = UserService.getCachedPhoto(clean);
            if (photo != null)
                student.setProfilePhoto(photo);
            fastUserCache.put(clean, student);
            return student;
        }

        // Authoritative institutional staff roster in memory (instant lookup, 0ms)
        if ("arularasi".equals(clean)) {
            UserProfile p = new UserProfile();
            p.setId("arularasi");
            p.setIdentifier("arularasi");
            p.setName("Mrs. P. Arularasi");
            p.setEmail("arularasi@gct.ac.in");
            p.setSection("CSE-A");
            p.setDepartment("Computer Science & Engineering");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            fastUserCache.put(clean, p);
            return p;
        } else if ("divyabharathi".equals(clean) || "dhivyabharathi".equals(clean)) {
            UserProfile p = new UserProfile();
            p.setId("divyabharathi");
            p.setIdentifier("divyabharathi");
            p.setName("Dr. Divyabharathi");
            p.setEmail("divyabharathi@gct.ac.in");
            p.setSection("CSE-B");
            p.setDepartment("Computer Science & Engineering");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            fastUserCache.put(clean, p);
            return p;
        } else if ("rajavathijayapriya".equals(clean) || "rajavathi".equals(clean)) {
            UserProfile p = new UserProfile();
            p.setId("rajavathijayapriya");
            p.setIdentifier("rajavathijayapriya");
            p.setName("Mrs. Rajavathi Jayapriya");
            p.setEmail("rajavathijayapriya@gct.ac.in");
            p.setSection("CSE-C");
            p.setDepartment("Computer Science & Engineering");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            fastUserCache.put(clean, p);
            return p;
        } else if ("gopinath".equals(clean) || "hod".equals(clean)) {
            UserProfile p = new UserProfile();
            p.setId("gopinath");
            p.setIdentifier("gopinath");
            p.setName("Dr. K. Gopinath");
            p.setEmail("gopinath@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("Computer Science & Engineering");
            p.setRole(UserRole.HOD);
            p.setAcademicYear("Staff / Faculty");
            fastUserCache.put(clean, p);
            return p;
        } else if ("bsanjaygandhi".equals(clean) || "principal".equals(clean) || clean.contains("principal@")) {
            UserProfile p = new UserProfile();
            p.setId("bsanjaygandhi");
            p.setIdentifier("bsanjaygandhi");
            p.setName("Dr. B. Sanjay Gandhi");
            p.setEmail("principal@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("Computer Science & Engineering");
            p.setRole(UserRole.PRINCIPAL);
            p.setAcademicYear("Executive Office");
            fastUserCache.put(clean, p);
            return p;
        } else if ("admin".equals(clean)) {
            UserProfile p = new UserProfile();
            p.setId("admin");
            p.setIdentifier("admin");
            p.setName("Dr. S. K. Ramesh");
            p.setEmail("admin@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("College Administration & Accounts");
            p.setRole(UserRole.ADMIN);
            p.setAcademicYear("Staff / Faculty");
            fastUserCache.put(clean, p);
            return p;
        }

        try {
            UserProfile staff = userService.findStaff(clean);
            if (staff != null) {
                fastUserCache.put(clean, staff);
                return staff;
            }
        } catch (Exception ignored) {
        }
        try {
            UserProfile u = userService.findUser(clean);
            if (u != null) {
                fastUserCache.put(clean, u);
                return u;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public List<Map<String, Object>> getContacts(UserProfile user) throws ExecutionException, InterruptedException {
        List<Map<String, Object>> contacts = new ArrayList<>();
        if (user == null)
            return contacts;

        if (user.getRole() == UserRole.STUDENT) {
            // Student can contact their Section Advisor, HOD, and Principal
            String advisorId = OdService.getAdvisorForSection(user.getSection());
            UserProfile adv = findUserFast(advisorId);
            if (adv != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", adv.getIdentifier());
                c.put("name", adv.getName());
                c.put("role", "ADVISOR");
                c.put("section", adv.getSection() != null ? adv.getSection() : user.getSection());
                c.put("title", "Class Advisor (" + user.getSection() + ")");
                contacts.add(c);
            }

            UserProfile hod = findUserFast("gopinath");
            if (hod != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", hod.getIdentifier());
                c.put("name", hod.getName());
                c.put("role", "HOD");
                c.put("section", "ALL");
                c.put("title", "Head of Department (CSE)");
                contacts.add(c);
            }

            UserProfile prin = findUserFast("bsanjaygandhi");
            if (prin != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", prin.getIdentifier());
                c.put("name", prin.getName());
                c.put("role", "PRINCIPAL");
                c.put("section", "ALL");
                c.put("title", "Principal (Executive Office)");
                contacts.add(c);
            }

        } else if (user.getRole() == UserRole.ADVISOR) {
            String sec = user.getSection() != null ? user.getSection() : "CSE-A";
            List<UserProfile> students = InstitutionalRoster.getStudentsForSection(sec);
            for (UserProfile s : students) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", s.getIdentifier());
                c.put("name", s.getName());
                c.put("role", "STUDENT");
                c.put("section", sec);
                c.put("title", "Student - " + s.getIdentifier());
                contacts.add(c);
            }

            for (String advUser : List.of("arularasi", "divyabharathi", "rajavathijayapriya")) {
                if (advUser.equalsIgnoreCase(user.getIdentifier()))
                    continue;
                UserProfile otherAdv = findUserFast(advUser);
                if (otherAdv != null) {
                    Map<String, Object> c = new HashMap<>();
                    c.put("identifier", otherAdv.getIdentifier());
                    c.put("name", otherAdv.getName());
                    c.put("role", "ADVISOR");
                    c.put("section", otherAdv.getSection());
                    c.put("title", "Class Advisor (" + otherAdv.getSection() + ")");
                    contacts.add(c);
                }
            }

            UserProfile hod = findUserFast("gopinath");
            if (hod != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", hod.getIdentifier());
                c.put("name", hod.getName());
                c.put("role", "HOD");
                c.put("section", "ALL");
                c.put("title", "Head of Department (CSE)");
                contacts.add(c);
            }

            UserProfile prin = findUserFast("bsanjaygandhi");
            if (prin != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", prin.getIdentifier());
                c.put("name", prin.getName());
                c.put("role", "PRINCIPAL");
                c.put("section", "ALL");
                c.put("title", "Principal (Executive Office)");
                contacts.add(c);
            }

        } else if (user.getRole() == UserRole.HOD) {
            for (String advUser : List.of("arularasi", "divyabharathi", "rajavathijayapriya")) {
                UserProfile adv = findUserFast(advUser);
                if (adv != null) {
                    Map<String, Object> c = new HashMap<>();
                    c.put("identifier", adv.getIdentifier());
                    c.put("name", adv.getName());
                    c.put("role", "ADVISOR");
                    c.put("section", adv.getSection());
                    c.put("title", "Class Advisor (" + adv.getSection() + ")");
                    contacts.add(c);
                }
            }

            UserProfile prin = findUserFast("bsanjaygandhi");
            if (prin != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", prin.getIdentifier());
                c.put("name", prin.getName());
                c.put("role", "PRINCIPAL");
                c.put("section", "ALL");
                c.put("title", "Principal (Executive Office)");
                contacts.add(c);
            }

        } else if (user.getRole() == UserRole.PRINCIPAL) {
            for (String advUser : List.of("arularasi", "divyabharathi", "rajavathijayapriya")) {
                UserProfile s = findUserFast(advUser);
                if (s != null) {
                    Map<String, Object> c = new HashMap<>();
                    c.put("identifier", s.getIdentifier());
                    c.put("name", s.getName());
                    c.put("role", "ADVISOR");
                    c.put("section", s.getSection() != null ? s.getSection() : "ALL");
                    c.put("title", "Class Advisor (" + s.getSection() + ")");
                    contacts.add(c);
                }
            }

            UserProfile hod = findUserFast("gopinath");
            if (hod != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("identifier", hod.getIdentifier());
                c.put("name", hod.getName());
                c.put("role", "HOD");
                c.put("section", "ALL");
                c.put("title", "Head of Department (CSE)");
                contacts.add(c);
            }
        }

        return contacts;
    }

    public List<Map<String, Object>> searchStudents(UserProfile user, String query)
            throws ExecutionException, InterruptedException {
        List<Map<String, Object>> results = new ArrayList<>();
        String cleanQ = (query != null ? query.trim().toLowerCase() : "");
        String currentId = user != null && user.getIdentifier() != null ? user.getIdentifier().toLowerCase() : "";

        // Combine all institutional students in memory
        Map<String, UserProfile> all = new LinkedHashMap<>(InstitutionalRoster.getAllStudents());

        for (UserProfile s : all.values()) {
            String regNo = s.getIdentifier();
            if (regNo.equalsIgnoreCase(currentId))
                continue; // Do not show oneself

            String name = s.getName();
            String section = s.getSection() != null ? s.getSection() : "CSE-A";
            String dept = s.getDepartment() != null ? s.getDepartment() : "Computer Science & Engineering";

            if (!cleanQ.isEmpty()) {
                boolean matches = (name != null && name.toLowerCase().contains(cleanQ))
                        || regNo.toLowerCase().contains(cleanQ)
                        || section.toLowerCase().contains(cleanQ)
                        || dept.toLowerCase().contains(cleanQ);
                if (!matches)
                    continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("identifier", regNo);
            map.put("name", name != null ? name : "Student (" + regNo + ")");
            map.put("section", section);
            map.put("department", dept);
            map.put("academicYear", UserService.CURRENT_ACADEMIC_YEAR);
            map.put("role", "STUDENT");
            map.put("isOnline", true);
            results.add(map);
        }

        results.sort(Comparator.comparing(a -> String.valueOf(a.get("name"))));
        return results;
    }

    public List<Map<String, Object>> searchUsers(UserProfile currentUser, String query, String roleFilter, int page,
            int limit) {
        List<Map<String, Object>> results = new ArrayList<>();
        String cleanQ = (query != null ? query.trim().toLowerCase() : "");
        String curId = currentUser != null && currentUser.getIdentifier() != null
                ? currentUser.getIdentifier().toLowerCase()
                : "";
        String filterRole = (roleFilter != null ? roleFilter.trim().toUpperCase() : "ALL");

        boolean includeStaff = "ALL".equals(filterRole) || "STAFF".equals(filterRole) || "FACULTY".equals(filterRole)
                || "ADVISOR".equals(filterRole) || "ADVISORS".equals(filterRole) || "HOD".equals(filterRole)
                || "PRINCIPAL".equals(filterRole);
        boolean includeStudents = "ALL".equals(filterRole) || "STUDENT".equals(filterRole)
                || "STUDENTS".equals(filterRole);

        // Pre-calculate active conversation mappings for the current user from memory
        // cache
        Set<String> connectedUserIds = new HashSet<>();
        Map<String, String> userConvIdMap = new HashMap<>();
        if (currentUser != null) {
            for (ChatConversation c : localConversations.values()) {
                if (c != null && isUserAuthorizedParticipant(currentUser, c)) {
                    String otherId = null;
                    if (c.getParticipants() != null) {
                        for (String p : c.getParticipants()) {
                            if (p != null && !p.equalsIgnoreCase(curId)) {
                                otherId = p.toLowerCase();
                                break;
                            }
                        }
                    }
                    if (otherId == null) {
                        if (c.getStudentRegNo() != null && !c.getStudentRegNo().equalsIgnoreCase(curId)) {
                            otherId = c.getStudentRegNo().toLowerCase();
                        } else if (c.getStaffUsername() != null && !c.getStaffUsername().equalsIgnoreCase(curId)) {
                            otherId = c.getStaffUsername().toLowerCase();
                        }
                    }
                    if (otherId != null) {
                        connectedUserIds.add(otherId);
                        userConvIdMap.put(otherId, c.getId());
                    }
                }
            }
        }

        // Also check any accepted requests
        for (ChatMessageRequest req : localRequests.values()) {
            if (req != null && "ACCEPTED".equalsIgnoreCase(req.getStatus())) {
                String sId = req.getSenderId() != null ? req.getSenderId().toLowerCase() : "";
                String rId = req.getRecipientId() != null ? req.getRecipientId().toLowerCase() : "";
                if (curId.equalsIgnoreCase(sId) && !rId.isEmpty()) {
                    connectedUserIds.add(rId);
                    if (req.getConversationId() != null)
                        userConvIdMap.put(rId, req.getConversationId());
                } else if (curId.equalsIgnoreCase(rId) && !sId.isEmpty()) {
                    connectedUserIds.add(sId);
                    if (req.getConversationId() != null)
                        userConvIdMap.put(sId, req.getConversationId());
                }
            }
        }

        // 1. Staff Members Directory (Class Advisors, HOD, Principal, Administration)
        if (includeStaff) {
            Map<String, UserProfile> staffMap = new LinkedHashMap<>();
            for (String staffUser : List.of("arularasi", "divyabharathi", "rajavathijayapriya", "gopinath",
                    "bsanjaygandhi", "admin")) {
                UserProfile s = findUserFast(staffUser);
                if (s != null)
                    staffMap.put(s.getIdentifier().toLowerCase(), s);
            }

            try {
                var staffSnap = db.collection("staff").limit(50).get().get();
                for (DocumentSnapshot doc : staffSnap.getDocuments()) {
                    if (doc.exists()) {
                        String uId = doc.getString("username") != null ? doc.getString("username") : doc.getId();
                        if (!staffMap.containsKey(uId.toLowerCase())) {
                            UserProfile p = new UserProfile();
                            p.setId(doc.getId());
                            p.setIdentifier(uId);
                            p.setName(doc.getString("name"));
                            p.setEmail(doc.getString("email"));
                            p.setSection(doc.getString("section"));
                            p.setDepartment(doc.getString("dept") != null ? doc.getString("dept")
                                    : "Computer Science & Engineering");
                            String roleStr = doc.getString("role");
                            p.setRole(roleStr != null ? UserRole.valueOf(roleStr) : UserRole.ADVISOR);
                            p.setAcademicYear("Staff / Faculty");
                            staffMap.put(uId.toLowerCase(), p);
                        }
                    }
                }
            } catch (Exception ignored) {
            }

            for (UserProfile s : staffMap.values()) {
                String staffId = s.getIdentifier() != null ? s.getIdentifier().toLowerCase() : "";
                if (staffId.equalsIgnoreCase(curId))
                    continue; // Skip self

                String sRole = s.getRole() != null ? s.getRole().name() : "STAFF";
                if (!"ALL".equals(filterRole) && !"STAFF".equals(filterRole) && !"FACULTY".equals(filterRole)
                        && !filterRole.equals(sRole)) {
                    continue;
                }

                String name = s.getName() != null ? s.getName() : "";
                String dept = s.getDepartment() != null ? s.getDepartment() : "Computer Science & Engineering";
                String sec = s.getSection() != null ? s.getSection() : "ALL";

                if (!cleanQ.isEmpty()) {
                    boolean matches = name.toLowerCase().contains(cleanQ)
                            || staffId.contains(cleanQ)
                            || sRole.toLowerCase().contains(cleanQ)
                            || dept.toLowerCase().contains(cleanQ)
                            || sec.toLowerCase().contains(cleanQ);
                    if (!matches)
                        continue;
                }

                Map<String, Object> map = new HashMap<>();
                map.put("identifier", s.getIdentifier());
                map.put("name", name);
                map.put("role", sRole);
                map.put("department", dept);
                map.put("section", sec);
                map.put("academicYear", "Staff / Faculty");
                map.put("isOnline", true);
                String sPhoto = s.getProfilePhoto() != null ? s.getProfilePhoto() : UserService.getCachedPhoto(staffId);
                map.put("profilePhoto", sPhoto != null ? sPhoto : "");
                map.put("photoUrl", sPhoto != null ? sPhoto : "");
                boolean hasConv = connectedUserIds.contains(staffId);
                map.put("hasExistingConversation", hasConv);
                map.put("conversationId", userConvIdMap.get(staffId));
                results.add(map);
            }
        }

        // 2. Students Directory
        if (includeStudents) {
            Map<String, UserProfile> students = new LinkedHashMap<>(InstitutionalRoster.getAllStudents());
            try {
                if (!cleanQ.isEmpty() && cleanQ.matches("\\d+")) {
                    DocumentSnapshot sDoc = db.collection("students").document(cleanQ).get().get();
                    if (sDoc.exists()) {
                        UserProfile sp = new UserProfile();
                        sp.setId(sDoc.getId());
                        sp.setIdentifier(sDoc.getString("regNo") != null ? sDoc.getString("regNo") : sDoc.getId());
                        sp.setName(sDoc.getString("name"));
                        sp.setSection(sDoc.getString("section"));
                        sp.setDepartment(sDoc.getString("dept") != null ? sDoc.getString("dept")
                                : "Computer Science & Engineering");
                        sp.setRole(UserRole.STUDENT);
                        students.put(sp.getIdentifier(), sp);
                    }
                }
            } catch (Exception ignored) {
            }

            for (UserProfile st : students.values()) {
                String regNo = st.getIdentifier();
                String stId = regNo.toLowerCase();
                if (stId.equalsIgnoreCase(curId))
                    continue; // Skip self

                String name = st.getName() != null ? st.getName() : "";
                String dept = st.getDepartment() != null ? st.getDepartment() : "Computer Science & Engineering";
                String sec = st.getSection() != null ? st.getSection() : "CSE-A";

                if (!cleanQ.isEmpty()) {
                    boolean matches = name.toLowerCase().contains(cleanQ)
                            || regNo.toLowerCase().contains(cleanQ)
                            || sec.toLowerCase().contains(cleanQ)
                            || dept.toLowerCase().contains(cleanQ);
                    if (!matches)
                        continue;
                }

                Map<String, Object> map = new HashMap<>();
                map.put("identifier", regNo);
                map.put("name", name);
                map.put("role", "STUDENT");
                map.put("department", dept);
                map.put("section", sec);
                map.put("academicYear", UserService.CURRENT_ACADEMIC_YEAR);
                map.put("isOnline", true);
                String stPhoto = st.getProfilePhoto() != null ? st.getProfilePhoto() : UserService.getCachedPhoto(stId);
                map.put("profilePhoto", stPhoto != null ? stPhoto : "");
                map.put("photoUrl", stPhoto != null ? stPhoto : "");
                boolean hasConv = connectedUserIds.contains(stId);
                map.put("hasExistingConversation", hasConv);
                map.put("conversationId", userConvIdMap.get(stId));
                results.add(map);
            }
        }

        // Sort: existing conversations or prefix matches first, then staff/faculty,
        // then alphabetically
        results.sort((a, b) -> {
            boolean aHas = Boolean.TRUE.equals(a.get("hasExistingConversation"));
            boolean bHas = Boolean.TRUE.equals(b.get("hasExistingConversation"));
            if (aHas != bHas)
                return bHas ? 1 : -1;

            if (!cleanQ.isEmpty()) {
                boolean aExact = String.valueOf(a.get("identifier")).equalsIgnoreCase(cleanQ)
                        || String.valueOf(a.get("name")).toLowerCase().startsWith(cleanQ);
                boolean bExact = String.valueOf(b.get("identifier")).equalsIgnoreCase(cleanQ)
                        || String.valueOf(b.get("name")).toLowerCase().startsWith(cleanQ);
                if (aExact != bExact)
                    return bExact ? 1 : -1;
            }

            boolean aIsStaff = !"STUDENT".equals(a.get("role"));
            boolean bIsStaff = !"STUDENT".equals(b.get("role"));
            if (aIsStaff != bIsStaff)
                return bIsStaff ? 1 : -1;

            return String.valueOf(a.get("name")).compareToIgnoreCase(String.valueOf(b.get("name")));
        });

        // Pagination
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int safePage = Math.max(0, page);
        int fromIndex = safePage * safeLimit;
        if (fromIndex >= results.size()) {
            return Collections.emptyList();
        }
        int toIndex = Math.min(fromIndex + safeLimit, results.size());
        return results.subList(fromIndex, toIndex);
    }

    public ChatMessageRequest sendMessageRequest(UserProfile sender, String recipientId, String introMessage)
            throws ExecutionException, InterruptedException {
        if (sender == null) {
            throw new SecurityException("User session not authenticated.");
        }

        String cleanRecip = (recipientId != null ? recipientId.trim() : "");
        if ("advisor".equalsIgnoreCase(cleanRecip) || "class_advisor".equalsIgnoreCase(cleanRecip)
                || "my_advisor".equalsIgnoreCase(cleanRecip)) {
            cleanRecip = OdService.getAdvisorForSection(sender.getSection());
        } else if ("hod".equalsIgnoreCase(cleanRecip) || "head_of_department".equalsIgnoreCase(cleanRecip)) {
            cleanRecip = "gopinath";
        } else if ("principal".equalsIgnoreCase(cleanRecip) || "executive_principal".equalsIgnoreCase(cleanRecip)) {
            cleanRecip = "bsanjaygandhi";
        }

        if (cleanRecip.isEmpty()) {
            throw new IllegalArgumentException("Recipient registration number or staff username is required.");
        }
        if (cleanRecip.equalsIgnoreCase(sender.getIdentifier())) {
            throw new IllegalArgumentException("You cannot send a message request to yourself.");
        }

        UserProfile recipient = findUserFast(cleanRecip);
        if (recipient == null) {
            throw new IllegalArgumentException("Recipient not found: " + cleanRecip);
        }

        // Section & role permission routing:
        // A student may only contact peer students, their assigned Section Advisor,
        // HOD, or Principal.
        if (sender.getRole() == UserRole.STUDENT) {
            if (recipient.getRole() == UserRole.ADVISOR) {
                String expectedAdvisor = OdService.getAdvisorForSection(sender.getSection());
                boolean matches = recipient.getIdentifier().equalsIgnoreCase(expectedAdvisor);
                if (!matches) {
                    String uSec = sender.getSection() != null ? sender.getSection().replaceAll("(?i)CSE-?", "").trim()
                            : "";
                    String sSec = recipient.getSection() != null
                            ? recipient.getSection().replaceAll("(?i)CSE-?", "").trim()
                            : "";
                    matches = (!uSec.isEmpty() && (uSec.equalsIgnoreCase(sSec) || (sender.getSection() != null
                            && sender.getSection().equalsIgnoreCase(recipient.getSection()))));
                }
                if (!matches) {
                    throw new SecurityException(
                            "Unauthorized: Students may only initiate contact with their assigned Section Advisor ("
                                    + sender.getSection() + ").");
                }
            }
        }

        if (sender.getRole() == UserRole.ADVISOR && recipient.getRole() == UserRole.STUDENT) {
            String advSec = sender.getSection() != null ? sender.getSection().replaceAll("(?i)CSE-?", "").trim() : "";
            String stuSec = recipient.getSection() != null ? recipient.getSection().replaceAll("(?i)CSE-?", "").trim()
                    : "";
            if (!advSec.isEmpty() && !stuSec.isEmpty() && !advSec.equalsIgnoreCase(stuSec)) {
                throw new SecurityException(
                        "Unauthorized: Class Advisors may only initiate conversations with students in their assigned section ("
                                + sender.getSection() + ").");
            }
        }

        boolean isStudentToStudent = (recipient.getRole() == UserRole.STUDENT);

        // 1. Check if an active conversation already exists
        String convIdA = "conv_" + sender.getIdentifier().toLowerCase() + "_" + recipient.getIdentifier().toLowerCase();
        String convIdB = "conv_" + recipient.getIdentifier().toLowerCase() + "_" + sender.getIdentifier().toLowerCase();
        ChatConversation existingConv = localConversations.get(convIdA);
        if (existingConv == null)
            existingConv = localConversations.get(convIdB);
        if (existingConv == null) {
            try {
                DocumentSnapshot cA = db.collection("conversations").document(convIdA).get().get();
                DocumentSnapshot cB = db.collection("conversations").document(convIdB).get().get();
                DocumentSnapshot existingSnap = (cA != null && cA.exists()) ? cA
                        : ((cB != null && cB.exists()) ? cB : null);
                if (existingSnap != null) {
                    existingConv = existingSnap.toObject(ChatConversation.class);
                }
            } catch (Exception ignored) {
            }
        }

        // Also check if an ACCEPTED request already exists between them
        if (existingConv == null) {
            String sId = sender.getIdentifier().toLowerCase();
            String rId = recipient.getIdentifier().toLowerCase();
            for (ChatMessageRequest r : localRequests.values()) {
                if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())) {
                    String reqS = r.getSenderId() != null ? r.getSenderId().toLowerCase() : "";
                    String reqR = r.getRecipientId() != null ? r.getRecipientId().toLowerCase() : "";
                    if ((reqS.equals(sId) && reqR.equals(rId)) || (reqS.equals(rId) && reqR.equals(sId))) {
                        if (r.getConversationId() != null && !r.getConversationId().trim().isEmpty()) {
                            existingConv = localConversations.get(r.getConversationId().trim());
                            if (existingConv == null) {
                                try {
                                    DocumentSnapshot snap = db.collection("conversations")
                                            .document(r.getConversationId().trim()).get().get();
                                    if (snap != null && snap.exists()) {
                                        existingConv = snap.toObject(ChatConversation.class);
                                    }
                                } catch (Exception ignored) {
                                }
                            }
                        }
                        if (existingConv == null) {
                            Map<String, ChatConversation> temp = new HashMap<>();
                            resolveAndAttachConversation(r, temp);
                            existingConv = temp.get(r.getConversationId());
                            if (existingConv == null && !temp.isEmpty()) {
                                existingConv = temp.values().iterator().next();
                            }
                        }
                        break;
                    }
                }
            }
        }

        if (existingConv != null) {
            enrichConversation(existingConv, sender);
            localConversations.put(existingConv.getId(), existingConv);
            try {
                db.collection("conversations").document(existingConv.getId())
                        .set(existingConv, com.google.cloud.firestore.SetOptions.merge()).get();
            } catch (Exception ignored) {
            }

            String cleanIntro = introMessage != null ? introMessage.trim() : "";
            if (!cleanIntro.isEmpty()) {
                try {
                    sendMessage(sender, existingConv.getId(), cleanIntro);
                } catch (Exception ignored) {
                }
            }

            ChatMessageRequest req = new ChatMessageRequest();
            req.setId("EXISTING-" + existingConv.getId());
            req.setConversationId(existingConv.getId());
            req.setStatus("ACCEPTED");
            req.setSenderId(sender.getIdentifier());
            req.setSenderName(sender.getName());
            req.setSenderRole(sender.getRole().name());
            req.setSenderSection(sender.getSection());
            req.setSenderDept(sender.getDepartment());
            req.setRecipientId(recipient.getIdentifier());
            req.setRecipientName(recipient.getName());
            req.setRecipientRole(recipient.getRole().name());
            req.setRecipientSection(recipient.getSection() != null ? recipient.getSection() : "ALL");
            req.setRecipientDept(recipient.getDepartment());
            req.setIntroMessage(cleanIntro);
            req.setTimestamp(LocalDateTime.now().format(formatter));
            req.setCreatedAt(existingConv.getUpdatedAt());
            req.setRespondedAt(existingConv.getUpdatedAt());
            return req;
        }

        // 2. Check if a PENDING message request already exists between them in either
        // direction
        boolean hasLocalPending = localRequests.values().stream()
                .anyMatch(r -> "PENDING".equalsIgnoreCase(r.getStatus()) &&
                        ((r.getSenderId().equalsIgnoreCase(sender.getIdentifier())
                                && r.getRecipientId().equalsIgnoreCase(recipient.getIdentifier())) ||
                                (r.getSenderId().equalsIgnoreCase(recipient.getIdentifier())
                                        && r.getRecipientId().equalsIgnoreCase(sender.getIdentifier()))));
        if (hasLocalPending) {
            throw new IllegalArgumentException("A message request is already pending between both participants.");
        }

        try {
            // Use single-field query to avoid Firestore composite index requirement
            var sentSnaps = db.collection("chat_requests")
                    .whereEqualTo("senderId", sender.getIdentifier())
                    .limit(20)
                    .get().get();
            for (DocumentSnapshot d : sentSnaps.getDocuments()) {
                ChatMessageRequest r = d.toObject(ChatMessageRequest.class);
                if (r != null && recipient.getIdentifier().equalsIgnoreCase(r.getRecipientId())
                        && "PENDING".equalsIgnoreCase(r.getStatus())) {
                    throw new IllegalArgumentException("A message request is already pending with this "
                            + (isStudentToStudent ? "student" : "staff member") + ".");
                }
            }

            var recSnaps = db.collection("chat_requests")
                    .whereEqualTo("recipientId", sender.getIdentifier())
                    .limit(20)
                    .get().get();
            for (DocumentSnapshot d : recSnaps.getDocuments()) {
                ChatMessageRequest r = d.toObject(ChatMessageRequest.class);
                if (r != null && recipient.getIdentifier().equalsIgnoreCase(r.getSenderId())
                        && "PENDING".equalsIgnoreCase(r.getStatus())) {
                    throw new IllegalArgumentException("This " + (isStudentToStudent ? "student" : "staff member")
                            + " has already sent you a message request. Please check your Requests tab.");
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ignored) {
        }

        String reqId = "MREQ-" + System.currentTimeMillis() + "-" + (int) (1000 + Math.random() * 9000);
        String timestamp = LocalDateTime.now().format(formatter);
        long nowMs = System.currentTimeMillis();

        String cleanIntro = introMessage != null ? introMessage.trim() : "";
        if (cleanIntro.length() > 500) {
            cleanIntro = cleanIntro.substring(0, 500);
        }

        ChatMessageRequest req = new ChatMessageRequest();
        req.setId(reqId);
        req.setSenderId(sender.getIdentifier());
        req.setSenderName(sender.getName());
        req.setSenderRole(sender.getRole().name());
        req.setSenderDept(sender.getDepartment());
        req.setSenderSection(sender.getSection());
        req.setSenderAcademicYear(
                sender.getRole() == UserRole.STUDENT ? UserService.CURRENT_ACADEMIC_YEAR : "Staff / Faculty");
        req.setRecipientId(recipient.getIdentifier());
        req.setRecipientName(recipient.getName());
        req.setRecipientRole(recipient.getRole().name());
        req.setRecipientDept(recipient.getDepartment());
        req.setRecipientSection(recipient.getSection() != null ? recipient.getSection() : "ALL");
        String reqType = "STUDENT_STAFF";
        if (sender.getRole() == UserRole.STUDENT && recipient.getRole() == UserRole.STUDENT) {
            reqType = "STUDENT_STUDENT";
        } else if (sender.getRole() == UserRole.STUDENT && recipient.getRole() != UserRole.STUDENT) {
            reqType = "STUDENT_STAFF";
        } else if (sender.getRole() != UserRole.STUDENT && recipient.getRole() == UserRole.STUDENT) {
            reqType = "STAFF_STUDENT";
        } else {
            reqType = "STAFF_STAFF";
        }
        req.setRequestType(reqType);
        req.setIntroMessage(cleanIntro);
        req.setStatus("PENDING");
        req.setTimestamp(timestamp);
        req.setCreatedAt(nowMs);

        localRequests.put(reqId, req);
        try {
            db.collection("chat_requests").document(reqId).set(req).get();
        } catch (Exception ex) {
            System.err.println("[ChatService] Notice: Firestore write failed (" + ex.getMessage()
                    + "), preserved in memory: " + reqId);
        }

        // Notify recipient (Student or Staff)
        try {
            notificationService.createNotification(
                    recipient.getIdentifier(),
                    "New Message Request from " + sender.getName(),
                    !cleanIntro.isEmpty() ? cleanIntro
                            : "Requested to start a direct academic conversation with you on EPOCH.",
                    "MESSAGE_REQUEST",
                    reqId,
                    null,
                    recipient.getRole().name());
        } catch (Exception ignored) {
        }

        // Invalidate sync cache for both participants so request is immediately visible
        lastReqSyncTimestamps.remove("sent_" + sender.getIdentifier());
        lastReqSyncTimestamps.remove("rec_" + recipient.getIdentifier());
        lastSyncTimestamps.remove(sender.getIdentifier());
        lastSyncTimestamps.remove(recipient.getIdentifier());

        return req;
    }

    public Set<String> getCandidateIds(UserProfile user) {
        Set<String> candidateIds = new LinkedHashSet<>();
        if (user == null)
            return candidateIds;
        if (user.getIdentifier() != null && !user.getIdentifier().trim().isEmpty()) {
            candidateIds.add(user.getIdentifier().trim());
            candidateIds.add(user.getIdentifier().trim().toLowerCase());
        }
        if (user.getId() != null && !user.getId().trim().isEmpty()) {
            candidateIds.add(user.getId().trim());
            candidateIds.add(user.getId().trim().toLowerCase());
        }
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            candidateIds.add(user.getEmail().trim());
            candidateIds.add(user.getEmail().trim().toLowerCase());
        }
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            candidateIds.add(user.getUsername().trim());
            candidateIds.add(user.getUsername().trim().toLowerCase());
        }
        if ("bsanjaygandhi".equalsIgnoreCase(user.getIdentifier())) {
            candidateIds.add("principal");
            candidateIds.add("principal@gct.ac.in");
            candidateIds.add("principal.demo@epoch.edu");
        } else if ("gopinath".equalsIgnoreCase(user.getIdentifier())) {
            candidateIds.add("hod");
            candidateIds.add("hod@gct.ac.in");
            candidateIds.add("hod.demo@epoch.edu");
        } else if ("divyabharathi".equalsIgnoreCase(user.getIdentifier())) {
            candidateIds.add("dhivyabharathi");
            candidateIds.add("dhivya");
            candidateIds.add("divyabharathi@gct.ac.in");
            candidateIds.add("advisor.b.demo@epoch.edu");
        } else if ("rajavathijayapriya".equalsIgnoreCase(user.getIdentifier())) {
            candidateIds.add("rajavathi");
            candidateIds.add("rajavathijayapriya@gct.ac.in");
            candidateIds.add("advisor.c.demo@epoch.edu");
        } else if ("arularasi".equalsIgnoreCase(user.getIdentifier())) {
            candidateIds.add("arularasi@gct.ac.in");
            candidateIds.add("advisor.demo@epoch.edu");
        }
        return candidateIds;
    }

    public boolean isUserAuthorizedParticipant(UserProfile user, ChatConversation conv) {
        if (user == null || conv == null)
            return false;
        Set<String> candidateIds = getCandidateIds(user);
        if (conv.getParticipants() != null) {
            for (String p : conv.getParticipants()) {
                if (p != null && (candidateIds.contains(p) || candidateIds.contains(p.toLowerCase()))) {
                    return true;
                }
            }
        }
        if (conv.getStudentRegNo() != null && (candidateIds.contains(conv.getStudentRegNo())
                || candidateIds.contains(conv.getStudentRegNo().toLowerCase()))) {
            return true;
        }
        if (conv.getStaffUsername() != null && (candidateIds.contains(conv.getStaffUsername())
                || candidateIds.contains(conv.getStaffUsername().toLowerCase()))) {
            return true;
        }
        if (conv.getSenderId() != null && (candidateIds.contains(conv.getSenderId())
                || candidateIds.contains(conv.getSenderId().toLowerCase()))) {
            return true;
        }
        if (conv.getRecipientId() != null && (candidateIds.contains(conv.getRecipientId())
                || candidateIds.contains(conv.getRecipientId().toLowerCase()))) {
            return true;
        }
        if (conv.getId() != null && conv.getId().startsWith("conv_")) {
            String[] parts = conv.getId().substring(5).split("_");
            for (String part : parts) {
                if (candidateIds.contains(part) || candidateIds.contains(part.toLowerCase())) {
                    return true;
                }
            }
        }
        return false;
    }

    public void enrichConversation(ChatConversation c, UserProfile currentUser) {
        if (c == null)
            return;
        boolean needsFirestoreUpdate = false;

        String idA = c.getStudentRegNo();
        String idB = c.getStaffUsername();

        if ((idA == null || idA.trim().isEmpty() || idB == null || idB.trim().isEmpty()) && c.getId() != null
                && c.getId().startsWith("conv_")) {
            String[] parts = c.getId().substring(5).split("_");
            if (parts.length >= 2) {
                if (idA == null || idA.trim().isEmpty())
                    idA = parts[0];
                if (idB == null || idB.trim().isEmpty())
                    idB = parts[1];
                c.setStudentRegNo(idA);
                c.setStaffUsername(idB);
                needsFirestoreUpdate = true;
            }
        }

        UserProfile userA = null;
        UserProfile userB = null;

        try {
            if (idA != null)
                userA = findUserFast(idA);
            if (idB != null)
                userB = findUserFast(idB);
        } catch (Exception ignored) {
        }

        if (userA != null) {
            if (c.getStudentName() == null || c.getStudentName().trim().isEmpty()
                    || c.getStudentName().equalsIgnoreCase(idA)) {
                c.setStudentName(userA.getName());
                needsFirestoreUpdate = true;
            }
            if (c.getStudentSection() == null || c.getStudentSection().trim().isEmpty()) {
                c.setStudentSection(userA.getSection());
                needsFirestoreUpdate = true;
            }
            if (c.getStudentRole() == null || c.getStudentRole().trim().isEmpty()) {
                c.setStudentRole(userA.getRole().name());
                needsFirestoreUpdate = true;
            }
        }

        if (userB != null) {
            if (c.getStaffName() == null || c.getStaffName().trim().isEmpty()
                    || c.getStaffName().equalsIgnoreCase(idB)) {
                c.setStaffName(userB.getName());
                needsFirestoreUpdate = true;
            }
            if (c.getStaffSection() == null || c.getStaffSection().trim().isEmpty()) {
                c.setStaffSection(userB.getSection());
                needsFirestoreUpdate = true;
            }
            if (c.getStaffRole() == null || c.getStaffRole().trim().isEmpty()) {
                c.setStaffRole(userB.getRole().name());
                needsFirestoreUpdate = true;
            }
        }

        boolean isPeerStudents = (userA != null && userA.getRole() == UserRole.STUDENT) &&
                (userB != null && userB.getRole() == UserRole.STUDENT);
        boolean isPeerStaff = (userA != null && userA.getRole() != UserRole.STUDENT) &&
                (userB != null && userB.getRole() != UserRole.STUDENT);

        if (c.getType() == null || c.getType().trim().isEmpty() || (isPeerStaff && !"STAFF_STAFF".equals(c.getType()))
                || (isPeerStudents && !"STUDENT_STUDENT".equals(c.getType()))) {
            if (isPeerStudents) {
                c.setType("STUDENT_STUDENT");
            } else if (isPeerStaff) {
                c.setType("STAFF_STAFF");
            } else {
                c.setType("STUDENT_STAFF");
            }
            needsFirestoreUpdate = true;
        }

        Set<String> allParts = new LinkedHashSet<>();
        if (c.getParticipants() != null) {
            allParts.addAll(c.getParticipants());
        }
        if (idA != null) {
            allParts.add(idA);
            allParts.add(idA.toLowerCase());
        }
        if (idB != null) {
            allParts.add(idB);
            allParts.add(idB.toLowerCase());
        }
        if (userA != null) {
            if (userA.getId() != null)
                allParts.add(userA.getId());
            if (userA.getEmail() != null)
                allParts.add(userA.getEmail().toLowerCase());
            allParts.addAll(getCandidateIds(userA));
        }
        if (userB != null) {
            if (userB.getId() != null)
                allParts.add(userB.getId());
            if (userB.getEmail() != null)
                allParts.add(userB.getEmail().toLowerCase());
            allParts.addAll(getCandidateIds(userB));
        }

        if (c.getParticipants() == null || c.getParticipants().size() != allParts.size()) {
            c.setParticipants(new ArrayList<>(allParts));
            needsFirestoreUpdate = true;
        }

        if (needsFirestoreUpdate && c.getId() != null) {
            try {
                db.collection("conversations").document(c.getId()).set(c,
                        com.google.cloud.firestore.SetOptions.merge());
            } catch (Exception ignored) {
            }
        }
    }

    public List<ChatMessageRequest> getReceivedRequests(UserProfile user)
            throws ExecutionException, InterruptedException {
        Set<String> candidateIds = getCandidateIds(user);
        Map<String, ChatMessageRequest> map = new LinkedHashMap<>();

        long now = System.currentTimeMillis();
        String userKey = "rec_" + (user != null ? user.getIdentifier() : "default");
        boolean shouldQueryFirestore = (now - lastReqSyncTimestamps.getOrDefault(userKey, 0L) > 15_000L);

        if (shouldQueryFirestore) {
            lastReqSyncTimestamps.put(userKey, now);
            try {
                for (String cid : candidateIds) {
                    var snap = db.collection("chat_requests")
                            .whereEqualTo("recipientId", cid)
                            .limit(25)
                            .get().get();
                    for (DocumentSnapshot doc : snap.getDocuments()) {
                        ChatMessageRequest req = doc.toObject(ChatMessageRequest.class);
                        if (req != null) {
                            map.put(doc.getId(), req);
                            localRequests.put(doc.getId(), req);
                        }
                    }
                }
            } catch (Exception ex) {
                // Quota exceeded or network error: back off Firestore calls for 60 seconds
                lastReqSyncTimestamps.put(userKey, now + 45_000L);
            }
        }

        for (ChatMessageRequest lr : localRequests.values()) {
            if (candidateIds.contains(lr.getRecipientId())
                    || (lr.getRecipientId() != null && candidateIds.contains(lr.getRecipientId().toLowerCase()))) {
                map.put(lr.getId(), lr);
            }
        }

        List<ChatMessageRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
        return list;
    }

    public List<ChatMessageRequest> getSentRequests(UserProfile user) throws ExecutionException, InterruptedException {
        Set<String> candidateIds = getCandidateIds(user);
        Map<String, ChatMessageRequest> map = new LinkedHashMap<>();

        long now = System.currentTimeMillis();
        String userKey = "sent_" + (user != null ? user.getIdentifier() : "default");
        boolean shouldQueryFirestore = (now - lastReqSyncTimestamps.getOrDefault(userKey, 0L) > 15_000L);

        if (shouldQueryFirestore) {
            lastReqSyncTimestamps.put(userKey, now);
            try {
                for (String cid : candidateIds) {
                    var snap = db.collection("chat_requests")
                            .whereEqualTo("senderId", cid)
                            .limit(25)
                            .get().get();
                    for (DocumentSnapshot doc : snap.getDocuments()) {
                        ChatMessageRequest req = doc.toObject(ChatMessageRequest.class);
                        if (req != null) {
                            map.put(doc.getId(), req);
                            localRequests.put(doc.getId(), req);
                        }
                    }
                }
            } catch (Exception ex) {
                // Quota exceeded or network error: back off Firestore calls for 60 seconds
                lastReqSyncTimestamps.put(userKey, now + 45_000L);
            }
        }

        for (ChatMessageRequest lr : localRequests.values()) {
            if (candidateIds.contains(lr.getSenderId())
                    || (lr.getSenderId() != null && candidateIds.contains(lr.getSenderId().toLowerCase()))) {
                map.put(lr.getId(), lr);
            }
        }

        List<ChatMessageRequest> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
        return list;
    }

    public int reconcileAcceptedRequests() {
        int reconciledCount = 0;
        try {
            List<ChatMessageRequest> acceptedList = new ArrayList<>();
            try {
                var snap = db.collection("chat_requests").whereEqualTo("status", "ACCEPTED").limit(100).get().get();
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    ChatMessageRequest r = doc.toObject(ChatMessageRequest.class);
                    if (r != null) {
                        r.setId(doc.getId());
                        acceptedList.add(r);
                        localRequests.put(r.getId(), r);
                    }
                }
            } catch (Exception ex) {
                try {
                    var allSnap = db.collection("chat_requests").limit(100).get().get();
                    for (DocumentSnapshot doc : allSnap.getDocuments()) {
                        ChatMessageRequest r = doc.toObject(ChatMessageRequest.class);
                        if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())) {
                            r.setId(doc.getId());
                            acceptedList.add(r);
                            localRequests.put(r.getId(), r);
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            for (ChatMessageRequest r : localRequests.values()) {
                if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())) {
                    if (acceptedList.stream().noneMatch(x -> x.getId().equals(r.getId()))) {
                        acceptedList.add(r);
                    }
                }
            }

            for (ChatMessageRequest req : acceptedList) {
                if (req.getSenderId() == null || req.getRecipientId() == null)
                    continue;
                String sId = req.getSenderId().toLowerCase();
                String rId = req.getRecipientId().toLowerCase();
                String canonId = (sId.compareTo(rId) <= 0) ? ("conv_" + sId + "_" + rId) : ("conv_" + rId + "_" + sId);
                String convId = req.getConversationId();
                if (convId == null || convId.trim().isEmpty()) {
                    convId = canonId;
                    req.setConversationId(convId);
                }

                ChatConversation conv = localConversations.get(convId);
                if (conv == null)
                    conv = localConversations.get(canonId);

                DocumentReference convRef = db.collection("conversations").document(convId);
                if (conv == null) {
                    try {
                        DocumentSnapshot snap = convRef.get().get();
                        if (snap != null && snap.exists()) {
                            conv = snap.toObject(ChatConversation.class);
                        }
                    } catch (Exception ignored) {
                    }
                }

                Set<String> allParticipants = new LinkedHashSet<>();
                allParticipants.add(req.getSenderId());
                allParticipants.add(sId);
                allParticipants.add(req.getRecipientId());
                allParticipants.add(rId);

                UserProfile userA = null;
                UserProfile userB = null;
                try {
                    userA = findUserFast(req.getSenderId());
                    userB = findUserFast(req.getRecipientId());
                } catch (Exception ignored) {
                }
                if (userA != null)
                    allParticipants.addAll(getCandidateIds(userA));
                if (userB != null)
                    allParticipants.addAll(getCandidateIds(userB));

                boolean needsWrite = false;
                if (conv == null) {
                    conv = new ChatConversation();
                    conv.setId(convId);
                    conv.setParticipants(new ArrayList<>(allParticipants));
                    conv.setStudentRegNo(req.getSenderId());
                    conv.setStudentName(req.getSenderName());
                    conv.setStudentSection(req.getSenderSection());
                    conv.setStudentRole(req.getSenderRole() != null ? req.getSenderRole() : "STUDENT");
                    conv.setStaffUsername(req.getRecipientId());
                    conv.setStaffName(req.getRecipientName());
                    conv.setStaffSection(req.getRecipientSection());
                    conv.setStaffRole(req.getRecipientRole() != null ? req.getRecipientRole() : "STUDENT");
                    conv.setType(req.getRequestType() != null ? req.getRequestType() : "STUDENT_STUDENT");
                    conv.setLastMessage(
                            req.getIntroMessage() != null && !req.getIntroMessage().isEmpty() ? req.getIntroMessage()
                                    : "Conversation established");
                    conv.setLastMessageTime(
                            req.getTimestamp() != null ? req.getTimestamp() : LocalDateTime.now().format(formatter));
                    conv.setLastMessageSender(req.getSenderName());
                    conv.setLastMessageSenderId(req.getSenderId());
                    conv.setLastMessageStatus("DELIVERED");
                    conv.setUpdatedAt(req.getRespondedAt() > 0 ? req.getRespondedAt()
                            : (req.getCreatedAt() > 0 ? req.getCreatedAt() : System.currentTimeMillis()));
                    needsWrite = true;
                } else {
                    if (conv.getParticipants() == null || conv.getParticipants().isEmpty()
                            || conv.getParticipants().size() < allParticipants.size()) {
                        Set<String> merged = new LinkedHashSet<>();
                        if (conv.getParticipants() != null)
                            merged.addAll(conv.getParticipants());
                        merged.addAll(allParticipants);
                        conv.setParticipants(new ArrayList<>(merged));
                        needsWrite = true;
                    }
                    if (conv.getLastMessage() == null || conv.getLastMessage().isEmpty()) {
                        conv.setLastMessage(req.getIntroMessage() != null && !req.getIntroMessage().isEmpty()
                                ? req.getIntroMessage()
                                : "Conversation established");
                        conv.setLastMessageTime(req.getTimestamp());
                        conv.setLastMessageSender(req.getSenderName());
                        conv.setLastMessageSenderId(req.getSenderId());
                        needsWrite = true;
                    }
                }

                enrichConversation(conv, null);
                localConversations.put(conv.getId(), conv);
                localConversations.put(canonId, conv);

                if (needsWrite) {
                    try {
                        convRef.set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
                    } catch (Exception ex) {
                        System.err.println("[ChatService] Reconcile write notice: " + ex.getMessage());
                    }
                }

                if (req.getConversationId() == null || !req.getConversationId().equals(convId)) {
                    req.setConversationId(convId);
                    try {
                        db.collection("chat_requests").document(req.getId()).update("conversationId", convId);
                    } catch (Exception ignored) {
                    }
                }

                reconciledCount++;
            }
        } catch (Exception ex) {
            System.err.println("[ChatService] Error during reconcileAcceptedRequests: " + ex.getMessage());
        }
        return reconciledCount;
    }

    public ChatConversation acceptMessageRequest(UserProfile recipient, String requestId)
            throws ExecutionException, InterruptedException {
        ChatMessageRequest req = localRequests.get(requestId);
        DocumentSnapshot doc = null;
        try {
            doc = db.collection("chat_requests").document(requestId).get().get();
            if (doc != null && doc.exists()) {
                ChatMessageRequest r = doc.toObject(ChatMessageRequest.class);
                if (r != null)
                    req = r;
            }
        } catch (Exception ignored) {
        }

        if (req == null) {
            throw new IllegalArgumentException("Message request not found: " + requestId);
        }

        Set<String> candidateIds = getCandidateIds(recipient);
        boolean isAuthorizedRecipient = candidateIds.contains(req.getRecipientId())
                || (req.getRecipientId() != null && candidateIds.contains(req.getRecipientId().toLowerCase()));
        if (!isAuthorizedRecipient) {
            throw new SecurityException("Unauthorized: Only the intended recipient can accept this message request.");
        }

        // Idempotent acceptance check: if already accepted, resolve and return the
        // existing active conversation safely!
        if ("ACCEPTED".equalsIgnoreCase(req.getStatus())) {
            String existingConvId = req.getConversationId();
            ChatConversation existing = null;
            if (existingConvId != null && !existingConvId.trim().isEmpty()) {
                existing = localConversations.get(existingConvId.trim());
                if (existing == null) {
                    try {
                        DocumentSnapshot convSnap = db.collection("conversations").document(existingConvId.trim()).get()
                                .get();
                        if (convSnap != null && convSnap.exists()) {
                            existing = convSnap.toObject(ChatConversation.class);
                            if (existing != null)
                                localConversations.put(existing.getId(), existing);
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            if (existing == null && req.getSenderId() != null && req.getRecipientId() != null) {
                String idA = req.getSenderId().toLowerCase();
                String idB = req.getRecipientId().toLowerCase();
                String canonId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB) : ("conv_" + idB + "_" + idA);
                existing = localConversations.get(canonId);
            }
            if (existing != null) {
                enrichConversation(existing, recipient);
                return existing;
            }
        }

        if (!"PENDING".equalsIgnoreCase(req.getStatus()) && !"ACCEPTED".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("This message request is already " + req.getStatus());
        }

        long nowMs = System.currentTimeMillis();
        String timestamp = LocalDateTime.now().format(formatter);

        boolean isPeerStudents = "STUDENT".equalsIgnoreCase(req.getSenderRole())
                && "STUDENT".equalsIgnoreCase(req.getRecipientRole());
        boolean isPeerStaff = !"STUDENT".equalsIgnoreCase(req.getSenderRole())
                && !"STUDENT".equalsIgnoreCase(req.getRecipientRole());

        String convId;
        ChatConversation conv;

        // Build comprehensive participant ID list including aliases
        Set<String> allParticipants = new LinkedHashSet<>();
        allParticipants.add(req.getSenderId());
        allParticipants.add(req.getSenderId().toLowerCase());
        allParticipants.add(req.getRecipientId());
        allParticipants.add(req.getRecipientId().toLowerCase());
        allParticipants.addAll(getCandidateIds(recipient));
        try {
            UserProfile senderProfile = "STUDENT".equalsIgnoreCase(req.getSenderRole())
                    ? userService.findStudent(req.getSenderId())
                    : userService.findStaff(req.getSenderId());
            if (senderProfile != null) {
                allParticipants.addAll(getCandidateIds(senderProfile));
            }
        } catch (Exception ignored) {
        }

        String introMsg = (req.getIntroMessage() != null && !req.getIntroMessage().trim().isEmpty())
                ? req.getIntroMessage().trim()
                : "";

        if (isPeerStudents) {
            String idA = req.getSenderId().toLowerCase();
            String idB = req.getRecipientId().toLowerCase();
            convId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB) : ("conv_" + idB + "_" + idA);

            conv = localConversations.get(convId);
            DocumentReference convRef = db.collection("conversations").document(convId);
            DocumentSnapshot convSnap = null;
            if (conv == null) {
                try {
                    convSnap = convRef.get().get();
                    if (convSnap != null && convSnap.exists()) {
                        conv = convSnap.toObject(ChatConversation.class);
                    }
                } catch (Exception ignored) {
                }
            }

            if (conv != null) {
                Map<String, Object> updates = new HashMap<>();
                updates.put("updatedAt", nowMs);
                updates.put("participants", new ArrayList<>(allParticipants));
                conv.setUpdatedAt(nowMs);
                conv.setParticipants(new ArrayList<>(allParticipants));
                if (conv.getStaffSection() == null && req.getRecipientSection() != null) {
                    updates.put("staffSection", req.getRecipientSection());
                    conv.setStaffSection(req.getRecipientSection());
                }
                if (!introMsg.isEmpty()) {
                    updates.put("lastMessage", introMsg);
                    updates.put("lastMessageTime", timestamp);
                    updates.put("lastMessageSender", req.getSenderName());
                    updates.put("lastMessageSenderId", req.getSenderId());
                    updates.put("lastMessageStatus", "DELIVERED");
                    conv.setLastMessage(introMsg);
                    conv.setLastMessageTime(timestamp);
                    conv.setLastMessageSender(req.getSenderName());
                    conv.setLastMessageSenderId(req.getSenderId());
                }
                try {
                    convRef.set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole("STUDENT");
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            } else {
                conv = new ChatConversation();
                conv.setId(convId);
                conv.setType("STUDENT_STUDENT");
                conv.setParticipants(new ArrayList<>(allParticipants));
                conv.setStudentRegNo(req.getSenderId());
                conv.setStudentName(req.getSenderName());
                conv.setStudentSection(req.getSenderSection());
                conv.setStudentRole("STUDENT");
                conv.setStaffUsername(req.getRecipientId());
                conv.setStaffName(req.getRecipientName());
                conv.setStaffRole("STUDENT");
                conv.setStaffSection(req.getRecipientSection());
                conv.setLastMessage(!introMsg.isEmpty() ? introMsg : "Conversation established");
                conv.setLastMessageTime(timestamp);
                conv.setLastMessageSender(req.getSenderName());
                conv.setLastMessageSenderId(req.getSenderId());
                conv.setLastMessageStatus("DELIVERED");
                conv.setUnreadCountStudent(0);
                conv.setUnreadCountStaff(0);
                conv.setUpdatedAt(nowMs);

                try {
                    convRef.set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole("STUDENT");
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            }
        } else if (isPeerStaff) {
            String idA = req.getSenderId().toLowerCase();
            String idB = req.getRecipientId().toLowerCase();
            convId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB) : ("conv_" + idB + "_" + idA);

            conv = localConversations.get(convId);
            DocumentReference convRef = db.collection("conversations").document(convId);
            DocumentSnapshot convSnap = null;
            if (conv == null) {
                try {
                    convSnap = convRef.get().get();
                    if (convSnap != null && convSnap.exists()) {
                        conv = convSnap.toObject(ChatConversation.class);
                    }
                } catch (Exception ignored) {
                }
            }

            if (conv != null) {
                Map<String, Object> updates = new HashMap<>();
                updates.put("updatedAt", nowMs);
                updates.put("participants", new ArrayList<>(allParticipants));
                conv.setUpdatedAt(nowMs);
                conv.setParticipants(new ArrayList<>(allParticipants));
                if (conv.getStaffSection() == null && req.getRecipientSection() != null) {
                    updates.put("staffSection", req.getRecipientSection());
                    conv.setStaffSection(req.getRecipientSection());
                }
                if (!introMsg.isEmpty()) {
                    updates.put("lastMessage", introMsg);
                    updates.put("lastMessageTime", timestamp);
                    updates.put("lastMessageSender", req.getSenderName());
                    updates.put("lastMessageSenderId", req.getSenderId());
                    updates.put("lastMessageStatus", "DELIVERED");
                    conv.setLastMessage(introMsg);
                    conv.setLastMessageTime(timestamp);
                    conv.setLastMessageSender(req.getSenderName());
                    conv.setLastMessageSenderId(req.getSenderId());
                }
                try {
                    convRef.set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole(req.getSenderRole());
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            } else {
                conv = new ChatConversation();
                conv.setId(convId);
                conv.setType("STAFF_STAFF");
                conv.setParticipants(new ArrayList<>(allParticipants));
                conv.setStudentRegNo(req.getSenderId());
                conv.setStudentName(req.getSenderName());
                conv.setStudentSection(req.getSenderSection());
                conv.setStudentRole(req.getSenderRole());
                conv.setStaffUsername(req.getRecipientId());
                conv.setStaffName(req.getRecipientName());
                conv.setStaffRole(req.getRecipientRole());
                conv.setStaffSection(req.getRecipientSection());
                conv.setLastMessage(!introMsg.isEmpty() ? introMsg : "Conversation established");
                conv.setLastMessageTime(timestamp);
                conv.setLastMessageSender(req.getSenderName());
                conv.setLastMessageSenderId(req.getSenderId());
                conv.setLastMessageStatus("DELIVERED");
                conv.setUnreadCountStudent(0);
                conv.setUnreadCountStaff(0);
                conv.setUpdatedAt(nowMs);

                try {
                    convRef.set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole(req.getSenderRole());
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            }
        } else {
            // One Student and One Staff
            String studentId, studentName, studentSection;
            String staffId, staffName, staffRole, staffSection;

            if ("STUDENT".equalsIgnoreCase(req.getSenderRole())) {
                studentId = req.getSenderId();
                studentName = req.getSenderName();
                studentSection = req.getSenderSection();
                staffId = req.getRecipientId();
                staffName = req.getRecipientName();
                staffRole = req.getRecipientRole() != null ? req.getRecipientRole() : "STAFF";
                staffSection = req.getRecipientSection();
            } else {
                studentId = req.getRecipientId();
                studentName = req.getRecipientName();
                studentSection = req.getRecipientSection();
                staffId = req.getSenderId();
                staffName = req.getSenderName();
                staffRole = req.getSenderRole() != null ? req.getSenderRole() : "STAFF";
                staffSection = req.getSenderSection();
            }

            convId = "conv_" + studentId.toLowerCase() + "_" + staffId.toLowerCase();

            conv = localConversations.get(convId);
            DocumentReference convRef = db.collection("conversations").document(convId);
            DocumentSnapshot convSnap = null;
            if (conv == null) {
                try {
                    convSnap = convRef.get().get();
                    if (convSnap != null && convSnap.exists()) {
                        conv = convSnap.toObject(ChatConversation.class);
                    }
                } catch (Exception ignored) {
                }
            }

            if (conv != null) {
                Map<String, Object> updates = new HashMap<>();
                updates.put("updatedAt", nowMs);
                updates.put("participants", new ArrayList<>(allParticipants));
                conv.setUpdatedAt(nowMs);
                conv.setParticipants(new ArrayList<>(allParticipants));
                if (conv.getStaffSection() == null && staffSection != null) {
                    updates.put("staffSection", staffSection);
                    conv.setStaffSection(staffSection);
                }
                if (!introMsg.isEmpty()) {
                    updates.put("lastMessage", introMsg);
                    updates.put("lastMessageTime", timestamp);
                    updates.put("lastMessageSender", req.getSenderName());
                    updates.put("lastMessageSenderId", req.getSenderId());
                    updates.put("lastMessageStatus", "DELIVERED");
                    conv.setLastMessage(introMsg);
                    conv.setLastMessageTime(timestamp);
                    conv.setLastMessageSender(req.getSenderName());
                    conv.setLastMessageSenderId(req.getSenderId());
                }
                try {
                    convRef.set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole(req.getSenderRole());
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            } else {
                conv = new ChatConversation();
                conv.setId(convId);
                conv.setType("STUDENT_STAFF");
                conv.setParticipants(new ArrayList<>(allParticipants));
                conv.setStudentRegNo(studentId);
                conv.setStudentName(studentName);
                conv.setStudentSection(studentSection);
                conv.setStudentRole("STUDENT");
                conv.setStaffUsername(staffId);
                conv.setStaffName(staffName);
                conv.setStaffRole(staffRole);
                conv.setStaffSection(staffSection);
                conv.setLastMessage(!introMsg.isEmpty() ? introMsg : "Conversation established");
                conv.setLastMessageTime(timestamp);
                conv.setLastMessageSender(req.getSenderName());
                conv.setLastMessageSenderId(req.getSenderId());
                conv.setLastMessageStatus("DELIVERED");
                conv.setUnreadCountStudent(0);
                conv.setUnreadCountStaff(0);
                conv.setUpdatedAt(nowMs);

                try {
                    convRef.set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (!introMsg.isEmpty()) {
                    String msgId = "MSG-" + nowMs + "-" + (int) (1000 + Math.random() * 9000);
                    ChatMessage msg = new ChatMessage();
                    msg.setId(msgId);
                    msg.setConversationId(convId);
                    msg.setSenderId(req.getSenderId());
                    msg.setSenderName(req.getSenderName());
                    msg.setSenderRole(req.getSenderRole());
                    msg.setRecipientId(req.getRecipientId());
                    msg.setContent(introMsg);
                    msg.setTimestamp(timestamp);
                    msg.setCreatedAt(nowMs);
                    msg.setDelivered(true);
                    msg.setRead(true);
                    msg.setStatus("READ");
                    localMessages.computeIfAbsent(convId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                            .add(msg);
                    try {
                        db.collection("chat_messages").document(msgId).set(msg).get();
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        req.setStatus("ACCEPTED");
        req.setConversationId(convId);
        req.setRespondedAt(nowMs);
        localRequests.put(requestId, req);
        if (conv != null) {
            enrichConversation(conv, recipient);
            localConversations.put(convId, conv);
            try {
                db.collection("conversations").document(convId).set(conv, com.google.cloud.firestore.SetOptions.merge())
                        .get();
            } catch (Exception ex) {
                System.err.println(
                        "[ChatService] Warning persisting accepted conversation to Firestore: " + ex.getMessage());
            }
        }

        // Atomically update request with status ACCEPTED and conversationId in
        // Firestore
        try {
            Map<String, Object> reqUpdates = new HashMap<>();
            reqUpdates.put("status", "ACCEPTED");
            reqUpdates.put("respondedAt", nowMs);
            reqUpdates.put("conversationId", convId);
            db.collection("chat_requests").document(requestId)
                    .set(reqUpdates, com.google.cloud.firestore.SetOptions.merge()).get();
        } catch (Exception ignored) {
        }

        // Notify original sender that their request was accepted
        notificationService.createNotification(
                req.getSenderId(),
                "Message Request Accepted",
                recipient.getName() + " accepted your message request. You can now chat directly!",
                "MESSAGE_REQUEST_ACCEPTED",
                convId,
                null,
                req.getSenderRole() != null ? req.getSenderRole() : "STUDENT");

        // Invalidate sync cache for both participants so the conversation and request
        // status appear immediately
        lastSyncTimestamps.remove(recipient.getIdentifier());
        lastSyncTimestamps.remove(req.getSenderId());
        lastReqSyncTimestamps.remove("rec_" + recipient.getIdentifier());
        lastReqSyncTimestamps.remove("sent_" + req.getSenderId());
        lastReqSyncTimestamps.remove("sent_" + recipient.getIdentifier());
        lastReqSyncTimestamps.remove("rec_" + req.getSenderId());

        return conv;
    }

    public ChatConversation getConversationForRequest(UserProfile user, String requestId)
            throws ExecutionException, InterruptedException {
        ChatMessageRequest req = localRequests.get(requestId);
        DocumentSnapshot doc = null;
        try {
            doc = db.collection("chat_requests").document(requestId).get().get();
            if (doc != null && doc.exists()) {
                ChatMessageRequest r = doc.toObject(ChatMessageRequest.class);
                if (r != null) {
                    req = r;
                    localRequests.put(requestId, r);
                }
            }
        } catch (Exception ignored) {
        }

        if (req == null) {
            throw new IllegalArgumentException("Message request not found: " + requestId);
        }

        Set<String> candidateIds = getCandidateIds(user);
        boolean isAuthorized = candidateIds.contains(req.getSenderId())
                || (req.getSenderId() != null && candidateIds.contains(req.getSenderId().toLowerCase()))
                || candidateIds.contains(req.getRecipientId())
                || (req.getRecipientId() != null && candidateIds.contains(req.getRecipientId().toLowerCase()));
        if (!isAuthorized) {
            throw new SecurityException("Unauthorized: You are not an authorized participant in this message request.");
        }

        if (!"ACCEPTED".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalStateException(
                    "Message request is not accepted yet (Current status: " + req.getStatus() + ").");
        }

        String convId = req.getConversationId();
        ChatConversation conv = null;
        if (convId != null && !convId.trim().isEmpty()) {
            conv = localConversations.get(convId.trim());
            if (conv == null) {
                try {
                    DocumentSnapshot convDoc = db.collection("conversations").document(convId.trim()).get().get();
                    if (convDoc != null && convDoc.exists()) {
                        conv = convDoc.toObject(ChatConversation.class);
                        if (conv != null)
                            localConversations.put(conv.getId(), conv);
                    }
                } catch (Exception ignored) {
                }
            }
            if (conv != null) {
                enrichConversation(conv, user);
                return conv;
            }
        }

        // Resolve canonical conversation ID if missing on document or in cache
        boolean isPeerStudents = "STUDENT".equalsIgnoreCase(req.getSenderRole())
                && "STUDENT".equalsIgnoreCase(req.getRecipientRole());
        boolean isPeerStaff = !"STUDENT".equalsIgnoreCase(req.getSenderRole())
                && !"STUDENT".equalsIgnoreCase(req.getRecipientRole());

        if (isPeerStudents || isPeerStaff) {
            String idA = req.getSenderId().toLowerCase();
            String idB = req.getRecipientId().toLowerCase();
            convId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB) : ("conv_" + idB + "_" + idA);
        } else {
            String studentId = "STUDENT".equalsIgnoreCase(req.getSenderRole()) ? req.getSenderId()
                    : req.getRecipientId();
            String staffId = "STUDENT".equalsIgnoreCase(req.getSenderRole()) ? req.getRecipientId() : req.getSenderId();
            convId = "conv_" + studentId.toLowerCase() + "_" + staffId.toLowerCase();
        }

        conv = localConversations.get(convId);
        if (conv == null) {
            try {
                DocumentSnapshot convDoc = db.collection("conversations").document(convId).get().get();
                if (convDoc != null && convDoc.exists()) {
                    conv = convDoc.toObject(ChatConversation.class);
                    if (conv != null) {
                        localConversations.put(conv.getId(), conv);
                        if (doc != null && doc.exists()) {
                            try {
                                doc.getReference().update("conversationId", convId);
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        if (conv != null) {
            enrichConversation(conv, user);
            return conv;
        }

        // If conversation document doesn't exist yet, construct and cache it
        conv = new ChatConversation();
        conv.setId(convId);
        conv.setType(isPeerStudents ? "STUDENT_STUDENT" : (isPeerStaff ? "STAFF_STAFF" : "STUDENT_STAFF"));
        conv.setStudentRegNo(req.getSenderId());
        conv.setStudentName(req.getSenderName());
        conv.setStudentSection(req.getSenderSection());
        conv.setStaffUsername(req.getRecipientId());
        conv.setStaffName(req.getRecipientName());
        conv.setStaffSection(req.getRecipientSection());
        conv.setLastMessage(req.getIntroMessage() != null && !req.getIntroMessage().isEmpty() ? req.getIntroMessage()
                : "Conversation established");
        conv.setLastMessageTime(
                req.getTimestamp() != null ? req.getTimestamp() : LocalDateTime.now().format(formatter));
        conv.setUpdatedAt(System.currentTimeMillis());
        enrichConversation(conv, user);
        localConversations.put(convId, conv);
        try {
            db.collection("conversations").document(convId).set(conv).get();
        } catch (Exception ignored) {
        }
        return conv;
    }

    public ChatMessageRequest declineMessageRequest(UserProfile recipient, String requestId)
            throws ExecutionException, InterruptedException {
        ChatMessageRequest req = localRequests.get(requestId);
        DocumentSnapshot doc = null;
        try {
            doc = db.collection("chat_requests").document(requestId).get().get();
            if (doc != null && doc.exists()) {
                ChatMessageRequest r = doc.toObject(ChatMessageRequest.class);
                if (r != null)
                    req = r;
            }
        } catch (Exception ignored) {
        }

        if (req == null) {
            throw new IllegalArgumentException("Message request not found: " + requestId);
        }

        Set<String> candidateIds = getCandidateIds(recipient);
        boolean isAuthorizedRecipient = candidateIds.contains(req.getRecipientId())
                || (req.getRecipientId() != null && candidateIds.contains(req.getRecipientId().toLowerCase()));
        if (!isAuthorizedRecipient) {
            throw new SecurityException("Unauthorized: Only the intended recipient can decline this message request.");
        }
        if ("DECLINED".equalsIgnoreCase(req.getStatus())) {
            return req; // Idempotent return
        }
        if (!"PENDING".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("This message request is already " + req.getStatus());
        }

        long nowMs = System.currentTimeMillis();
        req.setStatus("DECLINED");
        req.setRespondedAt(nowMs);
        localRequests.put(requestId, req);

        if (doc != null && doc.exists()) {
            try {
                doc.getReference().update("status", "DECLINED", "respondedAt", nowMs).get();
            } catch (Exception ignored) {
            }
        }

        // Notify sender
        try {
            notificationService.createNotification(
                    req.getSenderId(),
                    "Message Request Declined",
                    recipient.getName() + " declined your message request.",
                    "MESSAGE_REQUEST_DECLINED",
                    requestId,
                    null,
                    req.getSenderRole() != null ? req.getSenderRole() : "STUDENT");
        } catch (Exception ignored) {
        }

        lastReqSyncTimestamps.remove("rec_" + recipient.getIdentifier());
        lastReqSyncTimestamps.remove("sent_" + req.getSenderId());

        return req;
    }

    public static String getCanonicalConvId(String idA, String idB) {
        if (idA == null || idB == null)
            return "";
        String a = idA.trim().toLowerCase();
        String b = idB.trim().toLowerCase();
        return (a.compareTo(b) <= 0) ? ("conv_" + a + "_" + b) : ("conv_" + b + "_" + a);
    }

    public static String getCanonicalIdFromConvId(String conversationId) {
        if (conversationId == null)
            return null;
        String trimmed = conversationId.trim();
        if (trimmed.startsWith("conv_")) {
            String[] parts = trimmed.substring(5).split("_");
            if (parts.length >= 2) {
                String a = parts[0].trim().toLowerCase();
                String b = parts[1].trim().toLowerCase();
                return (a.compareTo(b) <= 0) ? ("conv_" + a + "_" + b) : ("conv_" + b + "_" + a);
            }
        }
        return trimmed;
    }

    public String getCanonicalPairKey(ChatConversation conv) {
        if (conv == null)
            return "";
        String a = conv.getStudentRegNo() != null ? conv.getStudentRegNo().trim().toLowerCase() : "";
        String b = conv.getStaffUsername() != null ? conv.getStaffUsername().trim().toLowerCase() : "";
        if (a.isEmpty() || b.isEmpty()) {
            if (conv.getId() != null && conv.getId().startsWith("conv_")) {
                String[] parts = conv.getId().substring(5).split("_");
                if (parts.length >= 2) {
                    a = parts[0].trim().toLowerCase();
                    b = parts[1].trim().toLowerCase();
                }
            }
        }
        if (a.isEmpty() && b.isEmpty())
            return conv.getId() != null ? conv.getId() : "";
        return (a.compareTo(b) <= 0) ? ("pair:" + a + "::" + b) : ("pair:" + b + "::" + a);
    }

    public List<ChatConversation> getConversations(UserProfile user) throws ExecutionException, InterruptedException {
        Map<String, ChatConversation> rawMap = new HashMap<>();
        Set<String> searchKeys = new LinkedHashSet<>();
        if (user != null) {
            if (user.getIdentifier() != null && !user.getIdentifier().trim().isEmpty()) {
                searchKeys.add(user.getIdentifier().trim());
                searchKeys.add(user.getIdentifier().trim().toLowerCase());
            }
            if (user.getId() != null && !user.getId().trim().isEmpty()) {
                searchKeys.add(user.getId().trim());
                searchKeys.add(user.getId().trim().toLowerCase());
            }
            if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                searchKeys.add(user.getEmail().trim());
                searchKeys.add(user.getEmail().trim().toLowerCase());
            }
            if ("bsanjaygandhi".equalsIgnoreCase(user.getIdentifier())) {
                searchKeys.add("principal");
            } else if ("gopinath".equalsIgnoreCase(user.getIdentifier())) {
                searchKeys.add("hod");
            }
        }

        // Throttle Firestore calls to at most once every 3.5s per user identifier
        // unless invalidated or empty
        long now = System.currentTimeMillis();
        String primaryCleanId = user != null && user.getIdentifier() != null ? user.getIdentifier().trim().toLowerCase()
                : "default";
        String userKey = primaryCleanId;
        boolean hasLocalConvs = localConversations.values().stream()
                .anyMatch(c -> isUserAuthorizedParticipant(user, c));
        boolean shouldQueryFirestore = !hasLocalConvs || (now - lastSyncTimestamps.getOrDefault(userKey, 0L) > 3500L);

        if (shouldQueryFirestore) {
            Set<String> queryKeys = new LinkedHashSet<>();
            if (user != null && user.getIdentifier() != null && !user.getIdentifier().trim().isEmpty()) {
                queryKeys.add(user.getIdentifier().trim().toLowerCase());
                queryKeys.add(user.getIdentifier().trim());
            }
            if (user != null && user.getId() != null && !user.getId().trim().isEmpty()) {
                queryKeys.add(user.getId().trim().toLowerCase());
            }
            if ("bsanjaygandhi".equalsIgnoreCase(primaryCleanId)) {
                queryKeys.add("principal");
            } else if ("gopinath".equalsIgnoreCase(primaryCleanId)) {
                queryKeys.add("hod");
            }

            // Parallel queries to Firestore using minimal targeted keys
            List<ApiFuture<QuerySnapshot>> futures = new ArrayList<>();
            for (String key : queryKeys) {
                try {
                    futures.add(db.collection("conversations").whereArrayContains("participants", key).limit(50).get());
                    futures.add(db.collection("chat_requests").whereEqualTo("recipientId", key).limit(30).get());
                    futures.add(db.collection("chat_requests").whereEqualTo("senderId", key).limit(30).get());
                } catch (Exception ignored) {
                }
            }

            List<QuerySnapshot> results = new ArrayList<>();
            for (ApiFuture<QuerySnapshot> f : futures) {
                try {
                    QuerySnapshot snap = f.get();
                    if (snap != null)
                        results.add(snap);
                } catch (Exception ex) {
                    // Do not break! Continue evaluating all other query futures
                }
            }

            List<ChatMessageRequest> acceptedRequests = new ArrayList<>();
            for (QuerySnapshot snap : results) {
                for (DocumentSnapshot doc : snap.getDocuments()) {
                    if ("chat_requests".equals(doc.getReference().getParent().getId())) {
                        ChatMessageRequest req = doc.toObject(ChatMessageRequest.class);
                        if (req != null) {
                            req.setId(doc.getId());
                            localRequests.put(doc.getId(), req);
                            if ("ACCEPTED".equalsIgnoreCase(req.getStatus())) {
                                acceptedRequests.add(req);
                            }
                        }
                    } else {
                        ChatConversation c = doc.toObject(ChatConversation.class);
                        if (c != null) {
                            if (c.getId() == null || c.getId().trim().isEmpty()) {
                                c.setId(doc.getId());
                            }
                            rawMap.put(c.getId(), c);
                            localConversations.put(c.getId(), c);
                        }
                    }
                }
            }

            // Attach and reconcile conversations from accepted requests
            for (ChatMessageRequest req : acceptedRequests) {
                resolveAndAttachConversation(req, rawMap);
            }
            lastSyncTimestamps.put(userKey, System.currentTimeMillis());
        }

        // Always check localRequests for any accepted requests for this user, even if
        // Firestore queries were throttled
        Set<String> candIds = getCandidateIds(user);
        for (ChatMessageRequest lr : localRequests.values()) {
            if (lr != null && "ACCEPTED".equalsIgnoreCase(lr.getStatus())) {
                if (candIds.contains(lr.getSenderId()) || candIds.contains(lr.getRecipientId()) ||
                        (lr.getSenderId() != null && candIds.contains(lr.getSenderId().toLowerCase())) ||
                        (lr.getRecipientId() != null && candIds.contains(lr.getRecipientId().toLowerCase()))) {
                    resolveAndAttachConversation(lr, rawMap, false);
                }
            }
        }

        // Attach conversations from local resilient cache
        for (ChatConversation lc : localConversations.values()) {
            if (lc != null && lc.getId() != null) {
                rawMap.put(lc.getId(), lc);
            }
        }

        // Deduplicate conversations by canonical participant pair
        Map<String, ChatConversation> pairMap = new LinkedHashMap<>();
        for (ChatConversation conv : rawMap.values()) {
            if (conv != null && isUserAuthorizedParticipant(user, conv)) {
                enrichConversation(conv, user);
                String pairKey = getCanonicalPairKey(conv);
                ChatConversation existing = pairMap.get(pairKey);
                if (existing == null) {
                    pairMap.put(pairKey, conv);
                } else {
                    // Keep the one with the latest update or non-empty messages
                    long existingTime = existing.getUpdatedAt();
                    long convTime = conv.getUpdatedAt();
                    boolean convHasMsg = conv.getLastMessage() != null && !conv.getLastMessage().isEmpty();
                    boolean existHasMsg = existing.getLastMessage() != null && !existing.getLastMessage().isEmpty();

                    if ((convHasMsg && !existHasMsg) || (convTime > existingTime)) {
                        pairMap.put(pairKey, conv);
                    }
                }
            }
        }

        List<ChatConversation> list = new ArrayList<>(pairMap.values());
        list.sort((a, b) -> Long.compare(b.getUpdatedAt(), a.getUpdatedAt()));
        return list;
    }

    private void resolveAndAttachConversation(ChatMessageRequest req, Map<String, ChatConversation> map) {
        resolveAndAttachConversation(req, map, true);
    }

    private void resolveAndAttachConversation(ChatMessageRequest req, Map<String, ChatConversation> map,
            boolean allowFirestoreQuery) {
        if (req == null)
            return;
        String sId = req.getSenderId() != null ? req.getSenderId().toLowerCase().trim() : "";
        String rId = req.getRecipientId() != null ? req.getRecipientId().toLowerCase().trim() : "";
        String canonId = (!sId.isEmpty() && !rId.isEmpty())
                ? ((sId.compareTo(rId) <= 0) ? ("conv_" + sId + "_" + rId) : ("conv_" + rId + "_" + sId))
                : null;

        String cId = req.getConversationId() != null ? req.getConversationId().trim() : null;
        if (cId != null && cId.startsWith("EXISTING-")) {
            cId = cId.substring("EXISTING-".length());
        }

        // Fast path 1: Already attached in map
        if (cId != null && map.containsKey(cId))
            return;
        if (canonId != null && map.containsKey(canonId))
            return;

        // Fast path 2: In-memory cache
        if (cId != null && localConversations.containsKey(cId)) {
            map.put(cId, localConversations.get(cId));
            return;
        }
        if (canonId != null && localConversations.containsKey(canonId)) {
            map.put(canonId, localConversations.get(canonId));
            return;
        }

        if (!allowFirestoreQuery) {
            return;
        }

        if (cId != null && !cId.isEmpty()) {
            try {
                DocumentSnapshot cDoc = db.collection("conversations").document(cId).get().get();
                if (cDoc != null && cDoc.exists()) {
                    ChatConversation c = cDoc.toObject(ChatConversation.class);
                    if (c != null) {
                        map.put(c.getId(), c);
                        localConversations.put(c.getId(), c);
                        return;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Try canonical conversation ID
        if (canonId != null) {
            try {
                DocumentSnapshot cDoc = db.collection("conversations").document(canonId).get().get();
                if (cDoc != null && cDoc.exists()) {
                    ChatConversation c = cDoc.toObject(ChatConversation.class);
                    if (c != null) {
                        map.put(c.getId(), c);
                        localConversations.put(c.getId(), c);
                        return;
                    }
                }
            } catch (Exception ignored) {
            }

            String altId = "conv_" + sId + "_" + rId;
            if (map.containsKey(altId))
                return;
            ChatConversation altC = localConversations.get(altId);
            if (altC != null) {
                map.put(altC.getId(), altC);
                return;
            }
            try {
                DocumentSnapshot cDoc = db.collection("conversations").document(altId).get().get();
                if (cDoc != null && cDoc.exists()) {
                    ChatConversation c = cDoc.toObject(ChatConversation.class);
                    if (c != null) {
                        map.put(c.getId(), c);
                        localConversations.put(c.getId(), c);
                        return;
                    }
                }
            } catch (Exception ignored) {
            }

            // Auto-create persistent conversation document in Firestore
            try {
                ChatConversation newConv = new ChatConversation();
                newConv.setId(canonId);
                newConv.setStudentRegNo(req.getSenderId());
                newConv.setStudentName(req.getSenderName());
                newConv.setStudentSection(req.getSenderSection());
                newConv.setStudentRole(req.getSenderRole() != null ? req.getSenderRole() : "STUDENT");
                newConv.setStaffUsername(req.getRecipientId());
                newConv.setStaffName(req.getRecipientName());
                newConv.setStaffSection(req.getRecipientSection());
                newConv.setStaffRole(req.getRecipientRole() != null ? req.getRecipientRole() : "STUDENT");
                newConv.setType(req.getRequestType() != null ? req.getRequestType() : "STUDENT_STUDENT");
                newConv.setLastMessage(
                        req.getIntroMessage() != null && !req.getIntroMessage().isEmpty() ? req.getIntroMessage()
                                : "Conversation established");
                newConv.setLastMessageTime(
                        req.getTimestamp() != null ? req.getTimestamp() : LocalDateTime.now().format(formatter));
                newConv.setLastMessageSender(req.getSenderName());
                newConv.setLastMessageSenderId(req.getSenderId());
                newConv.setLastMessageStatus("DELIVERED");
                newConv.setUpdatedAt(req.getRespondedAt() > 0 ? req.getRespondedAt() : System.currentTimeMillis());

                Set<String> allParts = new LinkedHashSet<>();
                allParts.add(req.getSenderId());
                allParts.add(sId);
                allParts.add(req.getRecipientId());
                allParts.add(rId);
                try {
                    UserProfile userA = findUserFast(req.getSenderId());
                    if (userA != null)
                        allParts.addAll(getCandidateIds(userA));
                    UserProfile userB = findUserFast(req.getRecipientId());
                    if (userB != null)
                        allParts.addAll(getCandidateIds(userB));
                } catch (Exception ignored) {
                }
                newConv.setParticipants(new ArrayList<>(allParts));

                enrichConversation(newConv, null);
                localConversations.put(canonId, newConv);
                map.put(canonId, newConv);
                try {
                    db.collection("conversations").document(canonId)
                            .set(newConv, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }

                if (req.getConversationId() == null || req.getConversationId().trim().isEmpty()
                        || !req.getConversationId().equals(canonId)) {
                    req.setConversationId(canonId);
                    try {
                        db.collection("chat_requests").document(req.getId()).update("conversationId", canonId);
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    public ChatConversation getOrCreateConversation(UserProfile user, String targetIdentifier)
            throws ExecutionException, InterruptedException {
        String cleanTarget = targetIdentifier.trim();
        UserProfile student;
        UserProfile staff;

        if (user.getRole() == UserRole.STUDENT) {
            student = user;
            staff = findUserFast(cleanTarget);
            if (staff == null || staff.getRole() == UserRole.STUDENT) {
                // If target is another student, check if they have an active accepted
                // conversation
                UserProfile otherStudent = (staff != null && staff.getRole() == UserRole.STUDENT) ? staff
                        : findUserFast(cleanTarget);
                if (otherStudent != null) {
                    staff = null;
                    String idA = student.getIdentifier().toLowerCase();
                    String idB = otherStudent.getIdentifier().toLowerCase();
                    String convId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB)
                            : ("conv_" + idB + "_" + idA);
                    String altConvId = "conv_" + idA + "_" + idB;

                    ChatConversation existingConv = localConversations.get(convId);
                    if (existingConv == null)
                        existingConv = localConversations.get(altConvId);
                    if (existingConv == null)
                        existingConv = localConversations.get("conv_" + idB + "_" + idA);
                    if (existingConv != null) {
                        enrichConversation(existingConv, user);
                        return existingConv;
                    }

                    try {
                        DocumentSnapshot doc = db.collection("conversations").document(convId).get().get();
                        if (doc.exists()) {
                            ChatConversation c = doc.toObject(ChatConversation.class);
                            enrichConversation(c, user);
                            localConversations.put(convId, c);
                            return c;
                        }
                        DocumentSnapshot altDoc = db.collection("conversations").document(altConvId).get().get();
                        if (altDoc.exists()) {
                            ChatConversation c = altDoc.toObject(ChatConversation.class);
                            enrichConversation(c, user);
                            localConversations.put(altConvId, c);
                            return c;
                        }
                    } catch (Exception ignored) {
                    }
                    // Check if an accepted request exists in memory or Firestore
                    ChatMessageRequest acceptedReq = null;
                    for (ChatMessageRequest r : localRequests.values()) {
                        if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())) {
                            if ((idA.equalsIgnoreCase(r.getSenderId()) && idB.equalsIgnoreCase(r.getRecipientId())) ||
                                    (idB.equalsIgnoreCase(r.getSenderId())
                                            && idA.equalsIgnoreCase(r.getRecipientId()))) {
                                acceptedReq = r;
                                break;
                            }
                        }
                    }
                    if (acceptedReq == null) {
                        try {
                            var snapA = db.collection("chat_requests").whereEqualTo("senderId", student.getIdentifier())
                                    .limit(20).get().get();
                            for (DocumentSnapshot docA : snapA.getDocuments()) {
                                ChatMessageRequest r = docA.toObject(ChatMessageRequest.class);
                                if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())
                                        && idB.equalsIgnoreCase(r.getRecipientId())) {
                                    acceptedReq = r;
                                    break;
                                }
                            }
                            if (acceptedReq == null) {
                                var snapB = db.collection("chat_requests")
                                        .whereEqualTo("senderId", otherStudent.getIdentifier()).limit(20).get().get();
                                for (DocumentSnapshot docB : snapB.getDocuments()) {
                                    ChatMessageRequest r = docB.toObject(ChatMessageRequest.class);
                                    if (r != null && "ACCEPTED".equalsIgnoreCase(r.getStatus())
                                            && idA.equalsIgnoreCase(r.getRecipientId())) {
                                        acceptedReq = r;
                                        break;
                                    }
                                }
                            }
                        } catch (Exception ignored) {
                        }
                    }
                    if (acceptedReq != null) {
                        Map<String, ChatConversation> temp = new HashMap<>();
                        resolveAndAttachConversation(acceptedReq, temp);
                        if (!temp.isEmpty()) {
                            ChatConversation c = temp.values().iterator().next();
                            enrichConversation(c, user);
                            return c;
                        }
                    }

                    // Direct messaging: Create exactly one conversation with correct participant
                    // UIDs
                    ChatConversation newConv = new ChatConversation();
                    newConv.setId(convId);
                    newConv.setType("STUDENT_STUDENT");
                    Set<String> allParticipants = new LinkedHashSet<>();
                    allParticipants.add(student.getIdentifier());
                    allParticipants.add(idA);
                    allParticipants.add(otherStudent.getIdentifier());
                    allParticipants.add(idB);
                    allParticipants.addAll(getCandidateIds(student));
                    allParticipants.addAll(getCandidateIds(otherStudent));
                    newConv.setParticipants(new ArrayList<>(allParticipants));
                    newConv.setStudentRegNo(student.getIdentifier());
                    newConv.setStudentName(student.getName());
                    newConv.setStudentSection(student.getSection());
                    newConv.setStudentRole("STUDENT");
                    newConv.setStaffUsername(otherStudent.getIdentifier());
                    newConv.setStaffName(otherStudent.getName());
                    newConv.setStaffSection(otherStudent.getSection());
                    newConv.setStaffRole("STUDENT");
                    newConv.setLastMessage("Conversation started");
                    newConv.setLastMessageTime(LocalDateTime.now().format(formatter));
                    newConv.setLastMessageSender(student.getName());
                    newConv.setLastMessageSenderId(student.getIdentifier());
                    newConv.setLastMessageStatus("DELIVERED");
                    newConv.setUnreadCountStudent(0);
                    newConv.setUnreadCountStaff(0);
                    newConv.setUpdatedAt(System.currentTimeMillis());

                    enrichConversation(newConv, user);
                    localConversations.put(convId, newConv);
                    lastSyncTimestamps.remove(idA);
                    lastSyncTimestamps.remove(idB);
                    lastSyncTimestamps.remove(student.getIdentifier());
                    lastSyncTimestamps.remove(otherStudent.getIdentifier());
                    try {
                        db.collection("conversations").document(convId)
                                .set(newConv, com.google.cloud.firestore.SetOptions.merge()).get();
                    } catch (Exception ex) {
                        System.err.println(
                                "[ChatService] Notice creating student conversation in Firestore: " + ex.getMessage());
                    }
                    return newConv;
                }
                throw new IllegalArgumentException("Staff member or student not found: " + cleanTarget);
            }

            // Verify permission: Student may only chat directly with their Section Advisor,
            // HOD, or Principal
            boolean allowed = false;
            if (staff.getRole() == UserRole.ADVISOR) {
                String expectedAdvisor = OdService.getAdvisorForSection(user.getSection());
                if (staff.getIdentifier().equalsIgnoreCase(expectedAdvisor)) {
                    allowed = true;
                } else {
                    String uSec = user.getSection() != null ? user.getSection().replaceAll("(?i)CSE-?", "").trim() : "";
                    String sSec = staff.getSection() != null ? staff.getSection().replaceAll("(?i)CSE-?", "").trim()
                            : "";
                    if (!uSec.isEmpty() && (uSec.equalsIgnoreCase(sSec)
                            || (user.getSection() != null && user.getSection().equalsIgnoreCase(staff.getSection())))) {
                        allowed = true;
                    }
                }
            } else if (staff.getRole() == UserRole.HOD || staff.getRole() == UserRole.PRINCIPAL) {
                allowed = true;
            }

            if (!allowed) {
                throw new SecurityException(
                        "Unauthorized: Students may only initiate conversations with their Section Advisor, HOD, or Principal.");
            }

        } else {
            staff = user;
            student = findUserFast(cleanTarget);
            if (student == null) {
                throw new IllegalArgumentException("Target user not found: " + cleanTarget);
            }

            if (student.getRole() != UserRole.STUDENT) {
                // STAFF to STAFF direct conversation
                UserProfile otherStaff = student;
                String idA = staff.getIdentifier().toLowerCase();
                String idB = otherStaff.getIdentifier().toLowerCase();
                String canonConvId = (idA.compareTo(idB) <= 0) ? ("conv_" + idA + "_" + idB)
                        : ("conv_" + idB + "_" + idA);

                ChatConversation existing = localConversations.get(canonConvId);
                if (existing != null) {
                    enrichConversation(existing, user);
                    return existing;
                }
                try {
                    DocumentSnapshot doc = db.collection("conversations").document(canonConvId).get().get();
                    if (doc.exists()) {
                        ChatConversation c = doc.toObject(ChatConversation.class);
                        enrichConversation(c, user);
                        localConversations.put(canonConvId, c);
                        return c;
                    }
                } catch (Exception ignored) {
                }

                Set<String> allParticipants = new LinkedHashSet<>();
                allParticipants.add(staff.getIdentifier());
                allParticipants.add(idA);
                allParticipants.add(otherStaff.getIdentifier());
                allParticipants.add(idB);
                allParticipants.addAll(getCandidateIds(staff));
                allParticipants.addAll(getCandidateIds(otherStaff));

                String timestamp = LocalDateTime.now().format(formatter);
                ChatConversation conv = new ChatConversation();
                conv.setId(canonConvId);
                conv.setType("STAFF_STAFF");
                conv.setParticipants(new ArrayList<>(allParticipants));
                conv.setStudentRegNo(staff.getIdentifier());
                conv.setStudentName(staff.getName());
                conv.setStudentSection(staff.getSection());
                conv.setStudentRole(staff.getRole().name());
                conv.setStaffUsername(otherStaff.getIdentifier());
                conv.setStaffName(otherStaff.getName());
                conv.setStaffRole(otherStaff.getRole().name());
                conv.setStaffSection(otherStaff.getSection());
                conv.setLastMessage("Conversation started");
                conv.setLastMessageTime(timestamp);
                conv.setLastMessageSender(staff.getName());
                conv.setLastMessageSenderId(staff.getIdentifier());
                conv.setUnreadCountStudent(0);
                conv.setUnreadCountStaff(0);
                conv.setUpdatedAt(System.currentTimeMillis());

                try {
                    db.collection("conversations").document(canonConvId)
                            .set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
                } catch (Exception ignored) {
                }
                localConversations.put(canonConvId, conv);
                lastSyncTimestamps.remove(idA);
                lastSyncTimestamps.remove(idB);
                lastSyncTimestamps.remove(staff.getIdentifier());
                lastSyncTimestamps.remove(otherStaff.getIdentifier());
                enrichConversation(conv, user);
                return conv;
            } else {
                if (staff.getRole() == UserRole.ADVISOR) {
                    String expectedAdvisor = OdService.getAdvisorForSection(student.getSection());
                    boolean matches = staff.getIdentifier().equalsIgnoreCase(expectedAdvisor);
                    if (!matches) {
                        String uSec = student.getSection() != null
                                ? student.getSection().replaceAll("(?i)CSE-?", "").trim()
                                : "";
                        String sSec = staff.getSection() != null ? staff.getSection().replaceAll("(?i)CSE-?", "").trim()
                                : "";
                        matches = (!uSec.isEmpty() && (uSec.equalsIgnoreCase(sSec) || (student.getSection() != null
                                && student.getSection().equalsIgnoreCase(staff.getSection()))));
                    }
                    if (!matches) {
                        throw new SecurityException(
                                "Unauthorized: Advisors may only chat with students in their assigned section.");
                    }
                }
            }
        }

        String sId = student.getIdentifier().toLowerCase();
        String stId = staff.getIdentifier().toLowerCase();
        String canonConvId = (sId.compareTo(stId) <= 0) ? ("conv_" + sId + "_" + stId) : ("conv_" + stId + "_" + sId);
        String altConvId = "conv_" + sId + "_" + stId;

        ChatConversation existing = localConversations.get(canonConvId);
        if (existing == null)
            existing = localConversations.get(altConvId);
        if (existing != null) {
            enrichConversation(existing, user);
            return existing;
        }

        try {
            DocumentSnapshot doc = db.collection("conversations").document(canonConvId).get().get();
            if (doc.exists()) {
                ChatConversation c = doc.toObject(ChatConversation.class);
                enrichConversation(c, user);
                localConversations.put(canonConvId, c);
                return c;
            }
            DocumentSnapshot altDoc = db.collection("conversations").document(altConvId).get().get();
            if (altDoc.exists()) {
                ChatConversation c = altDoc.toObject(ChatConversation.class);
                enrichConversation(c, user);
                localConversations.put(altConvId, c);
                return c;
            }
        } catch (Exception ignored) {
        }

        Set<String> allParticipants = new LinkedHashSet<>();
        allParticipants.add(student.getIdentifier());
        allParticipants.add(sId);
        allParticipants.add(staff.getIdentifier());
        allParticipants.add(stId);
        allParticipants.addAll(getCandidateIds(student));
        allParticipants.addAll(getCandidateIds(staff));

        String timestamp = LocalDateTime.now().format(formatter);
        ChatConversation conv = new ChatConversation();
        conv.setId(canonConvId);
        conv.setType("STUDENT_STAFF");
        conv.setParticipants(new ArrayList<>(allParticipants));
        conv.setStudentRegNo(student.getIdentifier());
        conv.setStudentName(student.getName());
        conv.setStudentSection(student.getSection());
        conv.setStaffUsername(staff.getIdentifier());
        conv.setStaffName(staff.getName());
        conv.setStaffRole(staff.getRole().name());
        conv.setStaffSection(staff.getSection());
        conv.setLastMessage("Conversation started");
        conv.setLastMessageTime(timestamp);
        conv.setLastMessageSender("System");
        conv.setUnreadCountStudent(0);
        conv.setUnreadCountStaff(0);
        conv.setUpdatedAt(System.currentTimeMillis());

        try {
            db.collection("conversations").document(canonConvId)
                    .set(conv, com.google.cloud.firestore.SetOptions.merge()).get();
        } catch (Exception ignored) {
        }
        localConversations.put(canonConvId, conv);
        lastSyncTimestamps.remove(sId);
        lastSyncTimestamps.remove(stId);
        lastSyncTimestamps.remove(student.getIdentifier());
        lastSyncTimestamps.remove(staff.getIdentifier());
        enrichConversation(conv, user);
        return conv;
    }

    public List<ChatMessage> getMessages(UserProfile user, String conversationId)
            throws ExecutionException, InterruptedException {
        String canonConvId = getCanonicalIdFromConvId(conversationId);
        ChatConversation conv = localConversations.get(canonConvId);
        if (conv == null && !canonConvId.equals(conversationId)) {
            conv = localConversations.get(conversationId);
        }

        DocumentSnapshot doc = null;
        if (conv == null) {
            try {
                doc = db.collection("conversations").document(canonConvId).get().get();
                if (doc != null && doc.exists()) {
                    ChatConversation c = doc.toObject(ChatConversation.class);
                    if (c != null) {
                        conv = c;
                        localConversations.put(canonConvId, conv);
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (conv == null && !canonConvId.equals(conversationId)) {
            try {
                doc = db.collection("conversations").document(conversationId).get().get();
                if (doc != null && doc.exists()) {
                    ChatConversation c = doc.toObject(ChatConversation.class);
                    if (c != null) {
                        conv = c;
                        localConversations.put(conversationId, conv);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Fallback: check reversed conversation ID if conversationId is conv_A_B
        if (conv == null && conversationId.startsWith("conv_")) {
            String[] parts = conversationId.substring(5).split("_");
            if (parts.length >= 2) {
                String altId = "conv_" + parts[1] + "_" + parts[0];
                conv = localConversations.get(altId);
                if (conv == null) {
                    try {
                        DocumentSnapshot altDoc = db.collection("conversations").document(altId).get().get();
                        if (altDoc != null && altDoc.exists()) {
                            ChatConversation c = altDoc.toObject(ChatConversation.class);
                            if (c != null) {
                                conv = c;
                                localConversations.put(altId, conv);
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        if (conv == null) {
            throw new IllegalArgumentException("Conversation not found: " + conversationId);
        }

        if (!isUserAuthorizedParticipant(user, conv)) {
            throw new SecurityException("Access denied: You are not an authorized participant in this conversation.");
        }

        List<ChatMessage> list = new ArrayList<>();
        boolean hasUnread = false;
        Set<String> candidateIds = getCandidateIds(user);

        long now = System.currentTimeMillis();
        String convMsgKey = "msg_" + canonConvId;
        boolean shouldQueryFirestore = (now - lastMessageSyncTimestamps.getOrDefault(convMsgKey, 0L) > 3500L)
                || !localMessages.containsKey(canonConvId);

        if (shouldQueryFirestore) {
            Set<String> fetchedIds = new HashSet<>();

            // 1. Query top-level chat_messages by canonical ID
            try {
                var snap = db.collection("chat_messages")
                        .whereEqualTo("conversationId", canonConvId)
                        .limit(100)
                        .get().get();
                for (DocumentSnapshot mDoc : snap.getDocuments()) {
                    ChatMessage msg = mDoc.toObject(ChatMessage.class);
                    if (msg != null) {
                        if (msg.getId() == null || msg.getId().trim().isEmpty()) {
                            msg.setId(mDoc.getId());
                        }
                        fetchedIds.add(msg.getId());
                        list.add(msg);
                        boolean isIncoming = msg.getSenderId() != null
                                && !candidateIds.contains(msg.getSenderId())
                                && !candidateIds.contains(msg.getSenderId().toLowerCase());
                        if (!msg.isRead() && isIncoming) {
                            try {
                                mDoc.getReference().update("read", true, "status", "READ");
                            } catch (Exception ignored) {
                            }
                            msg.setRead(true);
                            msg.setStatus("READ");
                            hasUnread = true;
                        }
                    }
                }
            } catch (Exception ignored) {
            }

            // 2. Query original conversationId if distinct from canonConvId
            if (!canonConvId.equals(conversationId)) {
                try {
                    var snapAlt = db.collection("chat_messages")
                            .whereEqualTo("conversationId", conversationId)
                            .limit(100)
                            .get().get();
                    for (DocumentSnapshot mDoc : snapAlt.getDocuments()) {
                        ChatMessage msg = mDoc.toObject(ChatMessage.class);
                        if (msg != null) {
                            if (msg.getId() == null || msg.getId().trim().isEmpty()) {
                                msg.setId(mDoc.getId());
                            }
                            if (!fetchedIds.contains(msg.getId())) {
                                fetchedIds.add(msg.getId());
                                list.add(msg);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            // 3. Inspect subcollection conversations/{canonConvId}/messages
            try {
                var subSnap = db.collection("conversations")
                        .document(canonConvId)
                        .collection("messages")
                        .limit(100)
                        .get().get();
                for (DocumentSnapshot mDoc : subSnap.getDocuments()) {
                    ChatMessage msg = mDoc.toObject(ChatMessage.class);
                    if (msg != null) {
                        if (msg.getId() == null || msg.getId().trim().isEmpty()) {
                            msg.setId(mDoc.getId());
                        }
                        if (!fetchedIds.contains(msg.getId())) {
                            fetchedIds.add(msg.getId());
                            list.add(msg);
                        }
                        boolean isIncoming = msg.getSenderId() != null
                                && !candidateIds.contains(msg.getSenderId())
                                && !candidateIds.contains(msg.getSenderId().toLowerCase());
                        if (!msg.isRead() && isIncoming) {
                            try {
                                mDoc.getReference().update("read", true, "status", "READ");
                            } catch (Exception ignored) {
                            }
                            msg.setRead(true);
                            msg.setStatus("READ");
                            hasUnread = true;
                        }
                    }
                }
            } catch (Exception ignored) {
            }
            lastMessageSyncTimestamps.put(convMsgKey, System.currentTimeMillis());
        }

        List<ChatMessage> memMsgs = localMessages.get(canonConvId);
        if (memMsgs == null && !canonConvId.equals(conversationId)) {
            memMsgs = localMessages.get(conversationId);
        }
        if (memMsgs != null) {
            Set<String> seenIds = new HashSet<>();
            for (ChatMessage m : list)
                seenIds.add(m.getId());
            for (ChatMessage m : memMsgs) {
                if (!seenIds.contains(m.getId())) {
                    list.add(m);
                    seenIds.add(m.getId());
                }
            }
        }

        list.sort(Comparator.comparingLong(ChatMessage::getCreatedAt));
        localMessages.put(canonConvId, new java.util.concurrent.CopyOnWriteArrayList<>(list));
        if (!canonConvId.equals(conversationId)) {
            localMessages.put(conversationId, new java.util.concurrent.CopyOnWriteArrayList<>(list));
        }

        // Reset unread count for current user and mark last message as read if incoming
        if (hasUnread) {
            boolean isStudentSide = candidateIds.contains(conv.getStudentRegNo())
                    || (conv.getStudentRegNo() != null && candidateIds.contains(conv.getStudentRegNo().toLowerCase()));
            Map<String, Object> convUpdates = new HashMap<>();
            if (isStudentSide) {
                convUpdates.put("unreadCountStudent", 0);
                conv.setUnreadCountStudent(0);
            } else {
                convUpdates.put("unreadCountStaff", 0);
                conv.setUnreadCountStaff(0);
            }
            if (conv.getLastMessageSenderId() != null
                    && !candidateIds.contains(conv.getLastMessageSenderId())
                    && !candidateIds.contains(conv.getLastMessageSenderId().toLowerCase())) {
                convUpdates.put("lastMessageStatus", "READ");
                conv.setLastMessageStatus("READ");
            }
            localConversations.put(canonConvId, conv);
            try {
                db.collection("conversations").document(canonConvId).update(convUpdates);
            } catch (Exception ignored) {
            }
        }

        return list;
    }

    public void markConversationAsRead(UserProfile user, String conversationId)
            throws ExecutionException, InterruptedException {
        ChatConversation conv = localConversations.get(conversationId);
        DocumentSnapshot doc = null;
        if (conv == null) {
            try {
                doc = db.collection("conversations").document(conversationId).get().get();
                if (doc != null && doc.exists()) {
                    ChatConversation c = doc.toObject(ChatConversation.class);
                    if (c != null) {
                        conv = c;
                        localConversations.put(conversationId, conv);
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (conv == null || !isUserAuthorizedParticipant(user, conv))
            return;

        Set<String> candidateIds = getCandidateIds(user);
        try {
            var snap = db.collection("chat_messages")
                    .whereEqualTo("conversationId", conversationId)
                    .whereEqualTo("read", false)
                    .limit(30)
                    .get().get();

            for (DocumentSnapshot mDoc : snap.getDocuments()) {
                String sId = mDoc.getString("senderId");
                if (sId != null && !candidateIds.contains(sId) && !candidateIds.contains(sId.toLowerCase())) {
                    mDoc.getReference().update("read", true, "status", "READ");
                }
            }
        } catch (Exception ignored) {
        }

        Map<String, Object> convUpdates = new HashMap<>();
        boolean isStudentSide = candidateIds.contains(conv.getStudentRegNo())
                || (conv.getStudentRegNo() != null && candidateIds.contains(conv.getStudentRegNo().toLowerCase()));
        if (isStudentSide) {
            convUpdates.put("unreadCountStudent", 0);
            conv.setUnreadCountStudent(0);
        } else {
            convUpdates.put("unreadCountStaff", 0);
            conv.setUnreadCountStaff(0);
        }
        if (conv.getLastMessageSenderId() != null
                && !candidateIds.contains(conv.getLastMessageSenderId())
                && !candidateIds.contains(conv.getLastMessageSenderId().toLowerCase())) {
            convUpdates.put("lastMessageStatus", "READ");
            conv.setLastMessageStatus("READ");
        }
        localConversations.put(conversationId, conv);
        try {
            db.collection("conversations").document(conversationId).update(convUpdates);
        } catch (Exception ignored) {
        }
    }

    public ChatMessage sendMessage(UserProfile user, String conversationId, String content)
            throws ExecutionException, InterruptedException {
        return sendMessage(user, conversationId, content, null, null, null, null, null, null, null, null);
    }

    public ChatMessage sendMessage(UserProfile user, String conversationId, String content, String explicitRecipientId)
            throws ExecutionException, InterruptedException {
        return sendMessage(user, conversationId, content, explicitRecipientId, null, null, null, null, null, null,
                null);
    }

    public ChatMessage sendMessage(
            UserProfile user,
            String conversationId,
            String content,
            String explicitRecipientId,
            String replyToId,
            String replyToSender,
            String replyToText,
            String attachmentUrl,
            String attachmentName,
            String attachmentType,
            Long attachmentSize) throws ExecutionException, InterruptedException {
        boolean hasContent = content != null && !content.trim().isEmpty();
        boolean hasAttachment = attachmentUrl != null && !attachmentUrl.trim().isEmpty();
        System.out.println("[ChatServer-Send] 1. Message send initiated in convId=" + conversationId + " by user="
                + user.getIdentifier() + " (role=" + user.getRole() + "), hasContent=" + hasContent + ", hasAttachment="
                + hasAttachment);
        if (!hasContent && !hasAttachment) {
            System.err.println("[ChatServer-Send] Rejected: Message content and attachment are both empty.");
            throw new IllegalArgumentException("Message content cannot be empty.");
        }
        String cleanContent = hasContent ? content.trim()
                : (attachmentName != null ? ("📎 " + attachmentName) : "Attachment");
        if (cleanContent.length() > 2000) {
            throw new IllegalArgumentException("Message content cannot exceed 2000 characters.");
        }

        String canonConvId = getCanonicalIdFromConvId(conversationId);
        ChatConversation conv = localConversations.get(canonConvId);
        if (conv == null && !canonConvId.equals(conversationId)) {
            conv = localConversations.get(conversationId);
        }

        DocumentSnapshot doc = null;
        if (conv == null) {
            try {
                doc = db.collection("conversations").document(canonConvId).get().get();
                if (doc != null && doc.exists()) {
                    ChatConversation c = doc.toObject(ChatConversation.class);
                    if (c != null) {
                        if (c.getId() == null || c.getId().trim().isEmpty())
                            c.setId(doc.getId());
                        conv = c;
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (conv == null && !canonConvId.equals(conversationId)) {
            try {
                doc = db.collection("conversations").document(conversationId).get().get();
                if (doc != null && doc.exists()) {
                    ChatConversation c = doc.toObject(ChatConversation.class);
                    if (c != null) {
                        if (c.getId() == null || c.getId().trim().isEmpty())
                            c.setId(doc.getId());
                        conv = c;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Fallback 1: check reversed conversation ID (e.g. conv_userB_userA vs
        // conv_userA_userB)
        if (conv == null && conversationId.startsWith("conv_")) {
            String[] parts = conversationId.substring(5).split("_");
            if (parts.length >= 2) {
                String altId = "conv_" + parts[1] + "_" + parts[0];
                conv = localConversations.get(altId);
                if (conv == null) {
                    try {
                        DocumentSnapshot altDoc = db.collection("conversations").document(altId).get().get();
                        if (altDoc != null && altDoc.exists()) {
                            ChatConversation c = altDoc.toObject(ChatConversation.class);
                            if (c != null) {
                                if (c.getId() == null || c.getId().trim().isEmpty())
                                    c.setId(altDoc.getId());
                                conv = c;
                                doc = altDoc;
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        // Fallback 2: check chat_conversations collection
        if (conv == null) {
            try {
                DocumentSnapshot ccDoc = db.collection("chat_conversations").document(conversationId).get().get();
                if (ccDoc != null && ccDoc.exists()) {
                    ChatConversation c = ccDoc.toObject(ChatConversation.class);
                    if (c != null) {
                        if (c.getId() == null || c.getId().trim().isEmpty())
                            c.setId(ccDoc.getId());
                        conv = c;
                        doc = ccDoc;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Fallback 3: check if conversationId is a message request ID
        if (conv == null) {
            ChatMessageRequest req = localRequests.get(conversationId);
            if (req == null) {
                try {
                    DocumentSnapshot reqDoc = db.collection("chat_requests").document(conversationId).get().get();
                    if (reqDoc != null && reqDoc.exists()) {
                        req = reqDoc.toObject(ChatMessageRequest.class);
                        if (req != null && (req.getId() == null || req.getId().trim().isEmpty()))
                            req.setId(reqDoc.getId());
                    }
                } catch (Exception ignored) {
                }
            }
            if (req != null && req.getConversationId() != null) {
                String targetConvId = req.getConversationId().trim();
                conv = localConversations.get(targetConvId);
                if (conv == null) {
                    try {
                        DocumentSnapshot convSnap = db.collection("conversations").document(targetConvId).get().get();
                        if (convSnap != null && convSnap.exists()) {
                            ChatConversation c = convSnap.toObject(ChatConversation.class);
                            if (c != null) {
                                if (c.getId() == null || c.getId().trim().isEmpty())
                                    c.setId(convSnap.getId());
                                conv = c;
                                doc = convSnap;
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        if (conv == null) {
            throw new IllegalArgumentException("Conversation not found: " + conversationId);
        }

        if (!isUserAuthorizedParticipant(user, conv)) {
            throw new SecurityException("Access denied: You are not an authorized participant in this conversation.");
        }

        String realConvId = conv.getId() != null ? conv.getId() : canonConvId;
        if (realConvId == null || realConvId.trim().isEmpty()) {
            realConvId = canonConvId;
            conv.setId(realConvId);
        }

        String msgId = "MSG-" + System.currentTimeMillis() + "-" + (int) (1000 + Math.random() * 9000);
        String timestamp = LocalDateTime.now().format(formatter);
        long nowMs = System.currentTimeMillis();

        Set<String> candidateIds = getCandidateIds(user);

        // Resolve recipient ID cleanly
        String recipientId = null;
        if (explicitRecipientId != null && !explicitRecipientId.trim().isEmpty()) {
            recipientId = explicitRecipientId.trim();
        }
        if (recipientId == null || recipientId.isEmpty() || candidateIds.contains(recipientId)
                || candidateIds.contains(recipientId.toLowerCase())) {
            if (conv.getParticipants() != null) {
                for (String p : conv.getParticipants()) {
                    if (p != null && !candidateIds.contains(p) && !candidateIds.contains(p.toLowerCase())) {
                        recipientId = p;
                        break;
                    }
                }
            }
        }
        if (recipientId == null || recipientId.isEmpty() || candidateIds.contains(recipientId)
                || candidateIds.contains(recipientId.toLowerCase())) {
            if (conv.getStaffUsername() != null && !candidateIds.contains(conv.getStaffUsername())
                    && !candidateIds.contains(conv.getStaffUsername().toLowerCase())) {
                recipientId = conv.getStaffUsername();
            } else if (conv.getStudentRegNo() != null && !candidateIds.contains(conv.getStudentRegNo())
                    && !candidateIds.contains(conv.getStudentRegNo().toLowerCase())) {
                recipientId = conv.getStudentRegNo();
            }
        }
        if ((recipientId == null || recipientId.isEmpty()) && realConvId.startsWith("conv_")) {
            String[] parts = realConvId.substring(5).split("_");
            if (parts.length >= 2) {
                if (!candidateIds.contains(parts[0]) && !candidateIds.contains(parts[0].toLowerCase())) {
                    recipientId = parts[0];
                } else {
                    recipientId = parts[1];
                }
            }
        }

        boolean isStudentSide = candidateIds.contains(conv.getStudentRegNo())
                || (conv.getStudentRegNo() != null && candidateIds.contains(conv.getStudentRegNo().toLowerCase()));

        conv.setLastMessage(cleanContent);
        conv.setLastMessageTime(timestamp);
        conv.setLastMessageSender(user.getName());
        conv.setLastMessageSenderId(user.getIdentifier());
        conv.setLastMessageStatus("DELIVERED");
        conv.setUpdatedAt(nowMs);

        // Ensure participants list contains both sender and recipient
        if (conv.getParticipants() == null) {
            conv.setParticipants(new ArrayList<>());
        }
        Set<String> partSet = new LinkedHashSet<>(conv.getParticipants());
        partSet.add(user.getIdentifier());
        partSet.add(user.getIdentifier().toLowerCase());
        if (recipientId != null && !recipientId.isEmpty()) {
            partSet.add(recipientId);
            partSet.add(recipientId.toLowerCase());
        }
        conv.setParticipants(new ArrayList<>(partSet));

        Map<String, Object> convUpdates = new HashMap<>();
        convUpdates.put("lastMessage", cleanContent);
        convUpdates.put("lastMessageTime", timestamp);
        convUpdates.put("lastMessageSender", user.getName());
        convUpdates.put("lastMessageSenderId", user.getIdentifier());
        convUpdates.put("lastMessageStatus", "DELIVERED");
        convUpdates.put("updatedAt", nowMs);
        convUpdates.put("participants", conv.getParticipants());

        if (isStudentSide) {
            conv.setUnreadCountStaff(conv.getUnreadCountStaff() + 1);
            convUpdates.put("unreadCountStaff", conv.getUnreadCountStaff());
        } else {
            conv.setUnreadCountStudent(conv.getUnreadCountStudent() + 1);
            convUpdates.put("unreadCountStudent", conv.getUnreadCountStudent());
        }

        try {
            db.collection("conversations").document(realConvId).set(conv,
                    com.google.cloud.firestore.SetOptions.merge());
        } catch (Exception ex) {
            System.err.println("[ChatService] Notice updating conversation in Firestore: " + ex.getMessage());
        }

        localConversations.put(realConvId, conv);
        localConversations.put(canonConvId, conv);
        localConversations.put(conversationId, conv);

        ChatMessage msg = new ChatMessage();
        msg.setId(msgId);
        msg.setConversationId(realConvId);
        msg.setSenderId(user.getIdentifier());
        msg.setRecipientId(recipientId != null ? recipientId : "");
        msg.setSenderName(user.getName());
        msg.setSenderRole(user.getRole().name());
        msg.setContent(cleanContent);
        msg.setTimestamp(timestamp);
        msg.setCreatedAt(nowMs);
        msg.setRead(false);
        msg.setDelivered(true);
        msg.setStatus("DELIVERED");
        msg.setReplyToId(replyToId);
        msg.setReplyToSender(replyToSender);
        msg.setReplyToText(replyToText);
        msg.setAttachmentUrl(attachmentUrl);
        msg.setAttachmentName(attachmentName);
        msg.setAttachmentType(attachmentType);
        msg.setAttachmentSize(attachmentSize);

        localMessages.computeIfAbsent(realConvId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(msg);
        if (!realConvId.equals(canonConvId)) {
            localMessages.computeIfAbsent(canonConvId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(msg);
        }
        if (!realConvId.equals(conversationId)) {
            localMessages.computeIfAbsent(conversationId, k -> new java.util.concurrent.CopyOnWriteArrayList<>())
                    .add(msg);
        }

        // Invalidate sync cache so latest message is immediately visible on next check
        lastMessageSyncTimestamps.remove("msg_" + realConvId);
        lastMessageSyncTimestamps.remove("msg_" + canonConvId);
        lastMessageSyncTimestamps.remove("msg_" + conversationId);
        lastSyncTimestamps.remove(user.getIdentifier().toLowerCase());
        lastSyncTimestamps.remove(user.getIdentifier());
        if (recipientId != null) {
            lastSyncTimestamps.remove(recipientId.toLowerCase());
            lastSyncTimestamps.remove(recipientId);
        }

        // Parallel non-blocking Firestore write
        try {
            ApiFuture<?> f1 = db.collection("chat_messages").document(msgId).set(msg);
            ApiFuture<?> f2 = db.collection("conversations").document(realConvId).collection("messages").document(msgId)
                    .set(msg);
            ApiFutures.allAsList(List.of(f1, f2)).get();
            System.out.println("[ChatServer-Send] Message " + msgId
                    + " successfully persisted to Firestore (chat_messages and conversations/" + realConvId
                    + "/messages)");
        } catch (Exception ex) {
            System.err.println("[ChatServer-Send] Error writing message to Firestore: " + ex.getMessage());
        }

        // Notify recipient
        try {
            if (recipientId != null && !recipientId.isEmpty()) {
                notificationService.createNotification(
                        recipientId,
                        "New Message from " + user.getName(),
                        cleanContent.length() > 60 ? cleanContent.substring(0, 57) + "..." : cleanContent,
                        "CHAT_MESSAGE",
                        realConvId,
                        null,
                        user.getRole().name());
            }
        } catch (Exception ignored) {
        }

        return msg;
    }

    public int getUnreadCount(UserProfile user) throws ExecutionException, InterruptedException {
        int total = 0;
        List<ChatConversation> convs = getConversations(user);
        Set<String> candidateIds = getCandidateIds(user);
        for (ChatConversation c : convs) {
            boolean isStudentSide = candidateIds.contains(c.getStudentRegNo())
                    || (c.getStudentRegNo() != null && candidateIds.contains(c.getStudentRegNo().toLowerCase()));
            if (isStudentSide) {
                total += c.getUnreadCountStudent();
            } else {
                total += c.getUnreadCountStaff();
            }
        }
        return total;
    }

    private static final Map<String, Map<String, Long>> typingRegistry = new java.util.concurrent.ConcurrentHashMap<>();

    public void setTyping(UserProfile user, String conversationId, boolean isTyping) {
        if (user == null || conversationId == null)
            return;
        String canonConvId = getCanonicalIdFromConvId(conversationId);
        Map<String, Long> userTyping = typingRegistry.computeIfAbsent(canonConvId,
                k -> new java.util.concurrent.ConcurrentHashMap<>());
        String userId = user.getIdentifier();
        if (isTyping) {
            userTyping.put(userId, System.currentTimeMillis());
        } else {
            userTyping.remove(userId);
        }
    }

    public List<Map<String, Object>> getTypingUsers(UserProfile user, String conversationId) {
        if (user == null || conversationId == null)
            return Collections.emptyList();
        String canonConvId = getCanonicalIdFromConvId(conversationId);
        Map<String, Long> userTyping = typingRegistry.get(canonConvId);
        if (userTyping == null || userTyping.isEmpty())
            return Collections.emptyList();

        long cutoff = System.currentTimeMillis() - 4000;
        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> myIds = getCandidateIds(user);

        for (Map.Entry<String, Long> entry : userTyping.entrySet()) {
            if (entry.getValue() >= cutoff && !myIds.contains(entry.getKey())
                    && !myIds.contains(entry.getKey().toLowerCase())) {
                UserProfile typer = findUserFast(entry.getKey());
                String name = typer != null ? typer.getName() : entry.getKey();
                result.add(Map.of("identifier", entry.getKey(), "name", name));
            }
        }
        return result;
    }

    public boolean deleteMessage(UserProfile user, String conversationId, String messageId)
            throws ExecutionException, InterruptedException {
        if (user == null || conversationId == null || messageId == null) {
            throw new IllegalArgumentException("Invalid message deletion parameters");
        }
        String canonConvId = getCanonicalIdFromConvId(conversationId);
        List<ChatMessage> msgs = localMessages.get(canonConvId);
        if (msgs == null)
            msgs = localMessages.get(conversationId);

        ChatMessage target = null;
        if (msgs != null) {
            for (ChatMessage m : msgs) {
                if (messageId.equals(m.getId())) {
                    target = m;
                    break;
                }
            }
        }

        if (target == null) {
            try {
                DocumentSnapshot doc = db.collection("conversations").document(canonConvId).collection("messages")
                        .document(messageId).get().get();
                if (doc != null && doc.exists()) {
                    target = doc.toObject(ChatMessage.class);
                    if (target != null && target.getId() == null)
                        target.setId(doc.getId());
                }
            } catch (Exception ignored) {
            }
        }
        if (target == null) {
            try {
                DocumentSnapshot doc = db.collection("chat_messages").document(messageId).get().get();
                if (doc != null && doc.exists()) {
                    target = doc.toObject(ChatMessage.class);
                    if (target != null && target.getId() == null)
                        target.setId(doc.getId());
                }
            } catch (Exception ignored) {
            }
        }

        if (target == null) {
            throw new IllegalArgumentException("Message not found: " + messageId);
        }

        Set<String> candidateIds = getCandidateIds(user);
        boolean isSender = candidateIds.contains(target.getSenderId())
                || (target.getSenderId() != null && candidateIds.contains(target.getSenderId().toLowerCase()));

        if (!isSender && user.getRole() != UserRole.PRINCIPAL && user.getRole() != UserRole.HOD) {
            throw new SecurityException("You are not authorized to delete this message.");
        }

        target.setDeleted(true);
        target.setContent("This message was deleted");
        target.setAttachmentUrl(null);
        target.setAttachmentName(null);
        target.setAttachmentType(null);
        target.setAttachmentSize(null);
        target.setDeletedAt(LocalDateTime.now().format(formatter));

        try {
            db.collection("chat_messages").document(messageId).set(target,
                    com.google.cloud.firestore.SetOptions.merge());
            db.collection("conversations").document(canonConvId).collection("messages").document(messageId).set(target,
                    com.google.cloud.firestore.SetOptions.merge());
            if (!canonConvId.equals(conversationId)) {
                db.collection("conversations").document(conversationId).collection("messages").document(messageId)
                        .set(target, com.google.cloud.firestore.SetOptions.merge());
            }
        } catch (Exception ex) {
            System.err.println("[ChatService] Notice deleting message in Firestore: " + ex.getMessage());
        }

        lastMessageSyncTimestamps.remove("msg_" + canonConvId);
        lastMessageSyncTimestamps.remove("msg_" + conversationId);
        return true;
    }

    public void invalidateUserCache(String identifier) {
        if (identifier != null) {
            String clean = identifier.trim().toLowerCase();
            fastUserCache.remove(clean);
        }
    }
}
