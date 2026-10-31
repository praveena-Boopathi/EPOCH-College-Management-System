package com.epoch.epoch_backend.model;

public class PaymentOrderRequest {
    private String feeAssignmentId;
    private double amount;
    private String paymentMethod; // UPI, CARD, NETBANKING
    private String notes;

    public PaymentOrderRequest() {}

    public String getFeeAssignmentId() { return feeAssignmentId; }
    public void setFeeAssignmentId(String feeAssignmentId) { this.feeAssignmentId = feeAssignmentId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
