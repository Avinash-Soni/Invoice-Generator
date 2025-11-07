package com.example.auth;

// DTO for ledger entry data
public class LedgerEntry {
    private int id;
    private int sNo; // Serial number, will be set in the handler
    private String billDate; // Using String to match frontend "billDate"
    private String particulars;
    private double dr;
    private double cr;
    // The running balance will be calculated on the frontend

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getsNo() { return sNo; }
    public void setsNo(int sNo) { this.sNo = sNo; }
    public String getBillDate() { return billDate; }
    public void setBillDate(String billDate) { this.billDate = billDate; }
    public String getParticulars() { return particulars; }
    public void setParticulars(String particulars) { this.particulars = particulars; }
    public double getDr() { return dr; }
    public void setDr(double dr) { this.dr = dr; }
    public double getCr() { return cr; }
    public void setCr(double cr) { this.cr = cr; }

    // Inner class for the payment request body
    public static class PaymentRequest {
        String date;
        double amount;
        String method;
    }
}