package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    public static final String CURRENT_ACADEMIC_YEAR = "IV Year B.E.";
    private static final Map<String, String> PHOTO_CACHE = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, UserProfile> USER_PROFILE_CACHE = new java.util.concurrent.ConcurrentHashMap<>();
    private static volatile boolean academicYearMigrationDone = false;

    private final Firestore db;

    public UserService(Firestore db) {
        this.db = db;
    }

    public static UserProfile getCachedProfile(String identifier) {
        if (identifier == null) return null;
        return USER_PROFILE_CACHE.get(identifier.trim().toLowerCase());
    }

    public static void setCachedProfile(String identifier, UserProfile profile) {
        if (identifier == null || profile == null) return;
        USER_PROFILE_CACHE.put(identifier.trim().toLowerCase(), profile);
        USER_PROFILE_CACHE.put(identifier.trim(), profile);
    }

    public static boolean isResourceExhausted(Throwable t) {
        while (t != null) {
            if (t instanceof com.google.api.gax.rpc.ResourceExhaustedException) return true;
            if (t instanceof io.grpc.StatusRuntimeException sre && sre.getStatus().getCode() == io.grpc.Status.Code.RESOURCE_EXHAUSTED) return true;
            String msg = t.getMessage();
            if (msg != null && (msg.contains("RESOURCE_EXHAUSTED") || msg.contains("Quota exceeded"))) return true;
            t = t.getCause();
        }
        return false;
    }

    public static String resolveClassAdvisorForSection(String section) {
        if (section == null || section.trim().isEmpty()) {
            return "Advisor assignment unavailable";
        }
        String norm = section.trim().toUpperCase()
                .replaceAll("^SECTION\\s*", "")
                .replaceAll("[\\s_]+", "-")
                .replaceAll("CSE([ABC])$", "CSE-$1");
        if ("CSE-A".equals(norm)) {
            return "Mrs. P. Arularasi (CSE-A)";
        }
        if ("CSE-B".equals(norm)) {
            return "Mrs. Dhivya Bharathi (CSE-B)";
        }
        if ("CSE-C".equals(norm)) {
            return "Mrs. Rajavathi Jayapriya (CSE-C)";
        }
        return "Advisor assignment unavailable";
    }

    public static UserProfile cloneProfile(UserProfile source) {
        if (source == null) return null;
        UserProfile p = new UserProfile();
        p.setId(source.getId());
        p.setIdentifier(source.getIdentifier());
        p.setName(source.getName());
        p.setEmail(source.getEmail());
        p.setContact(source.getContact());
        p.setDepartment(source.getDepartment());
        p.setSection(source.getSection());
        p.setRole(source.getRole());
        p.setAcademicYear(source.getAcademicYear());
        p.setYear(source.getYear());
        p.setStudentType(source.getStudentType());
        p.setBio(source.getBio());
        p.setProfilePhoto(source.getProfilePhoto());
        p.setAddress(source.getAddress());
        p.setEmergencyContact(source.getEmergencyContact());
        p.setTitle(source.getTitle());
        p.setAdvisor(source.getRole() == UserRole.STUDENT
                ? resolveClassAdvisorForSection(source.getSection())
                : source.getAdvisor());
        return p;
    }

    public static String getCachedPhoto(String identifier) {
        if (identifier == null) return null;
        return PHOTO_CACHE.get(identifier.trim().toLowerCase());
    }

    public static void setCachedPhoto(String identifier, String photo) {
        if (identifier == null) return;
        if (photo == null || photo.isEmpty()) {
            PHOTO_CACHE.remove(identifier.trim().toLowerCase());
        } else {
            PHOTO_CACHE.put(identifier.trim().toLowerCase(), photo);
        }
    }

    public UserProfile findStudent(String regNoOrEmail) throws ExecutionException, InterruptedException {
        String query = regNoOrEmail.trim();
        String clean = query.toLowerCase();
        if ("student".equals(clean) || "student.demo@epoch.edu".equals(clean) || "student@epoch.edu".equals(clean) || "student@gct.ac.in".equals(clean)) {
            query = "620823104002";
        }
        UserProfile cached = getCachedProfile(query);
        if (cached != null) return cloneProfile(cached);

        UserProfile baseline = InstitutionalRoster.findStudent(query);

        try {
            DocumentSnapshot doc = db.collection("students").document(query).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!doc.exists()) {
                var snap = db.collection("students").whereEqualTo("email", query.toLowerCase()).limit(1).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (!snap.isEmpty()) {
                    doc = snap.getDocuments().get(0);
                }
            }

            if (doc != null && doc.exists()) {
                UserProfile p = baseline != null ? cloneProfile(baseline) : new UserProfile();
                p.setId(doc.getId());
                p.setIdentifier(doc.getString("regNo") != null ? doc.getString("regNo") : doc.getId());
                if (doc.getString("name") != null && !doc.getString("name").isEmpty()) p.setName(doc.getString("name"));
                if (doc.getString("email") != null && !doc.getString("email").isEmpty()) p.setEmail(doc.getString("email"));
                if (doc.getString("contact") != null && !doc.getString("contact").isEmpty()) p.setContact(doc.getString("contact"));
                if (doc.getString("section") != null && !doc.getString("section").isEmpty()) p.setSection(doc.getString("section"));
                if (doc.getString("dept") != null && !doc.getString("dept").isEmpty()) p.setDepartment(doc.getString("dept"));
                p.setRole(UserRole.STUDENT);
                p.setAcademicYear(CURRENT_ACADEMIC_YEAR);
                p.setYear("IV Year");
                String sType = doc.getString("studentType");
                if (sType == null || sType.isEmpty()) sType = doc.getString("type");
                p.setStudentType(sType != null && !sType.isEmpty() ? sType : "Day Scholar");
                if (doc.getString("bio") != null && !doc.getString("bio").isEmpty()) p.setBio(doc.getString("bio"));
                if (doc.getString("address") != null && !doc.getString("address").isEmpty()) p.setAddress(doc.getString("address"));
                if (doc.getString("emergencyContact") != null && !doc.getString("emergencyContact").isEmpty()) p.setEmergencyContact(doc.getString("emergencyContact"));
                if (doc.getString("title") != null && !doc.getString("title").isEmpty()) p.setTitle(doc.getString("title"));
                p.setAdvisor(resolveClassAdvisorForSection(p.getSection()));

                String photo = doc.getString("profilePhoto");
                if (photo == null || photo.isEmpty()) photo = doc.getString("photoUrl");
                if (photo == null || photo.isEmpty()) photo = doc.getString("avatarUrl");
                if (photo == null || photo.isEmpty()) photo = getCachedPhoto(p.getIdentifier());
                if (photo != null && !photo.isEmpty()) {
                    p.setProfilePhoto(photo);
                    setCachedPhoto(p.getIdentifier(), photo);
                }

                setCachedProfile(p.getIdentifier(), p);
                return cloneProfile(p);
            }
        } catch (Exception ex) {
            // Firestore quota limit or offline; use authoritative institutional roster
        }

        if (baseline != null) {
            UserProfile copy = cloneProfile(baseline);
            String photo = getCachedPhoto(copy.getIdentifier());
            if (photo != null) copy.setProfilePhoto(photo);
            setCachedProfile(copy.getIdentifier(), copy);
            return copy;
        }
        return null;
    }

    public UserProfile findStaff(String username) throws ExecutionException, InterruptedException {
        String clean = username.trim().toLowerCase();
        if ("principal".equals(clean) || "principal@gct.ac.in".equals(clean) || "principal.demo@epoch.edu".equals(clean)) {
            clean = "bsanjaygandhi";
        } else if ("hod".equals(clean) || "hod@gct.ac.in".equals(clean) || "hod.demo@epoch.edu".equals(clean)) {
            clean = "gopinath";
        } else if ("dhivyabharathi".equals(clean) || "dhivya".equals(clean) || "advisor.b.demo@epoch.edu".equals(clean) || "divyabharathi@gct.ac.in".equals(clean)) {
            clean = "divyabharathi";
        } else if ("advisor.c.demo@epoch.edu".equals(clean) || "rajavathijayapriya@gct.ac.in".equals(clean) || "rajavathi".equals(clean) || "jayapriya".equals(clean) || "raja".equals(clean)) {
            clean = "rajavathijayapriya";
        } else if ("advisor".equals(clean) || "advisor.demo@epoch.edu".equals(clean) || "arularasi@gct.ac.in".equals(clean)) {
            clean = "arularasi";
        } else if ("staff".equals(clean) || "staff.demo@epoch.edu".equals(clean) || "kavitha".equals(clean) || "kavitha@gct.ac.in".equals(clean)) {
            clean = "kavitha";
        } else if ("admin".equals(clean) || "admin@gct.ac.in".equals(clean) || "admin.demo@epoch.edu".equals(clean)) {
            clean = "admin";
        }

        UserProfile cached = getCachedProfile(clean);
        if (cached != null) return cloneProfile(cached);

        UserProfile authStaff = getAuthoritativeStaffProfile(clean);

        try {
            DocumentSnapshot doc = db.collection("staff").document(clean).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!doc.exists()) {
                var snap = db.collection("staff").whereEqualTo("email", clean).limit(1).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (!snap.isEmpty()) {
                    doc = snap.getDocuments().get(0);
                }
            }
            if (doc != null && doc.exists()) {
                UserProfile p = authStaff != null ? cloneProfile(authStaff) : new UserProfile();
                p.setId(doc.getId());
                p.setIdentifier(clean);
                if (doc.getString("name") != null && !doc.getString("name").isEmpty()) p.setName(doc.getString("name"));
                if (doc.getString("email") != null && !doc.getString("email").isEmpty()) p.setEmail(doc.getString("email"));
                if (doc.getString("contact") != null && !doc.getString("contact").isEmpty()) p.setContact(doc.getString("contact"));
                if (doc.getString("section") != null && !doc.getString("section").isEmpty()) p.setSection(doc.getString("section"));
                if (doc.getString("dept") != null && !doc.getString("dept").isEmpty()) p.setDepartment(doc.getString("dept"));
                String roleStr = doc.getString("role");
                if (roleStr != null) {
                    try { p.setRole(UserRole.valueOf(roleStr)); } catch (Exception ignored) {}
                }
                if (doc.getString("bio") != null && !doc.getString("bio").isEmpty()) p.setBio(doc.getString("bio"));
                if (doc.getString("address") != null && !doc.getString("address").isEmpty()) p.setAddress(doc.getString("address"));
                if (doc.getString("emergencyContact") != null && !doc.getString("emergencyContact").isEmpty()) p.setEmergencyContact(doc.getString("emergencyContact"));
                if (doc.getString("title") != null && !doc.getString("title").isEmpty()) p.setTitle(doc.getString("title"));

                String photo = doc.getString("profilePhoto");
                if (photo == null || photo.isEmpty()) photo = doc.getString("photoUrl");
                if (photo == null || photo.isEmpty()) photo = doc.getString("avatarUrl");
                if (photo == null || photo.isEmpty()) photo = getCachedPhoto(clean);
                if (photo != null && !photo.isEmpty()) {
                    p.setProfilePhoto(photo);
                    setCachedPhoto(clean, photo);
                }

                setCachedProfile(clean, p);
                return cloneProfile(p);
            }
        } catch (Exception ex) {
            // Firestore quota limit or offline; use authoritative staff profile
        }

        if (authStaff != null) {
            UserProfile copy = cloneProfile(authStaff);
            String photo = getCachedPhoto(clean);
            if (photo != null) copy.setProfilePhoto(photo);
            setCachedProfile(clean, copy);
            return copy;
        }
        return null;
    }

    private UserProfile getAuthoritativeStaffProfile(String clean) {
        UserProfile p = null;
        if ("admin".equals(clean)) {
            p = new UserProfile();
            p.setId("admin");
            p.setIdentifier("admin");
            p.setName("Dr. S. K. Ramesh");
            p.setEmail("admin@gct.ac.in");
            p.setContact("+91 98765 00099");
            p.setSection("ALL");
            p.setDepartment("College Administration & Accounts");
            p.setRole(UserRole.ADMIN);
            p.setTitle("College Administrator & Chief Accounts Officer");
            p.setBio("College Administrator & Accounts Officer at Gnanamani College of Technology.");
        } else if ("arularasi".equals(clean)) {
            p = new UserProfile();
            p.setId("arularasi");
            p.setIdentifier("arularasi");
            p.setName("Mrs. P. Arularasi");
            p.setEmail("arularasi@gct.ac.in");
            p.setContact("+91 98765 00002");
            p.setSection("CSE-A");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setTitle("Assistant Professor & Class Advisor (CSE-A)");
            p.setBio("Academic advisor for Section CSE-A. Overseeing student attendance, on-duty approvals, and mentor evaluations.");
        } else if ("divyabharathi".equals(clean)) {
            p = new UserProfile();
            p.setId("divyabharathi");
            p.setIdentifier("divyabharathi");
            p.setName("Dr. Divyabharathi");
            p.setEmail("divyabharathi@gct.ac.in");
            p.setContact("+91 98765 00012");
            p.setSection("CSE-B");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setTitle("Assistant Professor & Class Advisor (CSE-B)");
            p.setBio("Academic advisor for Section CSE-B.");
        } else if ("rajavathijayapriya".equals(clean) || "jayapriya".equals(clean) || "raja".equals(clean)) {
            p = new UserProfile();
            p.setId("rajavathijayapriya");
            p.setIdentifier("rajavathijayapriya");
            p.setName("Mrs. Rajavathi Jayapriya");
            p.setEmail("advisor.c.demo@epoch.edu");
            p.setContact("+91 98765 00013");
            p.setSection("CSE-C");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setTitle("Assistant Professor & Class Advisor (CSE-C)");
            p.setBio("Academic advisor for Section CSE-C.");
        } else if ("kavitha".equals(clean)) {
            p = new UserProfile();
            p.setId("kavitha");
            p.setIdentifier("kavitha");
            p.setName("Dr. M. Kavitha");
            p.setEmail("kavitha@gct.ac.in");
            p.setContact("+91 98765 00015");
            p.setSection("ALL");
            p.setDepartment("CSE");
            p.setRole(UserRole.STAFF);
            p.setTitle("Assistant Professor (CSE)");
            p.setBio("Faculty member in the Department of Computer Science & Engineering.");
        } else if ("gopinath".equals(clean)) {
            p = new UserProfile();
            p.setId("gopinath");
            p.setIdentifier("gopinath");
            p.setName("Dr. K. Gopinath");
            p.setEmail("gopinath@gct.ac.in");
            p.setContact("+91 98765 00003");
            p.setSection("ALL");
            p.setDepartment("CSE");
            p.setRole(UserRole.HOD);
            p.setTitle("Professor & Head of Department (CSE)");
            p.setBio("Head of Department supervising CSE academic curriculum, symposium endorsements, and faculty development.");
        } else if ("bsanjaygandhi".equals(clean)) {
            p = new UserProfile();
            p.setId("bsanjaygandhi");
            p.setIdentifier("bsanjaygandhi");
            p.setName("Dr. B. Sanjay Gandhi");
            p.setEmail("principal@gct.ac.in");
            p.setContact("+91 98765 00004");
            p.setSection("ALL");
            p.setDepartment("Administration");
            p.setRole(UserRole.PRINCIPAL);
            p.setTitle("Principal & Chief Academic Officer");
            p.setBio("Principal — Gnanamani College of Technology.");
        }
        if (p != null) {
            String photo = getCachedPhoto(clean);
            if (photo != null) p.setProfilePhoto(photo);
            return p;
        }
        return null;
    }

    public UserProfile findUser(String identifier) throws ExecutionException, InterruptedException {
        if (identifier == null || identifier.trim().isEmpty()) return null;
        String clean = identifier.trim();
        UserProfile student = findStudent(clean);
        if (student != null) return student;
        return findStaff(clean);
    }

    public UserProfile updateProfile(UserProfile currentUser, String name, String contact, String bio) throws ExecutionException, InterruptedException {
        return updateProfile(currentUser, name, contact, bio, null, null, null);
    }

    public UserProfile updateProfile(UserProfile currentUser, String name, String contact, String bio, String email, String address, String emergencyContact) throws ExecutionException, InterruptedException {
        if (currentUser == null || currentUser.getIdentifier() == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Full display name cannot be blank.");
        }
        String cleanName = name.trim();
        String cleanContact = contact != null ? contact.trim() : "";
        String cleanBio = bio != null ? bio.trim() : "";
        String cleanEmail = email != null ? email.trim() : "";
        String cleanAddress = address != null ? address.trim() : "";
        String cleanEmergency = emergencyContact != null ? emergencyContact.trim() : "";
        String id = (currentUser.getId() != null && !currentUser.getId().trim().isEmpty())
                ? currentUser.getId().trim()
                : currentUser.getIdentifier().trim();

        Map<String, Object> updates = new HashMap<>();
        updates.put("name", cleanName);
        if (!cleanContact.isEmpty()) {
            updates.put("contact", cleanContact);
        }
        if (!cleanBio.isEmpty()) {
            updates.put("bio", cleanBio);
        }
        if (!cleanEmail.isEmpty()) {
            updates.put("email", cleanEmail);
        }
        if (!cleanAddress.isEmpty()) {
            updates.put("address", cleanAddress);
        }
        if (!cleanEmergency.isEmpty()) {
            updates.put("emergencyContact", cleanEmergency);
        }
        updates.put("updatedAt", System.currentTimeMillis());

        if (currentUser.getRole() == UserRole.STUDENT) {
            updates.put("academicYear", CURRENT_ACADEMIC_YEAR);
            try {
                if (db != null) {
                    db.collection("students").document(id)
                            .set(updates, com.google.cloud.firestore.SetOptions.merge())
                            .get(8, java.util.concurrent.TimeUnit.SECONDS);
                }
            } catch (Exception ex) {
                System.err.println("[UserService] Firestore merge failed for student (persisting in-memory): " + ex.getMessage());
            }
            currentUser.setName(cleanName);
            if (!cleanContact.isEmpty()) currentUser.setContact(cleanContact);
            if (!cleanBio.isEmpty()) currentUser.setBio(cleanBio);
            if (!cleanEmail.isEmpty()) currentUser.setEmail(cleanEmail);
            if (!cleanAddress.isEmpty()) currentUser.setAddress(cleanAddress);
            if (!cleanEmergency.isEmpty()) currentUser.setEmergencyContact(cleanEmergency);
            currentUser.setAdvisor(resolveClassAdvisorForSection(currentUser.getSection()));
            setCachedProfile(currentUser.getIdentifier(), currentUser);
            setCachedProfile(id, currentUser);
            syncFirebaseAuth(currentUser.getIdentifier(), currentUser.getEmail(), cleanName, currentUser.getProfilePhoto());
            return cloneProfile(currentUser);
        } else {
            String cleanStaffId = id.toLowerCase();
            try {
                if (db != null) {
                    db.collection("staff").document(cleanStaffId)
                            .set(updates, com.google.cloud.firestore.SetOptions.merge())
                            .get(8, java.util.concurrent.TimeUnit.SECONDS);
                }
            } catch (Exception ex) {
                System.err.println("[UserService] Firestore merge failed for staff (persisting in-memory): " + ex.getMessage());
            }
            currentUser.setName(cleanName);
            if (!cleanContact.isEmpty()) currentUser.setContact(cleanContact);
            if (!cleanBio.isEmpty()) currentUser.setBio(cleanBio);
            if (!cleanEmail.isEmpty()) currentUser.setEmail(cleanEmail);
            if (!cleanAddress.isEmpty()) currentUser.setAddress(cleanAddress);
            if (!cleanEmergency.isEmpty()) currentUser.setEmergencyContact(cleanEmergency);
            setCachedProfile(currentUser.getIdentifier(), currentUser);
            setCachedProfile(cleanStaffId, currentUser);
            syncFirebaseAuth(currentUser.getIdentifier(), currentUser.getEmail(), cleanName, currentUser.getProfilePhoto());
            return cloneProfile(currentUser);
        }
    }

    private void syncFirebaseAuth(String identifier, String email, String name, String photoUrl) {
        try {
            if (!com.google.firebase.FirebaseApp.getApps().isEmpty()) {
                com.google.firebase.auth.FirebaseAuth auth = com.google.firebase.auth.FirebaseAuth.getInstance();
                com.google.firebase.auth.UserRecord userRecord = null;
                try {
                    userRecord = auth.getUser(identifier);
                } catch (Exception ex) {
                    if (email != null && !email.isEmpty()) {
                        try {
                            userRecord = auth.getUserByEmail(email);
                        } catch (Exception ignored) {}
                    }
                }
                if (userRecord != null) {
                    com.google.firebase.auth.UserRecord.UpdateRequest req = userRecord.updateRequest();
                    if (name != null && !name.isEmpty()) req.setDisplayName(name);
                    if (email != null && !email.isEmpty() && !email.equalsIgnoreCase(userRecord.getEmail())) req.setEmail(email);
                    if (photoUrl != null && !photoUrl.isEmpty() && (photoUrl.startsWith("http://") || photoUrl.startsWith("https://"))) {
                        req.setPhotoUrl(photoUrl);
                    }
                    auth.updateUser(req);
                }
            }
        } catch (Exception ignored) {
            // Non-blocking: graceful fallback when Firebase Auth is offline, mocked, or running in local test mode
        }
    }

    public UserProfile updateStudentProfile(String studentRegNo, String name, String contact, String bio) throws ExecutionException, InterruptedException {
        UserProfile student = findStudent(studentRegNo);
        if (student == null) {
            student = new UserProfile();
            student.setId(studentRegNo);
            student.setIdentifier(studentRegNo);
            student.setRole(UserRole.STUDENT);
        }
        return updateProfile(student, name, contact, bio);
    }

    public UserProfile updateProfilePhoto(UserProfile user, String photo) throws ExecutionException, InterruptedException {
        if (user == null || user.getIdentifier() == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        String cleanId = user.getIdentifier().trim().toLowerCase();
        String docId = (user.getId() != null && !user.getId().trim().isEmpty()) ? user.getId().trim() : user.getIdentifier().trim();
        setCachedPhoto(cleanId, photo);
        setCachedPhoto(docId, photo);
        user.setProfilePhoto(photo);

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("profilePhoto", photo);
            updates.put("photoUrl", photo);
            updates.put("avatarUrl", photo);
            updates.put("photoUpdatedAt", System.currentTimeMillis());

            if (db != null) {
                if (user.getRole() == UserRole.STUDENT) {
                    db.collection("students").document(docId).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } else if (user.getRole() == UserRole.ADMIN) {
                    db.collection("admins").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                    db.collection("staff").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } else {
                    db.collection("staff").document(docId.toLowerCase()).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                }
            }
            syncFirebaseAuth(user.getIdentifier(), user.getEmail(), user.getName(), photo);
        } catch (Exception ex) {
            System.err.println("[EPOCH] Failed to persist profile photo to Firestore: " + ex.getMessage());
        }

        return user;
    }

    public UserProfile removeProfilePhoto(UserProfile user) throws ExecutionException, InterruptedException {
        if (user == null || user.getIdentifier() == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        String cleanId = user.getIdentifier().trim().toLowerCase();
        String docId = (user.getId() != null && !user.getId().trim().isEmpty()) ? user.getId().trim() : user.getIdentifier().trim();
        setCachedPhoto(cleanId, null);
        setCachedPhoto(docId, null);
        user.setProfilePhoto(null);

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("profilePhoto", "");
            updates.put("photoUrl", "");
            updates.put("avatarUrl", "");
            updates.put("photoUpdatedAt", System.currentTimeMillis());

            if (db != null) {
                if (user.getRole() == UserRole.STUDENT) {
                    db.collection("students").document(docId).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } else if (user.getRole() == UserRole.ADMIN) {
                    db.collection("admins").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                    db.collection("staff").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                } else {
                    db.collection("staff").document(docId.toLowerCase()).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                }
            }
            syncFirebaseAuth(user.getIdentifier(), user.getEmail(), user.getName(), "");
        } catch (Exception ex) {
            System.err.println("[EPOCH] Failed to remove profile photo from Firestore: " + ex.getMessage());
        }

        return user;
    }

    public int migrateStudentAcademicYears() {
        if (db == null) return 0;
        try {
            var markerRef = db.collection("system_config").document("academic_year_migration");
            var markerSnap = markerRef.get().get();
            if (markerSnap.exists() && Boolean.TRUE.equals(markerSnap.getBoolean("completed_2026"))) {
                return 0;
            }
            var snap = db.collection("students").limit(30).get().get();
            int updatedCount = 0;
            for (DocumentSnapshot doc : snap.getDocuments()) {
                String curYear = doc.getString("academicYear");
                if (curYear == null || !curYear.equals(CURRENT_ACADEMIC_YEAR)) {
                    doc.getReference().update("academicYear", CURRENT_ACADEMIC_YEAR);
                    updatedCount++;
                }
            }
            Map<String, Object> marker = new HashMap<>();
            marker.put("completed_2026", true);
            marker.put("timestamp", System.currentTimeMillis());
            markerRef.set(marker, com.google.cloud.firestore.SetOptions.merge());
            return updatedCount;
        } catch (Exception ex) {
            System.err.println("[EPOCH MIGRATION] Notice: " + ex.getMessage());
            return 0;
        }
    }
}