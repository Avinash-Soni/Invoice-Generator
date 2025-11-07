package com.example.auth;

// DTO for customer data, including calculated balance
public class Customer {
    private int id;
    private String name;
    private double balance;

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
}