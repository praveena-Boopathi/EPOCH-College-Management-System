package com.epoch.epoch_backend.model;

public class PaymentOrderResponse {
    private String orderId;
    private String feeAssignmentId;
    private String studentId;
    private double amount;
    private String currency;
    private String environment; // "TEST_MODE" or "LIVE_MODE"
    private boolean testMode;
    private String provider;
    private String keyId; // Public Key ID only (never secret)
    private String upiVpa;
    private String upiUri;
    private String status;
    private long createdAt;

    public PaymentOrderResponse() {}

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getFeeAssignmentId() { return feeAssignmentId; }
    public void setFeeAssignmentId(String feeAssignmentId) { this.feeAssignmentId = feeAssignmentId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public boolean isTestMode() { return testMode; }
    public void setTestMode(boolean testMode) { this.testMode = testMode; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }

    public String getUpiVpa() { return upiVpa; }
    public void setUpiVpa(String upiVpa) { this.upiVpa = upiVpa; }

    public String getUpiUri() { return upiUri; }
    public void setUpiUri(String upiUri) { this.upiUri = upiUri; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
