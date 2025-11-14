package com.example.auth;

// DTO for customer data
public class Customer {
    private int id;
    private String name;
    private double balance; // This is calculated, not stored in DB

    // --- NEW FIELDS ---
    // These fields mirror the 'billTo' object
    private String clientEmail;
    private String streetAddress;
    private String city;
    private String postCode;
    private String country;
    private String gstin;

    // Default constructor for Gson
    public Customer() {}

    public Customer(int id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    // --- GETTERS/SETTERS FOR NEW FIELDS ---
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostCode() { return postCode; }
    public void setPostCode(String postCode) { this.postCode = postCode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
}