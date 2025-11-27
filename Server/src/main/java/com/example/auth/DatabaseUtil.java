package com.example.auth;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseUtil {
    // CHANGE THESE TO MATCH THE CLIENT'S MYSQL CREDENTIALS
    private static final String JDBC_URL = "jdbc:mysql://localhost:3306/user_auth_db";
    private static final String DB_NAME = "user_auth_db";
    private static final String JDBC_USER = "root";
    private static final String JDBC_PASSWORD = "Avinash@27";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Failed to load MySQL JDBC driver", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD);
    }

    public static String getDbName() { return DB_NAME; }
    public static String getDbUser() { return JDBC_USER; }
    public static String getDbPassword() { return JDBC_PASSWORD; }
}