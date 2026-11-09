package com.epoch.epoch_backend.model;

public class AuthResponse {
    private String token;
    private String role;
    private String section;
    private String name;
    private String email;
    private String identifier;
    private String department;
    private String academicYear;
    private String title;
    private String bio;
    private String contact;
    private String redirectUrl;
    private String profilePhoto;

    public AuthResponse() {}

    public AuthResponse(String token, String role, String section, String name, String email, String identifier, String department, String redirectUrl) {
        this.token = token;
        this.role = role;
        this.section = section;
        this.name = name;
        this.email = email;
        this.identifier = identifier;
        this.department = department;
        this.academicYear = null;
        this.redirectUrl = redirectUrl;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
    public String getPhotoUrl() { return profilePhoto; }
    public void setPhotoUrl(String photoUrl) { this.profilePhoto = photoUrl; }
}
