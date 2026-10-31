package com.epoch.epoch_backend.model;

public class StaffSignature {
    private String username;
    private String signerName;
    private String role;
    private String signatureBase64;
    private String uploadedAt;

    public StaffSignature() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getSignerName() { return signerName; }
    public void setSignerName(String signerName) { this.signerName = signerName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }

    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }
}