package com.epoch.epoch_backend.model;

public class ChatMessageRequest {
    private String id;
    private String senderId;
    private String senderName;
    private String senderDept;
    private String senderSection;
    private String senderAcademicYear;
    private String senderRole = "STUDENT";
    private String recipientId;
    private String recipientName;
    private String recipientDept;
    private String recipientSection;
    private String recipientAcademicYear;
    private String recipientRole;
    private String requestType = "STUDENT_STUDENT"; // "STUDENT_STUDENT" or "STUDENT_STAFF"
    private String introMessage;
    private String status; // "PENDING", "ACCEPTED", "DECLINED"
    private String conversationId;
    private String timestamp;
    private long createdAt;
    private long respondedAt;

    public ChatMessageRequest() {}

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderDept() { return senderDept; }
    public void setSenderDept(String senderDept) { this.senderDept = senderDept; }
    public String getSenderDepartment() { return senderDept; }
    public void setSenderDepartment(String senderDepartment) { this.senderDept = senderDepartment; }

    public String getSenderSection() { return senderSection; }
    public void setSenderSection(String senderSection) { this.senderSection = senderSection; }

    public String getSenderAcademicYear() { return senderAcademicYear; }
    public void setSenderAcademicYear(String senderAcademicYear) { this.senderAcademicYear = senderAcademicYear; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientDept() { return recipientDept; }
    public void setRecipientDept(String recipientDept) { this.recipientDept = recipientDept; }
    public String getRecipientDepartment() { return recipientDept; }
    public void setRecipientDepartment(String recipientDepartment) { this.recipientDept = recipientDepartment; }

    public String getRecipientSection() { return recipientSection; }
    public void setRecipientSection(String recipientSection) { this.recipientSection = recipientSection; }

    public String getRecipientAcademicYear() { return recipientAcademicYear; }
    public void setRecipientAcademicYear(String recipientAcademicYear) { this.recipientAcademicYear = recipientAcademicYear; }

    public String getIntroMessage() { return introMessage; }
    public void setIntroMessage(String introMessage) { this.introMessage = introMessage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getRespondedAt() { return respondedAt; }
    public void setRespondedAt(long respondedAt) { this.respondedAt = respondedAt; }
}
