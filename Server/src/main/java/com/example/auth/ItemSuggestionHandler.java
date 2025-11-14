package com.example.auth;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ItemSuggestionHandler implements HttpHandler {
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        HandlerUtils.setCorsHeaders(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        Integer userId = SessionManager.getUserId(HandlerUtils.getSessionIdFromCookie(exchange));
        if (userId == null) {
            sendResponse(exchange, 401, "{\"error\": \"Unauthorized\"}");
            return;
        }

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            return;
        }

        try {
            Set<String> itemNames = new HashSet<>();
            String sql = "SELECT items FROM invoices WHERE user_id = ?";

            try (Connection conn = DatabaseUtil.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setInt(1, userId);
                ResultSet rs = stmt.executeQuery();

                while (rs.next()) {
                    String itemsJson = rs.getString("items");
                    if (itemsJson == null || itemsJson.isEmpty()) {
                        continue;
                    }

                    // Use JsonParser to avoid needing the Invoice.Item class
                    try {
                        JsonArray itemsArray = JsonParser.parseString(itemsJson).getAsJsonArray();
                        for (JsonElement itemEl : itemsArray) {
                            JsonObject itemObj = itemEl.getAsJsonObject();
                            if (itemObj.has("name") && !itemObj.get("name").isJsonNull()) {
                                String name = itemObj.get("name").getAsString();
                                if (name != null && !name.trim().isEmpty()) {
                                    itemNames.add(name.trim());
                                }
                            }
                        }
                    } catch (JsonSyntaxException | IllegalStateException e) {
                        // Log this error, but don't crash the request
                        System.err.println("Failed to parse items JSON: " + itemsJson + " - " + e.getMessage());
                    }
                }
            }

            String response = gson.toJson(itemNames);
            sendResponse(exchange, 200, response);

        } catch (SQLException e) {
            sendResponse(exchange, 500, "{\"error\": \"Database error: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
        }
    }

    private void sendResponse(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
    }
}