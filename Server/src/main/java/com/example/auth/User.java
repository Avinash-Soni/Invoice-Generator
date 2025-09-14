package com.example.auth;

// This class is a data structure to hold user information for signup and login.
public class User {
    private String name;
    private String email;
    private String password;
    private String mobileNumber;

    // Getters and setters are required for Gson to map JSON fields to the object properties.
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }
}