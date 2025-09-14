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
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class LoginHandler implements HttpHandler {
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        HandlerUtils.setCorsHeaders(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String responseBody = "";
        int statusCode = 500;

        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            try (InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)) {
                User loginAttempt = gson.fromJson(reader, User.class);
                String sql = "SELECT id, password FROM users WHERE email = ?";

                try (Connection conn = DatabaseUtil.getConnection();
                     PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, loginAttempt.getEmail());
                    ResultSet rs = stmt.executeQuery();

                    if (rs.next()) {
                        String storedPassword = rs.getString("password");
                        int userId = rs.getInt("id");

                        if (storedPassword.equals(loginAttempt.getPassword())) { // TODO: hash in production
                            // Generate session ID
                            String sessionId = UUID.randomUUID().toString();
                            SessionManager.createSession(sessionId, userId);

                            exchange.getResponseHeaders().add("Set-Cookie",
                                    "SESSIONID=" + sessionId + "; HttpOnly; Path=/; SameSite=Strict");

                            statusCode = 200;
                            responseBody = "{\"message\": \"Login successful!\"}";
                        } else {
                            statusCode = 401;
                            responseBody = "{\"error\": \"Invalid email or password.\"}";
                        }
                    } else {
                        statusCode = 401;
                        responseBody = "{\"error\": \"Invalid email or password.\"}";
                    }
                }
            } catch (SQLException e) {
                statusCode = 500;
                responseBody = "{\"error\": \"Database error: " + e.getMessage() + "\"}";
            }
        } else {
            statusCode = 405;
            responseBody = "{\"error\": \"Only POST method is allowed.\"}";
        }

        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, responseBody.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBody.getBytes(StandardCharsets.UTF_8));
        }
    }
}
