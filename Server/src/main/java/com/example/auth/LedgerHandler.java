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
import java.time.LocalDate; // <-- ADDED IMPORT
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class LedgerHandler implements HttpHandler {
    private final Gson gson = new Gson();

    // --- NEW HELPER METHOD ---
    private String getCurrentFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue(); // 1-12
        // Financial year starts in April (month 4)
        int startYear = (month >= 4) ? year : year - 1;
        int endYearShort = (startYear + 1) % 100; // Get last two digits
        return String.format("%d-%02d", startYear, endYearShort);
    }

    /**
     * Helper method to get financial year dates
     * year format: "2025-26"
     * Returns [ "YYYY-04-01", "YYYY+1-03-31" ]
     */
    private String[] getFinancialYearDates(String year) {
        // --- MODIFIED: Removed "All" check ---
        if (year == null || !year.matches("\\d{4}-\\d{2}")) {
            return null;
        }
        try {
            int startYear = Integer.parseInt(year.substring(0, 4));
            int endYear = startYear + 1;

            String startDate = String.format("%d-04-01", startYear);
            String endDate = String.format("%d-03-31", endYear);

            return new String[] { startDate, endDate };
        } catch (Exception e) {
            return null;
        }
    }

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

        String query = exchange.getRequestURI().getQuery();
        Map<String, String> queryParams = HandlerUtils.parseQueryParams(query);
        // --- MODIFIED: Default to current financial year ---
        String year = queryParams.getOrDefault("year", getCurrentFinancialYear());

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

        // Remove query string from resource if present
        if (resource.contains("?")) {
            resource = resource.substring(0, resource.indexOf("?"));
        }

        try {
            if ("GET".equalsIgnoreCase(method)) {
                String customerName = URLDecoder.decode(resource, StandardCharsets.UTF_8);
                int customerId = getCustomerId(userId, customerName);
                if (customerId == -1) {
                    sendResponse(exchange, 404, "{\"error\": \"Customer not found\"}");
                    return;
                }
                getLedger(exchange, userId, customerId, year);

            } else if ("POST".equalsIgnoreCase(method)) {
                String customerName = URLDecoder.decode(resource, StandardCharsets.UTF_8);
                int customerId = getCustomerId(userId, customerName);
                if (customerId == -1) {
                    sendResponse(exchange, 404, "{\"error\": \"Customer not found\"}");
                    return;
                }
                addLedgerEntry(exchange, userId, customerId);

            } else if ("PUT".equalsIgnoreCase(method)) {
                try {
                    int entryId = Integer.parseInt(resource);
                    updateLedgerEntry(exchange, userId, entryId);
                } catch (NumberFormatException e) {
                    sendResponse(exchange, 400, "{\"error\": \"Invalid entry ID format for PUT\"}");
                }

            } else if ("DELETE".equalsIgnoreCase(method)) {
                try {
                    int entryId = Integer.parseInt(resource);
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

    // --- (getCustomerId method is unchanged) ---
    private int getCustomerId(int userId, String customerName) throws SQLException {
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

    // --- MODIFIED: 'getLedger' now only supports year filter ---
    private void getLedger(HttpExchange exchange, int userId, int customerId, String year) throws IOException, SQLException {
        List<LedgerEntry> entries = new ArrayList<>();

        // --- MODIFIED: Validate year and remove "All" logic ---
        String[] financialYearDates = getFinancialYearDates(year);
        if (financialYearDates == null) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid or missing year format. Expected YYYY-YY.\"}");
            return;
        }

        int sNo = 1;
        String sql;
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DatabaseUtil.getConnection();

            // --- MODIFIED: Removed 'isYearlyFilter' and 'else' block ---
            String startDate = financialYearDates[0];
            String endDate = financialYearDates[1];

            // 1. Get Opening Balance
            String openingSql = "SELECT SUM(debit - credit) AS openingBalance " +
                    "FROM ledger_entries WHERE user_id = ? AND customer_id = ? AND entry_date < ?";

            double openingBalance = 0;
            try (PreparedStatement openStmt = conn.prepareStatement(openingSql)) {
                openStmt.setInt(1, userId);
                openStmt.setInt(2, customerId);
                openStmt.setString(3, startDate);
                ResultSet openRs = openStmt.executeQuery();
                if (openRs.next()) {
                    openingBalance = openRs.getDouble("openingBalance");
                }
            }

            // 2. Create and add Opening Balance row
            LedgerEntry openingEntry = new LedgerEntry();
            openingEntry.setId(0); // Use 0 or a non-db ID
            openingEntry.setsNo(sNo++);
            openingEntry.setBillDate(startDate); // Use start date for sorting
            openingEntry.setParticulars("Opening Balance");
            if (openingBalance > 0) {
                openingEntry.setDr(openingBalance);
                openingEntry.setCr(0);
            } else {
                openingEntry.setDr(0);
                openingEntry.setCr(-openingBalance);
            }
            entries.add(openingEntry);

            // 3. Get entries *within* the financial year
            sql = "SELECT id, entry_date, particulars, debit, credit, invoice_id " +
                    "FROM ledger_entries WHERE user_id = ? AND customer_id = ? " +
                    "AND entry_date >= ? AND entry_date <= ? " +
                    "ORDER BY entry_date, id";

            stmt = conn.prepareStatement(sql);
            stmt.setInt(1, userId);
            stmt.setInt(2, customerId);
            stmt.setString(3, startDate);
            stmt.setString(4, endDate);

            // Execute main query and add entries
            rs = stmt.executeQuery();
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

        } finally {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        }

        sendResponse(exchange, 200, gson.toJson(entries));
    }


    // --- (addLedgerEntry method is unchanged) ---
    private void addLedgerEntry(HttpExchange exchange, int userId, int customerId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        JsonObject body = gson.fromJson(jsonBody, JsonObject.class);
        String date;
        String particulars;
        double debit = 0;
        double credit = 0;
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
        else {
            sendResponse(exchange, 400, "{\"error\": \"Invalid request body. Missing 'method' or 'particulars'.\"}");
            return;
        }
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

    // --- (updateLedgerEntry method is unchanged) ---
    private void updateLedgerEntry(HttpExchange exchange, int userId, int entryId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        JsonObject body = gson.fromJson(jsonBody, JsonObject.class);
        String date;
        String particulars;
        double debit = 0;
        double credit = 0;
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
        else if (body.has("particulars")) {
            date = body.get("date").getAsString();
            particulars = body.get("particulars").getAsString();
            debit = body.has("dr") ? body.get("dr").getAsDouble() : 0;
            credit = body.has("cr") ? body.get("cr").getAsDouble() : 0;
            if (date == null || particulars.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Date and particulars are required\"}");
                return;
            }
            if (debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit == 0 && credit == 0)) {
                sendResponse(exchange, 400, "{\"error\": \"Invalid debit/credit amount\"}");
                return;
            }
        }
        else {
            sendResponse(exchange, 400, "{\"error\": \"Invalid request body. Missing 'method' or 'particulars'.\"}");
            return;
        }
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

    // --- (deleteLedgerEntry method is unchanged) ---
    private void deleteLedgerEntry(HttpExchange exchange, int userId, int entryId) throws IOException, SQLException {
        String sql = "DELETE FROM ledger_entries WHERE id = ? AND user_id = ? AND invoice_id IS NULL";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, entryId);
            stmt.setInt(2, userId);
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                sendResponse(exchange, 200, "{\"message\": \"Entry deleted successfully\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\": \"Entry not found or cannot be deleted\"}");
            }
        }
    }

    // --- (sendResponse method is unchanged) ---
    private void sendResponse(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
    }
}