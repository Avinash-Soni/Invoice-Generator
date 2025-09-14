package com.example.auth;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class SignUpHandler implements HttpHandler {
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Set CORS headers to allow requests from the React frontend
        HandlerUtils.setCorsHeaders(exchange);

        // Handle OPTIONS preflight request
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1); // 204 No Content
            return;
        }

        String responseBody = "";
        int statusCode = 500; // Default to Internal Server Error

        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            try (InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)) {
                User user = gson.fromJson(reader, User.class);
                // Validate required fields
                if (user.getName() == null || user.getEmail() == null || user.getPassword() == null || user.getMobileNumber() == null) {
                    statusCode = 400; // Bad Request
                    responseBody = "{\"error\": \"All fields (name, email, password, mobileNumber) are required.\"}";
                } else {
                    String sql = "INSERT INTO users (name, email, password, mobile_number) VALUES (?, ?, ?, ?)";

                    try (Connection conn = DatabaseUtil.getConnection();
                         PreparedStatement stmt = conn.prepareStatement(sql)) {

                        stmt.setString(1, user.getName());
                        stmt.setString(2, user.getEmail());
                        // In a real app, you MUST HASH the password before storing it.
                        stmt.setString(3, user.getPassword());
                        stmt.setString(4, user.getMobileNumber());

                        int rowsAffected = stmt.executeUpdate();
                        if (rowsAffected > 0) {
                            statusCode = 201; // Created
                            responseBody = "{\"message\": \"User created successfully!\"}";
                        } else {
                            statusCode = 500;
                            responseBody = "{\"error\": \"Failed to create user.\"}";
                        }
                    }
                }
            } catch (SQLException e) {
                if (e.getErrorCode() == 1062) { // MySQL error for duplicate entry
                    statusCode = 409; // Conflict
                    responseBody = "{\"error\": \"This email is already registered.\"}";
                } else {
                    statusCode = 500;
                    responseBody = "{\"error\": \"Database error: " + e.getMessage() + "\"}";
                }
            } catch (Exception e) {
                statusCode = 400; // Bad Request
                responseBody = "{\"error\": \"Invalid request data: " + e.getMessage() + "\"}";
            }
        } else {
            statusCode = 405; // Method Not Allowed
            responseBody = "{\"error\": \"Only POST method is allowed.\"}";
        }

        // Send the final response
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, responseBody.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBody.getBytes(StandardCharsets.UTF_8));
        }
    }
}