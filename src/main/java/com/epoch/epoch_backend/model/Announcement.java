package com.epoch.epoch_backend.model;

import java.util.ArrayList;
import java.util.List;

public class Announcement {
    private String id;
    private String title;
    private String message;
    private String priority = "NORMAL"; // NORMAL, IMPORTANT, URGENT
    private String targetAudience = "STUDENT"; // STUDENT, ALL
    private String targetDept = "CSE"; // CSE, ALL
    private String targetSection; // single section or ALL (backward compatible)
    private List<String> targetSections = new ArrayList<>(); // Multi-select sections e.g. ["CSE-A", "CSE-B"]
    private String targetAudienceLabel; // e.g. "CSE-A, CSE-B" or "All Students"
    private String targetStudentId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String senderSection;
    private String senderDisplay;
    private String createdAt;
    private long createdAtMs;
    private String expiresAt;
    private List<String> readBy = new ArrayList<>();

    public Announcement() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public String getTargetDept() { return targetDept; }
    public void setTargetDept(String targetDept) { this.targetDept = targetDept; }

    public String getTargetSection() { return targetSection; }
    public void setTargetSection(String targetSection) { this.targetSection = targetSection; }

    public List<String> getTargetSections() {
        if (targetSections == null || targetSections.isEmpty()) {
            if (targetSection != null && !targetSection.trim().isEmpty()) {
                if (targetSection.contains(",")) {
                    List<String> list = new ArrayList<>();
                    for (String s : targetSection.split(",")) {
                        String clean = s.trim();
                        if (!clean.isEmpty()) list.add(clean);
                    }
                    return list;
                } else {
                    return new ArrayList<>(List.of(targetSection.trim()));
                }
            }
            return new ArrayList<>();
        }
        return targetSections;
    }

    public void setTargetSections(List<String> targetSections) {
        this.targetSections = targetSections != null ? targetSections : new ArrayList<>();
    }

    public String getTargetAudienceLabel() { return targetAudienceLabel; }
    public void setTargetAudienceLabel(String targetAudienceLabel) { this.targetAudienceLabel = targetAudienceLabel; }

    public String getTargetStudentId() { return targetStudentId; }
    public void setTargetStudentId(String targetStudentId) { this.targetStudentId = targetStudentId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getSenderSection() { return senderSection; }
    public void setSenderSection(String senderSection) { this.senderSection = senderSection; }

    public String getSenderDisplay() { return senderDisplay; }
    public void setSenderDisplay(String senderDisplay) { this.senderDisplay = senderDisplay; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public long getCreatedAtMs() { return createdAtMs; }
    public void setCreatedAtMs(long createdAtMs) { this.createdAtMs = createdAtMs; }

    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }

    public List<String> getReadBy() { return readBy; }
    public void setReadBy(List<String> readBy) { this.readBy = readBy; }
}
