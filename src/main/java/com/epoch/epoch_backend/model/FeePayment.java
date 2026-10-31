package com.epoch.epoch_backend.model;

public class FeePayment {
    private String id;
    private String feeAssignmentId;
    private String studentId;
    private String studentName;
    private String department;
    private String section;
    private String category;
    private double amount;
    private String utrNumber;
    private String screenshotUrl;
    private String status = "PENDING_VERIFICATION"; // PENDING_VERIFICATION, CONFIRMED, REJECTED
    private String paymentDate;
    private long submittedAt;
    private String verifiedBy;
    private String verifiedAt;
    private String rejectionReason;
    private String receiptId;

    public FeePayment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFeeAssignmentId() { return feeAssignmentId; }
    public void setFeeAssignmentId(String feeAssignmentId) { this.feeAssignmentId = feeAssignmentId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getUtrNumber() { return utrNumber; }
    public void setUtrNumber(String utrNumber) { this.utrNumber = utrNumber; }

    public String getScreenshotUrl() { return screenshotUrl; }
    public void setScreenshotUrl(String screenshotUrl) { this.screenshotUrl = screenshotUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentDate() { return paymentDate; }
    public void setPaymentDate(String paymentDate) { this.paymentDate = paymentDate; }

    public long getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(long submittedAt) { this.submittedAt = submittedAt; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(String verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }
}
