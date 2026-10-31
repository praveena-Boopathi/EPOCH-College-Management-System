package com.epoch.epoch_backend.model;

public class StudentComplaint {
    private String id;
    private String regNo;
    private String studentName;
    private String section;
    private String department;
    private String year;
    private String studentType; // "Day Scholar" or "Hosteller"
    private String subject;
    private String category;
    private String description;
    private String supportingInfo;
    private ComplaintStatus status;
    private String submittedAt;
    private String principalResponse;
    private String respondedAt;

    public StudentComplaint() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRegNo() { return regNo; }
    public void setRegNo(String regNo) { this.regNo = regNo; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getStudentType() { return studentType != null ? studentType : "Day Scholar"; }
    public void setStudentType(String studentType) { this.studentType = studentType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSupportingInfo() { return supportingInfo; }
    public void setSupportingInfo(String supportingInfo) { this.supportingInfo = supportingInfo; }
    public String getSupportingDetails() { return supportingInfo; }
    public void setSupportingDetails(String supportingDetails) { this.supportingInfo = supportingDetails; }

    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getPrincipalResponse() { return principalResponse; }
    public void setPrincipalResponse(String principalResponse) { this.principalResponse = principalResponse; }

    public String getRespondedAt() { return respondedAt; }
    public void setRespondedAt(String respondedAt) { this.respondedAt = respondedAt; }
}