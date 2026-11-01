package com.epoch.epoch_backend.model;

import java.util.Map;
import com.google.cloud.firestore.annotation.IgnoreExtraProperties;

@IgnoreExtraProperties
public class OdRequest {
    private String id;
    private String regNo;
    private String studentName;
    private String dept;
    private String section;
    private String odType;
    private String reason;
    private String startDate;
    private String endDate;
    private int numberOfDays;
    private String supportingDetails;
    private OdStatus status;
    private String currentStage;
    private String rejectionReason;
    private String rejectedBy;
    private String submittedAt;
    private boolean requiresPrincipalApproval;
    private Map<String, Object> advisorDecision;
    private Map<String, Object> hodDecision;
    private Map<String, Object> principalDecision;

    private String eventTitle;
    private String organizer;
    private String venue;
    private String documentName;
    private String documentType;
    private String documentData;
    private long documentSize;

    private String assignedReviewerId;
    private String assignedReviewerName;
    private String assignedReviewerRole;
    private String lastUpdatedAt;
    private java.util.List<Map<String, Object>> workflowTimeline;

    private String studentType = "Day Scholar";
    private String academicYear = "IV Year B.E.";
    private String hostelDetails;
    private String parentContact;
    private String studentUid;

    public OdRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentUid() { return studentUid != null ? studentUid : regNo; }
    public void setStudentUid(String studentUid) { this.studentUid = studentUid; }

    public String getRegNo() { return regNo; }
    public void setRegNo(String regNo) { this.regNo = regNo; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getStudentType() { return studentType != null ? studentType : "Day Scholar"; }
    public void setStudentType(String studentType) { this.studentType = studentType; }

    public String getAcademicYear() { return academicYear != null ? academicYear : "IV Year B.E."; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getHostelDetails() { return hostelDetails; }
    public void setHostelDetails(String hostelDetails) { this.hostelDetails = hostelDetails; }

    public String getParentContact() { return parentContact; }
    public void setParentContact(String parentContact) { this.parentContact = parentContact; }

    public String getOdType() { return odType; }
    public void setOdType(String odType) { this.odType = odType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public int getNumberOfDays() { return numberOfDays; }
    public void setNumberOfDays(int numberOfDays) { this.numberOfDays = numberOfDays; }

    public String getSupportingDetails() { return supportingDetails; }
    public void setSupportingDetails(String supportingDetails) { this.supportingDetails = supportingDetails; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getDocumentData() { return documentData; }
    public void setDocumentData(String documentData) { this.documentData = documentData; }

    public long getDocumentSize() { return documentSize; }
    public void setDocumentSize(long documentSize) { this.documentSize = documentSize; }

    public OdStatus getStatus() { return status; }
    public void setStatus(OdStatus status) { this.status = status; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public boolean isRequiresPrincipalApproval() { return requiresPrincipalApproval; }
    public void setRequiresPrincipalApproval(boolean requiresPrincipalApproval) { this.requiresPrincipalApproval = requiresPrincipalApproval; }

    public Map<String, Object> getAdvisorDecision() { return advisorDecision; }
    public void setAdvisorDecision(Map<String, Object> advisorDecision) { this.advisorDecision = advisorDecision; }

    public Map<String, Object> getHodDecision() { return hodDecision; }
    public void setHodDecision(Map<String, Object> hodDecision) { this.hodDecision = hodDecision; }

    public Map<String, Object> getPrincipalDecision() { return principalDecision; }
    public void setPrincipalDecision(Map<String, Object> principalDecision) { this.principalDecision = principalDecision; }

    public String getAssignedReviewerId() { return assignedReviewerId; }
    public void setAssignedReviewerId(String assignedReviewerId) { this.assignedReviewerId = assignedReviewerId; }

    public String getAssignedReviewerName() { return assignedReviewerName; }
    public void setAssignedReviewerName(String assignedReviewerName) { this.assignedReviewerName = assignedReviewerName; }

    public String getAssignedReviewerRole() { return assignedReviewerRole; }
    public void setAssignedReviewerRole(String assignedReviewerRole) { this.assignedReviewerRole = assignedReviewerRole; }

    public String getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(String lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

    public java.util.List<Map<String, Object>> getWorkflowTimeline() { return workflowTimeline; }
    public void setWorkflowTimeline(java.util.List<Map<String, Object>> workflowTimeline) { this.workflowTimeline = workflowTimeline; }

    @com.google.cloud.firestore.annotation.Exclude
    public boolean isBonafide() {
        String type = (odType != null ? odType : "").toLowerCase();
        String idStr = (id != null ? id : "").toUpperCase();
        String title = (eventTitle != null ? eventTitle : "").toLowerCase();
        String rsn = (reason != null ? reason : "").toLowerCase();
        return type.contains("bonafide") || idStr.contains("BNF") || title.contains("bonafide") || rsn.contains("bonafide");
    }
    public void setBonafide(boolean bonafide) {}

    @com.google.cloud.firestore.annotation.Exclude
    public boolean isLeave() {
        String type = (odType != null ? odType : "").toLowerCase();
        String idStr = (id != null ? id : "").toUpperCase();
        String title = (eventTitle != null ? eventTitle : "").toLowerCase();
        return type.contains("leave") || idStr.contains("-LV-") || title.contains("leave") || type.contains("day scholar") || type.contains("hosteller");
    }
    public void setLeave(boolean leave) {}
}