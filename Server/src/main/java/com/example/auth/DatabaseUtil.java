package com.example.auth;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseUtil {
    // --- IMPORTANT: CONFIGURE YOUR DATABASE DETAILS HERE ---
    private static final String JDBC_URL = "jdbc:mysql://localhost:3306/user_auth_db";
    private static final String JDBC_USER = "root"; // <-- CHANGE THIS TO YOUR MYSQL USERNAME
    private static final String JDBC_PASSWORD = "hrishabh"; // <-- CHANGE THIS TO YOUR MYSQL PASSWORD

    // Load the MySQL JDBC driver once when the class is loaded.
    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load MySQL JDBC driver", e);
        }
    }

    /**
     * Establishes and returns a connection to the database.
     * @return A database connection object.
     * @throws SQLException if a database access error occurs.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD);
    }
}