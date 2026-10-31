package com.epoch.epoch_backend.model;

public class FeeSettings {
    private String merchantUpiId = "gnanamani.fees@sbi";
    private String merchantName = "Gnanamani College of Technology";
    private String contactEmail = "accounts@gct.ac.in";
    private String contactPhone = "+91 4286 293888";
    private String bankName = "State Bank of India (Namakkal Main Branch)";
    private String accountNumber = "39201948572";
    private String ifscCode = "SBIN0001234";
    private long updatedAt;
    private String updatedBy = "System Admin";

    public FeeSettings() {}

    public String getMerchantUpiId() { return merchantUpiId; }
    public void setMerchantUpiId(String merchantUpiId) { this.merchantUpiId = merchantUpiId; }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
