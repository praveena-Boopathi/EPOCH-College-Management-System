package com.epoch.epoch_backend.model;

public class UserProfile {
    private String id;
    private String identifier;
    private String name;
    private String email;
    private UserRole role;
    private String section;
    private String contact;
    private String department;
    private String academicYear;
    private String year;
    private String studentType;
    private String bio;
    private String profilePhoto;
    private String address;
    private String emergencyContact;
    private String title;
    private String advisor;

    public UserProfile() {}

    public UserProfile(String id, String identifier, String name, String email, UserRole role, String section, String contact, String department) {
        this.id = id;
        this.identifier = identifier;
        this.name = name;
        this.email = email;
        this.role = role;
        this.section = section;
        this.contact = contact;
        this.department = department;
        if (role == UserRole.STUDENT) {
            this.academicYear = "IV Year B.E.";
            this.year = "IV Year";
            this.studentType = "Day Scholar";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public String getRegNo() { return identifier; }
    public void setRegNo(String regNo) { if (this.identifier == null || this.identifier.isEmpty()) this.identifier = regNo; }
    public String getUsername() { return identifier; }
    public void setUsername(String username) { if (this.identifier == null || this.identifier.isEmpty()) this.identifier = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getContactPhone() { return contact; }
    public void setContactPhone(String contactPhone) { this.contact = contactPhone; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
        if (academicYear != null && (this.year == null || this.year.isEmpty())) {
            this.year = academicYear.contains(" ") ? academicYear.substring(0, academicYear.indexOf(" ")) + " Year" : academicYear;
        }
    }

    public String getYear() { return year != null ? year : academicYear; }
    public void setYear(String year) { this.year = year; }

    public String getStudentType() { return studentType != null ? studentType : "Day Scholar"; }
    public void setStudentType(String studentType) { this.studentType = studentType; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
    public String getPhotoUrl() { return profilePhoto; }
    public void setPhotoUrl(String photoUrl) { this.profilePhoto = photoUrl; }
    public String getAvatarUrl() { return profilePhoto; }
    public void setAvatarUrl(String avatarUrl) { this.profilePhoto = avatarUrl; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAdvisor() { return advisor; }
    public void setAdvisor(String advisor) { this.advisor = advisor; }
}