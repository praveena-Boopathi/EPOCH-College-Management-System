package com.epoch.epoch_backend.model;

import java.util.List;

public class ChatConversation {
    private String id;
    private String type; // "STUDENT_STAFF" or "STUDENT_STUDENT"
    private List<String> participants;
    private String studentRegNo;
    private String studentName;
    private String studentSection;
    private String studentRole;
    private String staffUsername;
    private String staffName;
    private String staffRole;
    private String staffSection;
    private String lastMessage;
    private String lastMessageTime;
    private String lastMessageSender;
    private String lastMessageSenderId;
    private String lastMessageStatus = "DELIVERED";
    private int unreadCountStudent;
    private int unreadCountStaff;
    private long updatedAt;

    public ChatConversation() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<String> getParticipants() { return participants; }
    public void setParticipants(List<String> participants) { this.participants = participants; }

    public String getStudentRegNo() { return studentRegNo; }
    public void setStudentRegNo(String studentRegNo) { this.studentRegNo = studentRegNo; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentSection() { return studentSection; }
    public void setStudentSection(String studentSection) { this.studentSection = studentSection; }

    public String getStudentRole() { return studentRole; }
    public void setStudentRole(String studentRole) { this.studentRole = studentRole; }

    public String getStaffUsername() { return staffUsername; }
    public void setStaffUsername(String staffUsername) { this.staffUsername = staffUsername; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public String getStaffRole() { return staffRole; }
    public void setStaffRole(String staffRole) { this.staffRole = staffRole; }

    public String getStaffSection() { return staffSection; }
    public void setStaffSection(String staffSection) { this.staffSection = staffSection; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public String getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(String lastMessageTime) { this.lastMessageTime = lastMessageTime; }

    public String getLastMessageSender() { return lastMessageSender; }
    public void setLastMessageSender(String lastMessageSender) { this.lastMessageSender = lastMessageSender; }

    public String getLastMessageSenderId() { return lastMessageSenderId; }
    public void setLastMessageSenderId(String lastMessageSenderId) { this.lastMessageSenderId = lastMessageSenderId; }

    public String getLastMessageStatus() { return lastMessageStatus; }
    public void setLastMessageStatus(String lastMessageStatus) { this.lastMessageStatus = lastMessageStatus; }

    public int getUnreadCountStudent() { return unreadCountStudent; }
    public void setUnreadCountStudent(int unreadCountStudent) { this.unreadCountStudent = unreadCountStudent; }

    public int getUnreadCountStaff() { return unreadCountStaff; }
    public void setUnreadCountStaff(int unreadCountStaff) { this.unreadCountStaff = unreadCountStaff; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    // Aliases for flexible Firestore schema compatibility
    public List<String> getParticipantUids() { return participants; }
    public void setParticipantUids(List<String> participantUids) {
        if (this.participants == null) this.participants = new java.util.ArrayList<>();
        if (participantUids != null) {
            for (String u : participantUids) {
                if (u != null && !this.participants.contains(u)) this.participants.add(u);
            }
        }
    }

    public List<String> getParticipantIds() { return participants; }
    public void setParticipantIds(List<String> participantIds) {
        if (this.participants == null) this.participants = new java.util.ArrayList<>();
        if (participantIds != null) {
            for (String u : participantIds) {
                if (u != null && !this.participants.contains(u)) this.participants.add(u);
            }
        }
    }

    public String getSenderId() { return studentRegNo; }
    public void setSenderId(String senderId) { if (this.studentRegNo == null || this.studentRegNo.isEmpty()) this.studentRegNo = senderId; }

    public String getRecipientId() { return staffUsername; }
    public void setRecipientId(String recipientId) { if (this.staffUsername == null || this.staffUsername.isEmpty()) this.staffUsername = recipientId; }

    public String getSenderName() { return studentName; }
    public void setSenderName(String senderName) { if (this.studentName == null || this.studentName.isEmpty()) this.studentName = senderName; }

    public String getRecipientName() { return staffName; }
    public void setRecipientName(String recipientName) { if (this.staffName == null || this.staffName.isEmpty()) this.staffName = recipientName; }

    public String getSenderRole() { return studentRole; }
    public void setSenderRole(String senderRole) { if (this.studentRole == null || this.studentRole.isEmpty()) this.studentRole = senderRole; }

    public String getRecipientRole() { return staffRole; }
    public void setRecipientRole(String recipientRole) { if (this.staffRole == null || this.staffRole.isEmpty()) this.staffRole = recipientRole; }

    public String getSenderSection() { return studentSection; }
    public void setSenderSection(String senderSection) { if (this.studentSection == null || this.studentSection.isEmpty()) this.studentSection = senderSection; }

    public String getRecipientSection() { return staffSection; }
    public void setRecipientSection(String recipientSection) { if (this.staffSection == null || this.staffSection.isEmpty()) this.staffSection = recipientSection; }
}
