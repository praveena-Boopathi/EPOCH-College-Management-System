package com.epoch.epoch_backend.model;

public class FeeAuditLog {
    private String id;
    private String action; // ASSIGN_FEE, UPDATE_FEE, SUBMIT_PAYMENT, VERIFY_PAYMENT, REJECT_PAYMENT
    private String targetId;
    private String studentId;
    private String actorId;
    private String actorName;
    private String actorRole;
    private String details;
    private long timestamp;
    private String formattedDate;

    public FeeAuditLog() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getFormattedDate() { return formattedDate; }
    public void setFormattedDate(String formattedDate) { this.formattedDate = formattedDate; }
}
