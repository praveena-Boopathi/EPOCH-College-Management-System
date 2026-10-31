package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.AuthRequest;
import com.epoch.epoch_backend.model.AuthResponse;
import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import com.epoch.epoch_backend.security.JwtTokenProvider;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    private final Firestore db;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(Firestore db, UserService userService, JwtTokenProvider tokenProvider, PasswordEncoder passwordEncoder) {
        this.db = db;
        this.userService = userService;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse authenticate(AuthRequest request) throws ExecutionException, InterruptedException {
        String username = request.getUsername().trim();
        String password = request.getPassword();

        // 1. Try finding Student or Staff
        UserProfile profile = userService.findStudent(username);
        if (profile == null) {
            profile = userService.findStaff(username);
        }
        DocumentReference docRef = null;
        DocumentSnapshot docSnap = null;

        if (profile != null) {
            try {
                if (profile.getRole() == UserRole.STUDENT) {
                    docRef = db.collection("students").document(profile.getIdentifier());
                } else {
                    docRef = db.collection("staff").document(profile.getIdentifier());
                }
                docSnap = docRef.get().get();
            } catch (Exception ex) {
                // Firestore read limit or offline; docSnap remains null
            }
        }

        if (profile == null) {
            throw new BadCredentialsException("Invalid registration number or username.");
        }

        // Verify password
        String storedHash = docSnap != null && docSnap.exists() ? docSnap.getString("passwordHash") : null;
        boolean passwordValid = false;

        if (storedHash != null && !storedHash.isEmpty()) {
            passwordValid = passwordEncoder.matches(password, storedHash);
        } else {
            // Initial account verification matching authorized institutional initial credentials
            if (profile.getRole() == UserRole.STUDENT && "student@12".equals(password)) {
                passwordValid = true;
            } else if (profile.getRole() == UserRole.ADVISOR && "advisor@123".equals(password)) {
                passwordValid = true;
            } else if (profile.getRole() == UserRole.HOD && "hod@123".equals(password)) {
                passwordValid = true;
            } else if (profile.getRole() == UserRole.PRINCIPAL && "principal@123".equals(password)) {
                passwordValid = true;
            } else if (profile.getRole() == UserRole.ADMIN && "admin@123".equals(password)) {
                passwordValid = true;
            }

            if (passwordValid && docRef != null) {
                try {
                    docRef.update("passwordHash", passwordEncoder.encode(password));
                } catch (Exception ignored) {
                }
            }
        }

        if (!passwordValid) {
            throw new BadCredentialsException("Invalid password.");
        }

        // Generate authoritative JWT token
        String token = tokenProvider.generateToken(profile);

        // Compute redirect URL based on verified role
        String redirectUrl = switch (profile.getRole()) {
            case STUDENT -> "/#student-portal";
            case ADVISOR -> "/#advisor-portal";
            case HOD -> "/#hod-portal";
            case PRINCIPAL -> "/#principal-portal";
            case ADMIN -> "/#admin-portal";
        };

        AuthResponse resp = new AuthResponse(
                token,
                profile.getRole().name(),
                profile.getSection(),
                profile.getName(),
                profile.getEmail(),
                profile.getIdentifier(),
                profile.getDepartment(),
                redirectUrl
        );
        resp.setProfilePhoto(profile.getProfilePhoto());
        return resp;
    }
}