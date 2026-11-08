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

        UserProfile student = InstitutionalRoster.findStudent(query);
        if (student != null) {
            UserProfile copy = cloneProfile(student);
            String photo = getCachedPhoto(copy.getIdentifier());
            if (photo != null) copy.setProfilePhoto(photo);
            return copy;
        }

        try {
            DocumentSnapshot doc = db.collection("students").document(query).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!doc.exists()) {
                var snap = db.collection("students").whereEqualTo("email", query.toLowerCase()).limit(1).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (!snap.isEmpty()) {
                    doc = snap.getDocuments().get(0);
                }
            }

            if (doc != null && doc.exists()) {
                UserProfile p = new UserProfile();
                p.setId(doc.getId());
                p.setIdentifier(doc.getString("regNo") != null ? doc.getString("regNo") : doc.getId());
                p.setName(doc.getString("name"));
                p.setEmail(doc.getString("email"));
                p.setContact(doc.getString("contact") != null ? doc.getString("contact") : "+91 98765 00000");
                p.setSection(doc.getString("section"));
                p.setDepartment(doc.getString("dept") != null ? doc.getString("dept") : "CSE");
                p.setRole(UserRole.STUDENT);
                p.setAcademicYear(CURRENT_ACADEMIC_YEAR);
                p.setYear("IV Year");
                String sType = doc.getString("studentType");
                if (sType == null || sType.isEmpty()) sType = doc.getString("type");
                p.setStudentType(sType != null && !sType.isEmpty() ? sType : "Day Scholar");
                p.setBio(doc.getString("bio") != null ? doc.getString("bio") : "Authorized student record enrolled in " + CURRENT_ACADEMIC_YEAR + " at Gnanamani College of Technology.");

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
        } else if ("advisor".equals(clean) || "staff".equals(clean) || "advisor.demo@epoch.edu".equals(clean) || "arularasi@gct.ac.in".equals(clean)) {
            clean = "arularasi";
        } else if ("admin".equals(clean) || "admin@gct.ac.in".equals(clean) || "admin.demo@epoch.edu".equals(clean)) {
            clean = "admin";
        }

        UserProfile cached = getCachedProfile(clean);
        if (cached != null) return cloneProfile(cached);

        UserProfile authStaff = getAuthoritativeStaffProfile(clean);
        if (authStaff != null) {
            UserProfile copy = cloneProfile(authStaff);
            String photo = getCachedPhoto(clean);
            if (photo != null) copy.setProfilePhoto(photo);
            return copy;
        }

        try {
            DocumentSnapshot doc = db.collection("staff").document(clean).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!doc.exists()) {
                var snap = db.collection("staff").whereEqualTo("email", clean).limit(1).get().get(1000, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (!snap.isEmpty()) {
                    doc = snap.getDocuments().get(0);
                }
            }
            if (doc != null && doc.exists()) {
                UserProfile p = new UserProfile();
                p.setId(doc.getId());
                p.setIdentifier(doc.getString("username") != null ? doc.getString("username") : doc.getId());
                p.setName(doc.getString("name"));
                p.setEmail(doc.getString("email") != null ? doc.getString("email") : (clean + "@gct.ac.in"));
                p.setSection(doc.getString("section"));
                p.setDepartment(doc.getString("dept") != null ? doc.getString("dept") : "CSE");
                String roleStr = doc.getString("role");
                p.setRole(roleStr != null ? UserRole.valueOf(roleStr) : UserRole.ADVISOR);
                p.setAcademicYear("Staff / Faculty");
                p.setBio(doc.getString("bio") != null ? doc.getString("bio") : "Faculty member at Gnanamani College of Technology.");

                String photo = doc.getString("profilePhoto");
                if (photo == null || photo.isEmpty()) photo = doc.getString("photoUrl");
                if (photo == null || photo.isEmpty()) photo = doc.getString("avatarUrl");
                if (photo == null || photo.isEmpty()) photo = getCachedPhoto(clean);
                if (photo != null && !photo.isEmpty()) {
                    p.setProfilePhoto(photo);
                    setCachedPhoto(clean, photo);
                }

                return p;
            }
        } catch (Exception ex) {
            // Firestore quota limit or offline; use authoritative staff records
        }

        return getAuthoritativeStaffProfile(clean);
    }

    private UserProfile getAuthoritativeStaffProfile(String clean) {
        UserProfile p = null;
        if ("admin".equals(clean)) {
            p = new UserProfile();
            p.setId("admin");
            p.setIdentifier("admin");
            p.setName("Dr. S. K. Ramesh");
            p.setEmail("admin@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("College Administration & Accounts");
            p.setRole(UserRole.ADMIN);
            p.setAcademicYear("Staff / Faculty");
            p.setBio("College Administrator & Accounts Officer at Gnanamani College of Technology.");
        } else if ("arularasi".equals(clean)) {
            p = new UserProfile();
            p.setId("arularasi");
            p.setIdentifier("arularasi");
            p.setName("Mrs. P. Arularasi");
            p.setEmail("arularasi@gct.ac.in");
            p.setSection("CSE-A");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            p.setBio("Academic advisor for Section CSE-A.");
        } else if ("divyabharathi".equals(clean)) {
            p = new UserProfile();
            p.setId("divyabharathi");
            p.setIdentifier("divyabharathi");
            p.setName("Dr. Divyabharathi");
            p.setEmail("divyabharathi@gct.ac.in");
            p.setSection("CSE-B");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            p.setBio("Academic advisor for Section CSE-B.");
        } else if ("rajavathijayapriya".equals(clean) || "jayapriya".equals(clean) || "raja".equals(clean)) {
            p = new UserProfile();
            p.setId("rajavathijayapriya");
            p.setIdentifier("rajavathijayapriya");
            p.setName("Mrs. Rajavathi Jayapriya");
            p.setEmail("advisor.c.demo@epoch.edu");
            p.setSection("CSE-C");
            p.setDepartment("CSE");
            p.setRole(UserRole.ADVISOR);
            p.setAcademicYear("Staff / Faculty");
            p.setBio("Academic advisor for Section CSE-C.");
        } else if ("gopinath".equals(clean)) {
            p = new UserProfile();
            p.setId("gopinath");
            p.setIdentifier("gopinath");
            p.setName("Dr. K. Gopinath");
            p.setEmail("gopinath@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("CSE");
            p.setRole(UserRole.HOD);
            p.setAcademicYear("Staff / Faculty");
            p.setBio("Head of Department (CSE).");
        } else if ("bsanjaygandhi".equals(clean)) {
            p = new UserProfile();
            p.setId("bsanjaygandhi");
            p.setIdentifier("bsanjaygandhi");
            p.setName("Dr. B. Sanjay Gandhi");
            p.setEmail("principal@gct.ac.in");
            p.setSection("ALL");
            p.setDepartment("Administration");
            p.setRole(UserRole.PRINCIPAL);
            p.setAcademicYear("Staff / Faculty");
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

    public UserProfile updateStudentProfile(String studentRegNo, String name, String contact, String bio) throws ExecutionException, InterruptedException {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Full display name cannot be blank.");
        }
        String cleanName = name.trim();
        String cleanContact = contact != null ? contact.trim() : "";
        String cleanBio = bio != null ? bio.trim() : "";

        var docRef = db.collection("students").document(studentRegNo.trim());
        var snap = docRef.get().get();
        if (!snap.exists()) {
            throw new IllegalArgumentException("Student record not found for: " + studentRegNo);
        }

        Map<String, Object> updates = new HashMap<>();
        updates.put("name", cleanName);
        if (!cleanContact.isEmpty()) {
            updates.put("contact", cleanContact);
        }
        if (!cleanBio.isEmpty()) {
            updates.put("bio", cleanBio);
        }
        updates.put("academicYear", CURRENT_ACADEMIC_YEAR);

        docRef.update(updates).get();

        UserProfile updated = findStudent(studentRegNo);
        return updated;
    }

    public UserProfile updateProfilePhoto(UserProfile user, String photo) throws ExecutionException, InterruptedException {
        if (user == null || user.getIdentifier() == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        String cleanId = user.getIdentifier().trim().toLowerCase();
        setCachedPhoto(cleanId, photo);
        user.setProfilePhoto(photo);

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("profilePhoto", photo);
            updates.put("photoUrl", photo);
            updates.put("avatarUrl", photo);
            updates.put("photoUpdatedAt", System.currentTimeMillis());

            if (user.getRole() == UserRole.STUDENT) {
                db.collection("students").document(user.getIdentifier().trim()).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            } else if (user.getRole() == UserRole.ADMIN) {
                db.collection("admins").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                db.collection("staff").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            } else {
                db.collection("staff").document(cleanId).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            }
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
        setCachedPhoto(cleanId, null);
        user.setProfilePhoto(null);

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("profilePhoto", "");
            updates.put("photoUrl", "");
            updates.put("avatarUrl", "");
            updates.put("photoUpdatedAt", System.currentTimeMillis());

            if (user.getRole() == UserRole.STUDENT) {
                db.collection("students").document(user.getIdentifier().trim()).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            } else if (user.getRole() == UserRole.ADMIN) {
                db.collection("admins").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
                db.collection("staff").document("admin").set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            } else {
                db.collection("staff").document(cleanId).set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
            }
        } catch (Exception ex) {
            System.err.println("[EPOCH] Failed to remove profile photo from Firestore: " + ex.getMessage());
        }

        return user;
    }

    public int migrateStudentAcademicYears() {
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