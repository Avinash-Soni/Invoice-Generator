package com.example.auth;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class LedgerHandler implements HttpHandler {
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

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        String resource;

        if (path.startsWith("/ledger/")) {
            resource = path.substring("/ledger/".length());
        } else {
            resource = path;
        }

        if (resource.isEmpty() || resource.equals("/")) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid path. Customer name or Entry ID is required.\"}");
            return;
        }

        try {
            if ("GET".equalsIgnoreCase(method)) {
                // GET /ledger/[customerName]
                String customerName = URLDecoder.decode(resource, StandardCharsets.UTF_8);
                int customerId = getCustomerId(userId, customerName);
                if (customerId == -1) {
                    sendResponse(exchange, 404, "{\"error\": \"Customer not found\"}");
                    return;
                }
                getLedger(exchange, userId, customerId);

            } else if ("POST".equalsIgnoreCase(method)) {
                // POST /ledger/[customerName]
                String customerName = URLDecoder.decode(resource, StandardCharsets.UTF_8);
                int customerId = getCustomerId(userId, customerName);
                if (customerId == -1) {
                    sendResponse(exchange, 404, "{\"error\": \"Customer not found\"}");
                    return;
                }
                addLedgerEntry(exchange, userId, customerId);

            } else if ("PUT".equalsIgnoreCase(method)) {
                // PUT /ledger/[entryId]
                try {
                    int entryId = Integer.parseInt(resource);
                    // --- MODIFIED: Call new universal update method ---
                    updateLedgerEntry(exchange, userId, entryId);
                } catch (NumberFormatException e) {
                    sendResponse(exchange, 400, "{\"error\": \"Invalid entry ID format for PUT\"}");
                }

            } else if ("DELETE".equalsIgnoreCase(method)) {
                // DELETE /ledger/[entryId]
                try {
                    int entryId = Integer.parseInt(resource);
                    // --- MODIFIED: Call new universal delete method ---
                    deleteLedgerEntry(exchange, userId, entryId);
                } catch (NumberFormatException e) {
                    sendResponse(exchange, 400, "{\"error\": \"Invalid entry ID format for DELETE\"}");
                }

            } else {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            }
        } catch (NumberFormatException e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid entry ID format\"}");
        } catch (JsonSyntaxException e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid JSON data: " + e.getMessage() + "\"}");
        } catch (SQLException e) {
            sendResponse(exchange, 500, "{\"error\": \"Database error: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
        }
    }

    private int getCustomerId(int userId, String customerName) throws SQLException {
        // ... (This method is unchanged) ...
        String sql = "SELECT id FROM customers WHERE user_id = ? AND name = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.setString(2, customerName);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return rs.getInt("id");
            }
            return -1; // Not found
        }
    }

    private void getLedger(HttpExchange exchange, int userId, int customerId) throws IOException, SQLException {
        // ... (This method is unchanged) ...
        List<LedgerEntry> entries = new ArrayList<>();
        String sql = "SELECT id, entry_date, particulars, debit, credit, invoice_id " +
                "FROM ledger_entries WHERE user_id = ? AND customer_id = ? " +
                "ORDER BY entry_date, id";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.setInt(2, customerId);
            ResultSet rs = stmt.executeQuery();
            int sNo = 1;
            while (rs.next()) {
                LedgerEntry entry = new LedgerEntry();
                entry.setId(rs.getInt("id"));
                entry.setsNo(sNo++);
                entry.setBillDate(rs.getString("entry_date"));
                entry.setParticulars(rs.getString("particulars"));
                entry.setDr(rs.getDouble("debit"));
                entry.setCr(rs.getDouble("credit"));
                entries.add(entry);
            }
        }
        sendResponse(exchange, 200, gson.toJson(entries));
    }

    private void addLedgerEntry(HttpExchange exchange, int userId, int customerId) throws IOException, SQLException {
        // ... (This method is unchanged from last time) ...
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        JsonObject body = gson.fromJson(jsonBody, JsonObject.class);

        String date;
        String particulars;
        double debit = 0;
        double credit = 0;

        // Check if this is a "Payment"
        if (body.has("method")) {
            date = body.get("date").getAsString();
            double amount = body.get("amount").getAsDouble();
            String method = body.get("method").getAsString();

            if (date == null || amount <= 0) {
                sendResponse(exchange, 400, "{\"error\": \"Invalid date or amount for payment\"}");
                return;
            }

            particulars = "PAYMENT RECEIVED " + (method != null ? method.toUpperCase() : "CASH");
            credit = amount;

        }
        // Check if this is a "General Entry"
        else if (body.has("particulars")) {
            date = body.get("date").getAsString();
            particulars = body.get("particulars").getAsString();
            debit = body.has("dr") ? body.get("dr").getAsDouble() : 0;
            credit = body.has("cr") ? body.get("cr").getAsDouble() : 0;

            if (date == null || particulars.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Date and particulars are required\"}");
                return;
            }
            if (debit < 0 || credit < 0) {
                sendResponse(exchange, 400, "{\"error\": \"Amounts cannot be negative\"}");
                return;
            }
            if (debit > 0 && credit > 0) {
                sendResponse(exchange, 400, "{\"error\": \"Entry cannot be both debit and credit\"}");
                return;
            }
            if (debit == 0 && credit == 0) {
                sendResponse(exchange, 400, "{\"error\": \"Amount cannot be zero\"}");
                return;
            }
        }
        // Invalid request body
        else {
            sendResponse(exchange, 400, "{\"error\": \"Invalid request body. Missing 'method' or 'particulars'.\"}");
            return;
        }

        // --- Common Insert Logic ---
        String sql = "INSERT INTO ledger_entries (user_id, customer_id, entry_date, particulars, debit, credit) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.setInt(2, customerId);
            stmt.setString(3, date);
            stmt.setString(4, particulars);
            stmt.setDouble(5, debit);
            stmt.setDouble(6, credit);
            stmt.executeUpdate();
        }
        sendResponse(exchange, 201, "{\"message\": \"Ledger entry added successfully\"}");
    }

    /**
     * --- UPDATED METHOD ---
     * Updates any manual ledger entry (payment or general).
     * It blocks updates to invoice-linked entries.
     */
    private void updateLedgerEntry(HttpExchange exchange, int userId, int entryId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        JsonObject body = gson.fromJson(jsonBody, JsonObject.class);

        String date;
        String particulars;
        double debit = 0;
        double credit = 0;

        // Check if this is a "Payment" Update
        if (body.has("method")) {
            date = body.get("date").getAsString();
            double amount = body.get("amount").getAsDouble();
            String method = body.get("method").getAsString();

            if (date == null || amount <= 0) {
                sendResponse(exchange, 400, "{\"error\": \"Invalid date or amount\"}");
                return;
            }

            particulars = "PAYMENT RECEIVED " + (method != null ? method.toUpperCase() : "CASH");
            credit = amount;
        }
        // Check if this is a "General Entry" Update
        else if (body.has("particulars")) {
            date = body.get("date").getAsString();
            particulars = body.get("particulars").getAsString();
            debit = body.has("dr") ? body.get("dr").getAsDouble() : 0;
            credit = body.has("cr") ? body.get("cr").getAsDouble() : 0;

            if (date == null || particulars.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Date and particulars are required\"}");
                return;
            }
            // ... (other validations from POST) ...
            if (debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit == 0 && credit == 0)) {
                sendResponse(exchange, 400, "{\"error\": \"Invalid debit/credit amount\"}");
                return;
            }
        }
        // Invalid request body
        else {
            sendResponse(exchange, 400, "{\"error\": \"Invalid request body. Missing 'method' or 'particulars'.\"}");
            return;
        }

        // --- Common Update Logic ---
        // This is the most important part: "AND invoice_id IS NULL"
        // This prevents this endpoint from *ever* touching an invoice-generated entry.
        String sql = "UPDATE ledger_entries SET entry_date = ?, particulars = ?, debit = ?, credit = ? " +
                "WHERE id = ? AND user_id = ? AND invoice_id IS NULL";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, date);
            stmt.setString(2, particulars);
            stmt.setDouble(3, debit);
            stmt.setDouble(4, credit);
            stmt.setInt(5, entryId);
            stmt.setInt(6, userId);

            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                sendResponse(exchange, 200, "{\"message\": \"Entry updated successfully\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\": \"Entry not found or cannot be modified\"}");
            }
        }
    }

    /**
     * --- UPDATED METHOD ---
     * Deletes any manual ledger entry.
     * It blocks deletion of invoice-linked entries.
     */
    private void deleteLedgerEntry(HttpExchange exchange, int userId, int entryId) throws IOException, SQLException {
        // This query safely targets only manual entries (debit or credit)
        // by ensuring they are not tied to an invoice.
        String sql = "DELETE FROM ledger_entries WHERE id = ? AND user_id = ? AND invoice_id IS NULL";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, entryId);
            stmt.setInt(2, userId);

            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                sendResponse(exchange, 200, "{\"message\": \"Entry deleted successfully\"}");
            } else {
                // This will fail if the entry ID doesn't exist OR it's an invoice entry.
                sendResponse(exchange, 404, "{\"error\": \"Entry not found or cannot be deleted\"}");
            }
        }
    }

    private void sendResponse(HttpExchange exchange, int status, String body) throws IOException {
        // ... (This method is unchanged) ...
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
    }
}