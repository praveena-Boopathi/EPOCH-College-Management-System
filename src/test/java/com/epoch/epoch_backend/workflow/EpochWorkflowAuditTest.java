package com.epoch.epoch_backend.workflow;

import com.epoch.epoch_backend.controller.UserController;
import com.epoch.epoch_backend.model.OdRequest;
import com.epoch.epoch_backend.model.OdStatus;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.service.ChatService;
import com.epoch.epoch_backend.service.NotificationService;
import com.epoch.epoch_backend.service.OdService;
import com.epoch.epoch_backend.service.PdfGenerationService;
import com.epoch.epoch_backend.service.SignatureService;
import com.epoch.epoch_backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("EPOCH Comprehensive Application Audit & End-to-End Workflow Test")
public class EpochWorkflowAuditTest {

    private UserService userService;
    private NotificationService notificationService;
    private SignatureService signatureService;
    private OdService odService;
    private PdfGenerationService pdfService;
    private ChatService chatService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        userService = new UserService(null);
        notificationService = new NotificationService(null);
        signatureService = new SignatureService(null);
        odService = new OdService(null, userService, notificationService, signatureService);
        pdfService = new PdfGenerationService(signatureService);
        chatService = new ChatService(null, userService, notificationService);
        userController = new UserController(userService, chatService);
    }

    // =========================================================================
    // SECTION A: PROFILE AUDIT FOR ALL ROLES
    // =========================================================================
    @Nested
    @DisplayName("Section A: Profile Audit for All Roles")
    class ProfileAuditTests {

        @Test
        @DisplayName("1. Student Profile: Load, edit permitted fields, persist, and protect immutable fields")
        void testStudentProfileUpdate() throws Exception {
            // Initial load from roster
            UserProfile student = userService.findStudent("620823104002");
            assertNotNull(student, "Student profile must exist in baseline roster");
            assertEquals("620823104002", student.getIdentifier());
            assertEquals(UserRole.STUDENT, student.getRole());
            assertEquals("CSE", student.getDepartment());
            assertEquals("CSE-A", student.getSection());

            // Edit permitted fields: name, contact, bio, address, emergencyContact
            UserProfile updated = userService.updateProfile(student, "ABINAYA G (Updated)", "+91 9876543210", "Aspiring Cloud Engineer", "abinaya.updated@epoch.edu", "123 South St, Namakkal", "+91 9876500000");
            assertNotNull(updated);
            assertEquals("ABINAYA G (Updated)", updated.getName());
            assertEquals("+91 9876543210", updated.getContact());
            assertEquals("Aspiring Cloud Engineer", updated.getBio());
            assertEquals("123 South St, Namakkal", updated.getAddress());
            assertEquals("+91 9876500000", updated.getEmergencyContact());

            // Verify immutable fields remain strictly intact
            assertEquals("620823104002", updated.getIdentifier());
            assertEquals(UserRole.STUDENT, updated.getRole());
            assertEquals("CSE", updated.getDepartment());
            assertEquals("CSE-A", updated.getSection());

            // Verify persistence via cached profile lookup
            UserProfile reloaded = userService.findStudent("620823104002");
            assertEquals("ABINAYA G (Updated)", reloaded.getName());
            assertEquals("+91 9876543210", reloaded.getContact());
            assertEquals("Aspiring Cloud Engineer", reloaded.getBio());
        }

        @Test
        @DisplayName("2. Staff / Advisor Profile: Load, edit permitted fields, persist, and protect role/dept")
        void testAdvisorProfileUpdate() throws Exception {
            UserProfile advisor = userService.findStaff("arularasi");
            assertNotNull(advisor, "Advisor profile must exist in baseline staff roster");
            assertEquals("arularasi", advisor.getIdentifier());
            assertEquals(UserRole.ADVISOR, advisor.getRole());
            assertEquals("CSE", advisor.getDepartment());

            // Edit permitted fields
            UserProfile updated = userService.updateProfile(advisor, "Mrs. P. Arularasi M.E.", "+91 9842100001", "Senior Asst Professor & Class Advisor CSE-A");
            assertNotNull(updated);
            assertEquals("Mrs. P. Arularasi M.E.", updated.getName());
            assertEquals("+91 9842100001", updated.getContact());
            assertEquals("Senior Asst Professor & Class Advisor CSE-A", updated.getBio());

            // Verify immutable fields are protected
            assertEquals("arularasi", updated.getIdentifier());
            assertEquals(UserRole.ADVISOR, updated.getRole());
            assertEquals("CSE", updated.getDepartment());

            // Persistence check
            UserProfile reloaded = userService.findStaff("arularasi");
            assertEquals("Mrs. P. Arularasi M.E.", reloaded.getName());
        }

        @Test
        @DisplayName("3. HOD Profile: Load, edit permitted fields, persist, and protect role/dept")
        void testHodProfileUpdate() throws Exception {
            UserProfile hod = userService.findStaff("gopinath");
            assertNotNull(hod, "HOD profile must exist in baseline roster");
            assertEquals("gopinath", hod.getIdentifier());
            assertEquals(UserRole.HOD, hod.getRole());
            assertEquals("CSE", hod.getDepartment());

            // Edit permitted fields
            UserProfile updated = userService.updateProfile(hod, "Dr. K. Gopinath Ph.D.", "+91 9842100002", "Head of Department, Computer Science & Engineering");
            assertNotNull(updated);
            assertEquals("Dr. K. Gopinath Ph.D.", updated.getName());
            assertEquals("+91 9842100002", updated.getContact());
            assertEquals("Head of Department, Computer Science & Engineering", updated.getBio());

            // Immutable field check
            assertEquals(UserRole.HOD, updated.getRole());
            assertEquals("CSE", updated.getDepartment());

            // Persistence check
            UserProfile reloaded = userService.findStaff("gopinath");
            assertEquals("Dr. K. Gopinath Ph.D.", reloaded.getName());
        }

        @Test
        @DisplayName("4. Principal Profile: Load, edit permitted fields, persist, and protect role")
        void testPrincipalProfileUpdate() throws Exception {
            UserProfile principal = userService.findStaff("bsanjaygandhi");
            assertNotNull(principal, "Principal profile must exist in baseline roster");
            assertEquals("bsanjaygandhi", principal.getIdentifier());
            assertEquals(UserRole.PRINCIPAL, principal.getRole());

            // Edit permitted fields
            UserProfile updated = userService.updateProfile(principal, "Dr. B. Sanjay Gandhi M.E. Ph.D.", "+91 9842100003", "Principal — Gnanamani College of Technology");
            assertNotNull(updated);
            assertEquals("Dr. B. Sanjay Gandhi M.E. Ph.D.", updated.getName());
            assertEquals("+91 9842100003", updated.getContact());
            assertEquals("Principal — Gnanamani College of Technology", updated.getBio());

            // Immutable field check
            assertEquals(UserRole.PRINCIPAL, updated.getRole());

            // Persistence check
            UserProfile reloaded = userService.findStaff("bsanjaygandhi");
            assertEquals("Dr. B. Sanjay Gandhi M.E. Ph.D.", reloaded.getName());
        }

        @Test
        @DisplayName("4b. Regular Staff Profile: Load, edit permitted fields, persist, and protect role")
        void testStaffProfileUpdate() throws Exception {
            UserProfile staff = userService.findStaff("kavitha");
            assertNotNull(staff, "Staff profile must exist in baseline roster");
            assertEquals("kavitha", staff.getIdentifier());
            assertEquals(UserRole.STAFF, staff.getRole());
            assertEquals("CSE", staff.getDepartment());

            // Edit permitted fields: name, contact, bio, email
            UserProfile updated = userService.updateProfile(staff, "Dr. M. Kavitha Ph.D.", "+91 9842199999", "Assistant Professor, CSE Department", "kavitha.updated@epoch.edu", null, null);
            assertNotNull(updated);
            assertEquals("Dr. M. Kavitha Ph.D.", updated.getName());
            assertEquals("+91 9842199999", updated.getContact());
            assertEquals("Assistant Professor, CSE Department", updated.getBio());
            assertEquals("kavitha.updated@epoch.edu", updated.getEmail());

            // Immutable field check
            assertEquals(UserRole.STAFF, updated.getRole());
            assertEquals("CSE", updated.getDepartment());

            // Persistence check
            UserProfile reloaded = userService.findStaff("kavitha");
            assertEquals("Dr. M. Kavitha Ph.D.", reloaded.getName());
            assertEquals("kavitha.updated@epoch.edu", reloaded.getEmail());
        }

        @Test
        @DisplayName("4c. Role-Aware Academic Year Isolation: Student has academicYear, Staff/Advisor/HOD/Principal do not")
        void testAcademicYearIsolationAcrossRoles() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            assertNotNull(student.getAcademicYear(), "Student must possess institutional academic year");
            assertEquals("IV Year B.E.", student.getAcademicYear());

            UserProfile advisor = userService.findStaff("arularasi");
            assertNull(advisor.getAcademicYear(), "Class Advisor must NOT possess student academic year");

            UserProfile staff = userService.findStaff("kavitha");
            assertNull(staff.getAcademicYear(), "Staff must NOT possess student academic year");

            UserProfile hod = userService.findStaff("gopinath");
            assertNull(hod.getAcademicYear(), "HOD must NOT possess student academic year");

            UserProfile principal = userService.findStaff("bsanjaygandhi");
            assertNull(principal.getAcademicYear(), "Principal must NOT possess student academic year");
        }

        @Test
        @DisplayName("5. Profile Photo Upload and Removal for all roles")
        void testProfilePhotoUploadAndRemoval() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            String samplePhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

            UserProfile updatedStudent = userService.updateProfilePhoto(student, samplePhoto);
            assertEquals(samplePhoto, updatedStudent.getProfilePhoto());

            UserProfile removedStudent = userService.removeProfilePhoto(student);
            assertNull(removedStudent.getProfilePhoto());
        }

        @Test
        @DisplayName("6. Profile Validation: Name cannot be blank, null user rejected")
        void testProfileValidation() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            assertThrows(IllegalArgumentException.class, () -> userService.updateProfile(student, "", "123", "bio"));
            assertThrows(IllegalArgumentException.class, () -> userService.updateProfile(student, "   ", "123", "bio"));
            assertThrows(IllegalArgumentException.class, () -> userService.updateProfile(null, "Name", "123", "bio"));
        }

        @Test
        @DisplayName("7. Universal Profile API Controller Test across all 5 roles: Student, Staff, Advisor, HOD, Principal")
        void testUniversalControllerProfileEditingForAll5Roles() throws Exception {
            // Role 1: Student
            UserProfile student = userService.findStudent("620823104002");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(student, null, Collections.emptyList()));
            ResponseEntity<?> getStudentResp = userController.getProfile();
            assertEquals(200, getStudentResp.getStatusCode().value());
            assertTrue(getStudentResp.getBody() instanceof UserProfile);
            assertEquals(UserRole.STUDENT, ((UserProfile) getStudentResp.getBody()).getRole());

            ResponseEntity<?> putStudentResp = userController.updateProfile(Map.of(
                    "name", "ABINAYA G (Controller Tested)",
                    "contact", "+91 9999911111",
                    "bio", "Verified Student Profile",
                    "email", "abinaya.verified@epoch.edu"));
            assertEquals(200, putStudentResp.getStatusCode().value());
            UserProfile updatedStudent = (UserProfile) putStudentResp.getBody();
            assertEquals("ABINAYA G (Controller Tested)", updatedStudent.getName());
            assertEquals("abinaya.verified@epoch.edu", updatedStudent.getEmail());
            assertEquals(UserRole.STUDENT, updatedStudent.getRole());

            // Role 2: Staff
            UserProfile staff = userService.findStaff("kavitha");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(staff, null, Collections.emptyList()));
            ResponseEntity<?> getStaffResp = userController.getProfile();
            assertEquals(200, getStaffResp.getStatusCode().value());
            assertEquals(UserRole.STAFF, ((UserProfile) getStaffResp.getBody()).getRole());

            ResponseEntity<?> putStaffResp = userController.updateProfile(Map.of(
                    "name", "Dr. M. Kavitha (Controller Tested)",
                    "contact", "+91 9999922222",
                    "bio", "Verified Staff Profile",
                    "email", "kavitha.verified@epoch.edu"));
            assertEquals(200, putStaffResp.getStatusCode().value());
            UserProfile updatedStaff = (UserProfile) putStaffResp.getBody();
            assertEquals("Dr. M. Kavitha (Controller Tested)", updatedStaff.getName());
            assertEquals("kavitha.verified@epoch.edu", updatedStaff.getEmail());
            assertEquals(UserRole.STAFF, updatedStaff.getRole());

            // Role 3: Class Advisor
            UserProfile advisor = userService.findStaff("arularasi");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(advisor, null, Collections.emptyList()));
            ResponseEntity<?> getAdvResp = userController.getProfile();
            assertEquals(200, getAdvResp.getStatusCode().value());
            assertEquals(UserRole.ADVISOR, ((UserProfile) getAdvResp.getBody()).getRole());

            ResponseEntity<?> putAdvResp = userController.updateProfile(Map.of(
                    "name", "Mrs. P. Arularasi (Controller Tested)",
                    "contact", "+91 9999933333",
                    "bio", "Verified Advisor Profile",
                    "email", "arularasi.verified@epoch.edu"));
            assertEquals(200, putAdvResp.getStatusCode().value());
            UserProfile updatedAdv = (UserProfile) putAdvResp.getBody();
            assertEquals("Mrs. P. Arularasi (Controller Tested)", updatedAdv.getName());
            assertEquals("arularasi.verified@epoch.edu", updatedAdv.getEmail());
            assertEquals(UserRole.ADVISOR, updatedAdv.getRole());

            // Role 4: HOD
            UserProfile hod = userService.findStaff("gopinath");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(hod, null, Collections.emptyList()));
            ResponseEntity<?> getHodResp = userController.getProfile();
            assertEquals(200, getHodResp.getStatusCode().value());
            assertEquals(UserRole.HOD, ((UserProfile) getHodResp.getBody()).getRole());

            ResponseEntity<?> putHodResp = userController.updateProfile(Map.of(
                    "name", "Dr. K. Gopinath (Controller Tested)",
                    "contact", "+91 9999944444",
                    "bio", "Verified HOD Profile",
                    "email", "gopinath.verified@epoch.edu"));
            assertEquals(200, putHodResp.getStatusCode().value());
            UserProfile updatedHod = (UserProfile) putHodResp.getBody();
            assertEquals("Dr. K. Gopinath (Controller Tested)", updatedHod.getName());
            assertEquals("gopinath.verified@epoch.edu", updatedHod.getEmail());
            assertEquals(UserRole.HOD, updatedHod.getRole());

            // Role 5: Principal
            UserProfile principal = userService.findStaff("bsanjaygandhi");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
            ResponseEntity<?> getPrinResp = userController.getProfile();
            assertEquals(200, getPrinResp.getStatusCode().value());
            assertEquals(UserRole.PRINCIPAL, ((UserProfile) getPrinResp.getBody()).getRole());

            ResponseEntity<?> putPrinResp = userController.updateProfile(Map.of(
                    "name", "Dr. B. Sanjay Gandhi (Controller Tested)",
                    "contact", "+91 9999955555",
                    "bio", "Verified Principal Profile",
                    "email", "principal.verified@epoch.edu"));
            assertEquals(200, putPrinResp.getStatusCode().value());
            UserProfile updatedPrin = (UserProfile) putPrinResp.getBody();
            assertEquals("Dr. B. Sanjay Gandhi (Controller Tested)", updatedPrin.getName());
            assertEquals("principal.verified@epoch.edu", updatedPrin.getEmail());
            assertEquals(UserRole.PRINCIPAL, updatedPrin.getRole());

            // Verify persistence after reload for all 5 roles
            assertEquals("ABINAYA G (Controller Tested)", userService.findStudent("620823104002").getName());
            assertEquals("Dr. M. Kavitha (Controller Tested)", userService.findStaff("kavitha").getName());
            assertEquals("Mrs. P. Arularasi (Controller Tested)", userService.findStaff("arularasi").getName());
            assertEquals("Dr. K. Gopinath (Controller Tested)", userService.findStaff("gopinath").getName());
            assertEquals("Dr. B. Sanjay Gandhi (Controller Tested)", userService.findStaff("bsanjaygandhi").getName());

            SecurityContextHolder.clearContext();
        }
    }

    // =========================================================================
    // SECTION B: COMPLETE WORKFLOW AUDIT (ALL CATEGORIES)
    // =========================================================================
    @Nested
    @DisplayName("Section B: Complete Workflow Audit")
    class CompleteWorkflowTests {

        @Test
        @DisplayName("1. Regular OD Workflow: Student -> Class Advisor -> HOD (Final Sanction)")
        void testRegularOdWorkflow() throws Exception {
            UserProfile student = userService.findStudent("620823104002");

            OdRequest payload = new OdRequest();
            payload.setOdType("On-Duty Requisition");
            payload.setEventTitle("Industrial Visit & Research Expo");
            payload.setOrganizer("L&T Infotech");
            payload.setVenue("Chennai Campus");
            payload.setStartDate("2026-04-10");
            payload.setEndDate("2026-04-11");
            payload.setNumberOfDays(2);
            payload.setReason("Technical industrial visit for cloud operations.");

            // Stage 1: Student Submission
            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertNotNull(submitted.getId());
            assertTrue(submitted.getId().startsWith("EPOCH-OD-"));
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());
            assertEquals("ADVISOR", submitted.getCurrentStage());
            assertFalse(submitted.isRequiresPrincipalApproval(), "Regular OD must not require Principal approval");

            // Stage 2: Class Advisor Endorsement
            OdRequest advisorApproved = odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Verified attendance and academic eligibility.");
            assertEquals(OdStatus.PENDING_HOD, advisorApproved.getStatus());
            assertEquals("HOD", advisorApproved.getCurrentStage());
            assertNotNull(advisorApproved.getAdvisorDecision());
            assertEquals("APPROVED", advisorApproved.getAdvisorDecision().get("status"));
            assertNotNull(advisorApproved.getAdvisorDecision().get("signatureBase64"));

            // Stage 3: HOD Final Sanction
            OdRequest hodApproved = odService.hodAction(submitted.getId(), "gopinath", true, "Departmental sanction granted.");
            assertEquals(OdStatus.APPROVED, hodApproved.getStatus());
            assertEquals("COMPLETED", hodApproved.getCurrentStage());
            assertNotNull(hodApproved.getHodDecision());
            assertEquals("APPROVED", hodApproved.getHodDecision().get("status"));
            assertNotNull(hodApproved.getHodDecision().get("signatureBase64"));
            assertNull(hodApproved.getPrincipalDecision(), "Regular OD must not require Principal signature");
        }

        @Test
        @DisplayName("2. Leave Application Workflow: Student -> Class Advisor -> HOD (Final Sanction)")
        void testLeaveWorkflow() throws Exception {
            UserProfile student = userService.findStudent("620823104002");

            OdRequest payload = new OdRequest();
            payload.setOdType("Medical Leave Application");
            payload.setEventTitle("Medical Leave");
            payload.setStartDate("2026-04-15");
            payload.setEndDate("2026-04-16");
            payload.setNumberOfDays(2);
            payload.setReason("Severe viral fever and medical rest.");

            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());
            assertFalse(submitted.isRequiresPrincipalApproval());

            // Advisor approval -> PENDING_HOD
            OdRequest adv = odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Medical certificate verified.");
            assertEquals(OdStatus.PENDING_HOD, adv.getStatus());

            // HOD approval -> APPROVED (Final)
            OdRequest hod = odService.hodAction(submitted.getId(), "gopinath", true, "Leave sanctioned.");
            assertEquals(OdStatus.APPROVED, hod.getStatus());
            assertEquals("COMPLETED", hod.getCurrentStage());
        }

        @Test
        @DisplayName("3. Bonafide Certificate Workflow: Student -> Advisor -> HOD -> Principal (3-Stage Institutional Flow)")
        void testBonafideWorkflow() throws Exception {
            UserProfile student = userService.findStudent("620823104002");

            OdRequest payload = new OdRequest();
            payload.setOdType("Bonafide Certificate");
            payload.setEventTitle("Bonafide Certificate - Passport Application");
            payload.setOrganizer("Gnanamani College of Technology");
            payload.setVenue("Autonomous Campus");
            payload.setStartDate("2026-04-20");
            payload.setEndDate("2026-04-20");
            payload.setNumberOfDays(1);
            payload.setReason("Official Passport Verification");

            // Submission
            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertTrue(submitted.getId().startsWith("EPOCH-BNF-2026-"));
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());
            assertTrue(submitted.isRequiresPrincipalApproval(), "Bonafide Certificate must require Principal approval");

            // Stage 1: Advisor Action
            OdRequest adv = odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Identity and student credentials verified.");
            assertEquals(OdStatus.PENDING_HOD, adv.getStatus());
            assertEquals("HOD", adv.getCurrentStage());

            // Stage 2: HOD Action (Must forward to Principal, NOT complete!)
            OdRequest hod = odService.hodAction(submitted.getId(), "gopinath", true, "Endorsed and forwarded to Principal.");
            assertEquals(OdStatus.PENDING_PRINCIPAL, hod.getStatus(), "HOD approval of Bonafide must transition to PENDING_PRINCIPAL");
            assertEquals("PRINCIPAL", hod.getCurrentStage());

            // Stage 3: Principal Executive Sanction
            OdRequest prin = odService.principalAction(submitted.getId(), "bsanjaygandhi", true, "Institutional sanction granted. Certificate issued.");
            assertEquals(OdStatus.APPROVED, prin.getStatus(), "Principal action must finalize Bonafide Certificate to APPROVED");
            assertEquals("COMPLETED", prin.getCurrentStage());
            assertNotNull(prin.getPrincipalDecision());
            assertEquals("APPROVED", prin.getPrincipalDecision().get("status"));
            assertNotNull(prin.getPrincipalDecision().get("signatureBase64"));
        }

        @Test
        @DisplayName("4. 75% Attendance Undertaking Workflow: Student -> Advisor -> HOD -> Principal (3-Stage Sequence)")
        void testUndertakingWorkflow() throws Exception {
            UserProfile student = userService.findStudent("620823104002");

            OdRequest payload = new OdRequest();
            payload.setOdType("75% Attendance Undertaking");
            payload.setEventTitle("75% Attendance Shortage Undertaking (68.5%)");
            payload.setOrganizer("Gnanamani College of Technology");
            payload.setVenue("Autonomous Campus");
            payload.setStartDate("2026-04-22");
            payload.setEndDate("2026-04-22");
            payload.setNumberOfDays(1);
            payload.setReason("Medical Illness / Hospitalization - Severe Typhoid Fever");
            payload.setSupportingDetails("Parent Phone: +91 9876543210 | Attendance: 68.5%");
            payload.setAttendancePercentage("68.5");
            payload.setUndertakingDeclaration("true");

            // Submission
            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertTrue(submitted.getId().startsWith("EPOCH-UT-2026-"), "Undertaking ID must start with EPOCH-UT-2026-");
            assertTrue(submitted.isUndertaking(), "Must be detected as undertaking");
            assertTrue(submitted.isRequiresPrincipalApproval(), "Undertaking must require Principal approval");
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());
            assertEquals("68.5", submitted.getAttendancePercentage());
            assertEquals("true", submitted.getUndertakingDeclaration());

            // Stage 1: Advisor Action
            OdRequest adv = odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Medical discharge summary verified. Undertaking endorsed.");
            assertEquals(OdStatus.PENDING_HOD, adv.getStatus());
            assertEquals("HOD", adv.getCurrentStage());

            // Stage 2: HOD Action -> Forwards to Principal
            OdRequest hod = odService.hodAction(submitted.getId(), "gopinath", true, "Compensatory academic schedule assigned. Recommended to Principal.");
            assertEquals(OdStatus.PENDING_PRINCIPAL, hod.getStatus());
            assertEquals("PRINCIPAL", hod.getCurrentStage());

            // Stage 3: Principal Executive Sanction
            OdRequest prin = odService.principalAction(submitted.getId(), "bsanjaygandhi", true, "Executive sanction granted subject to 100% compensatory class attendance.");
            assertEquals(OdStatus.APPROVED, prin.getStatus());
            assertEquals("COMPLETED", prin.getCurrentStage());
            assertNotNull(prin.getPrincipalDecision());
            assertEquals("APPROVED", prin.getPrincipalDecision().get("status"));
            assertNotNull(prin.getPrincipalDecision().get("signatureBase64"));

            // Verify all 3 signatures are present
            assertNotNull(prin.getAdvisorDecision().get("signatureBase64"));
            assertNotNull(prin.getHodDecision().get("signatureBase64"));
            assertNotNull(prin.getPrincipalDecision().get("signatureBase64"));
        }
    }

    // =========================================================================
    // SECTION C: ROLE-BASED SECURITY & STAGE-BYPASS AUDIT
    // =========================================================================
    @Nested
    @DisplayName("Section C: Role-Based Security & Stage-Bypass Prevention")
    class RoleSecurityTests {

        @Test
        @DisplayName("1. Prevent stage bypass: HOD cannot act before Class Advisor")
        void testHodCannotBypassAdvisor() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("Symposium");
            payload.setEventTitle("Tech Symposium");
            payload.setOrganizer("PSG Tech");
            payload.setVenue("Coimbatore");
            payload.setStartDate("2026-06-01");
            payload.setEndDate("2026-06-01");
            payload.setReason("Symposium Presentation");

            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());

            // HOD attempts to act before advisor
            assertThrows(IllegalStateException.class, () -> {
                odService.hodAction(submitted.getId(), "gopinath", true, "Unauthorized bypass attempt");
            }, "HOD must not be permitted to act on a request still pending Class Advisor");
        }

        @Test
        @DisplayName("2. Prevent stage bypass: Principal cannot act before HOD endorsement")
        void testPrincipalCannotBypassHod() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("Bonafide Certificate");
            payload.setEventTitle("Bonafide Certificate - Passport");
            payload.setReason("Passport Requisition");

            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            assertEquals(OdStatus.PENDING_ADVISOR, submitted.getStatus());

            // Principal attempts to act while pending advisor
            assertThrows(IllegalStateException.class, () -> {
                odService.principalAction(submitted.getId(), "bsanjaygandhi", true, "Premature approval attempt");
            }, "Principal must not be permitted to act on a request before Advisor and HOD stages");

            // Advisor approves
            odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Advisor approved");

            // Principal attempts to act while pending HOD
            assertThrows(IllegalStateException.class, () -> {
                odService.principalAction(submitted.getId(), "bsanjaygandhi", true, "Premature approval attempt");
            }, "Principal must not be permitted to act on a request before HOD endorsement");
        }

        @Test
        @DisplayName("3. Prevent out-of-scope action: Principal cannot act on regular OD or Leave")
        void testPrincipalCannotActOnRegularOd() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("On-Duty Requisition");
            payload.setEventTitle("Workshop Attendance");
            payload.setOrganizer("IIT Madras");
            payload.setVenue("Chennai");
            payload.setStartDate("2026-06-05");
            payload.setEndDate("2026-06-05");
            payload.setReason("Technical Workshop");

            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", true, "Advisor ok");
            OdRequest finalizedByHod = odService.hodAction(submitted.getId(), "gopinath", true, "HOD Final sanction");
            assertEquals(OdStatus.APPROVED, finalizedByHod.getStatus());

            // Principal attempts to approve an already finalized 2-stage request
            assertThrows(IllegalStateException.class, () -> {
                odService.principalAction(submitted.getId(), "bsanjaygandhi", true, "Redundant sanction");
            }, "Principal must not act on regular OD or Leave finalized at HOD stage");
        }

        @Test
        @DisplayName("4. Rejection halts workflow: Advisor rejection terminates request immediately")
        void testAdvisorRejectionHaltsWorkflow() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("On-Duty Requisition");
            payload.setEventTitle("Unapproved Event");
            payload.setOrganizer("Private Club");
            payload.setVenue("Off-campus");
            payload.setStartDate("2026-06-10");
            payload.setEndDate("2026-06-10");
            payload.setReason("Attending non-accredited off-campus event");

            OdRequest submitted = odService.submitOd(student.getIdentifier(), payload);
            OdRequest rejected = odService.advisorAction(submitted.getId(), "arularasi", "CSE-A", false, "Lack of official invite from organizing college.");

            assertEquals(OdStatus.REJECTED, rejected.getStatus());
            assertEquals("Lack of official invite from organizing college.", rejected.getRejectionReason());
            assertTrue(rejected.getRejectedBy().contains("Advisor"), "Rejection must indicate Advisor role");

            // HOD cannot approve a rejected request
            assertThrows(IllegalStateException.class, () -> {
                odService.hodAction(submitted.getId(), "gopinath", true, "Cannot approve rejected request");
            });
        }
    }

    // =========================================================================
    // SECTION D: PDF GENERATION & DOWNLOAD AUDIT
    // =========================================================================
    @Nested
    @DisplayName("Section D: PDF Generation & Download Audit")
    class PdfGenerationTests {

        @Test
        @DisplayName("1. Generate Approved PDF for Regular OD with Advisor and HOD signatures")
        void testRegularOdPdfGeneration() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("On-Duty Requisition");
            payload.setEventTitle("Cloud Computing Workshop");
            payload.setOrganizer("NIT Trichy");
            payload.setVenue("Tiruchirappalli");
            payload.setStartDate("2026-05-01");
            payload.setEndDate("2026-05-02");
            payload.setNumberOfDays(2);
            payload.setReason("Participating in national level workshop");

            OdRequest req = odService.submitOd(student.getIdentifier(), payload);
            odService.advisorAction(req.getId(), "arularasi", "CSE-A", true, "Advisor approved");
            OdRequest approved = odService.hodAction(req.getId(), "gopinath", true, "HOD approved");

            byte[] pdfBytes = pdfService.generateApprovedPdf(approved);
            assertNotNull(pdfBytes, "Generated PDF must not be null");
            assertTrue(pdfBytes.length > 500, "PDF size must be substantial");

            // Verify PDF header magic bytes "%PDF-"
            String header = new String(pdfBytes, 0, Math.min(10, pdfBytes.length), StandardCharsets.US_ASCII);
            assertTrue(header.startsWith("%PDF-"), "Generated document must be a valid PDF format");
        }

        @Test
        @DisplayName("2. Generate Approved PDF for Bonafide Certificate with 3 signatures")
        void testBonafidePdfGeneration() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("Bonafide Certificate");
            payload.setEventTitle("Bonafide Certificate - Passport Requisition");
            payload.setOrganizer("Gnanamani College of Technology");
            payload.setVenue("Autonomous Campus");
            payload.setStartDate("2026-05-05");
            payload.setEndDate("2026-05-05");
            payload.setNumberOfDays(1);
            payload.setReason("Passport Application Verification");

            OdRequest req = odService.submitOd(student.getIdentifier(), payload);
            odService.advisorAction(req.getId(), "arularasi", "CSE-A", true, "Advisor approved");
            odService.hodAction(req.getId(), "gopinath", true, "HOD endorsed");
            OdRequest approved = odService.principalAction(req.getId(), "bsanjaygandhi", true, "Principal sanctioned");

            byte[] pdfBytes = pdfService.generateApprovedPdf(approved);
            assertNotNull(pdfBytes);
            assertTrue(pdfBytes.length > 1000);
            String header = new String(pdfBytes, 0, 10, StandardCharsets.US_ASCII);
            assertTrue(header.startsWith("%PDF-"));
        }

        @Test
        @DisplayName("3. Generate Approved PDF for 75% Attendance Undertaking with Table & 3 Signatures")
        void testUndertakingPdfGeneration() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("75% Attendance Undertaking");
            payload.setEventTitle("75% Attendance Shortage Undertaking (69.2%)");
            payload.setOrganizer("Gnanamani College of Technology");
            payload.setVenue("Autonomous Campus");
            payload.setStartDate("2026-05-10");
            payload.setEndDate("2026-05-10");
            payload.setNumberOfDays(1);
            payload.setReason("Medical Illness / Hospitalization - Acute Jaundice");
            payload.setSupportingDetails("Parent Phone: +91 9443210987 | Attendance: 69.2%");
            payload.setAttendancePercentage("69.2");
            payload.setUndertakingDeclaration("true");

            OdRequest req = odService.submitOd(student.getIdentifier(), payload);
            odService.advisorAction(req.getId(), "arularasi", "CSE-A", true, "Advisor approved");
            odService.hodAction(req.getId(), "gopinath", true, "HOD endorsed");
            OdRequest approved = odService.principalAction(req.getId(), "bsanjaygandhi", true, "Principal sanctioned");

            byte[] pdfBytes = pdfService.generateApprovedPdf(approved);
            assertNotNull(pdfBytes);
            assertTrue(pdfBytes.length > 1000);
            String header = new String(pdfBytes, 0, 10, StandardCharsets.US_ASCII);
            assertTrue(header.startsWith("%PDF-"));
        }

        @Test
        @DisplayName("4. PDF generation rejected for unapproved requests")
        void testUnapprovedPdfGenerationThrowsException() throws Exception {
            UserProfile student = userService.findStudent("620823104002");
            OdRequest payload = new OdRequest();
            payload.setOdType("On-Duty Requisition");
            payload.setEventTitle("Testing Unapproved PDF");
            payload.setOrganizer("College Tech Forum");
            payload.setVenue("Campus");
            payload.setStartDate("2026-06-15");
            payload.setEndDate("2026-06-15");
            payload.setReason("Testing unapproved PDF");

            OdRequest pending = odService.submitOd(student.getIdentifier(), payload);
            assertEquals(OdStatus.PENDING_ADVISOR, pending.getStatus());

            assertThrows(IllegalStateException.class, () -> {
                pdfService.generateApprovedPdf(pending);
            }, "Cannot generate PDF for request that is not APPROVED");
        }
    }
}
