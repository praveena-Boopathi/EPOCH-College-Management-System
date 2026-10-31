package com.epoch.epoch_backend.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class FeeAssignment {
    private String id;
    private String studentId;
    private String studentName;
    private String department;
    private String academicYear;
    private String section;
    private String category;
    private String description;
    private double totalAmount;
    private double amountPaid;
    private double balance;
    private String assignmentDate;
    private String dueDate;
    private String installmentPlan;
    private String status = "UNPAID"; // UNPAID, PARTIALLY_PAID, PAID, OVERDUE, PENDING_VERIFICATION
    private String paymentInstructions;
    private String createdBy;
    private long createdAt;
    private long updatedAt;
    private List<Map<String, Object>> auditHistory = new ArrayList<>();

    public FeeAssignment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public double getAmountPaid() { return amountPaid; }
    public void setAmountPaid(double amountPaid) { this.amountPaid = amountPaid; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public String getAssignmentDate() { return assignmentDate; }
    public void setAssignmentDate(String assignmentDate) { this.assignmentDate = assignmentDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getInstallmentPlan() { return installmentPlan; }
    public void setInstallmentPlan(String installmentPlan) { this.installmentPlan = installmentPlan; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentInstructions() { return paymentInstructions; }
    public void setPaymentInstructions(String paymentInstructions) { this.paymentInstructions = paymentInstructions; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public List<Map<String, Object>> getAuditHistory() { return auditHistory; }
    public void setAuditHistory(List<Map<String, Object>> auditHistory) { this.auditHistory = auditHistory; }
}
