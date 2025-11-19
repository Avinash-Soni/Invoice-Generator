package com.example.auth;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDate;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InvoiceHandler implements HttpHandler {
    private final Gson gson = new Gson();

    static class Invoice {
        String id;
        String clientName;
        double amount;
        String status;
        List<Item> items;
        BillFrom billFrom;
        BillTo billTo;
        String projectDescription;
        String paymentTerms;
        String invoiceDate; // Expects YYYY-MM-DD
        String termsOfPayment;
        String suppliersRef;
        String otherRef;
        double subtotal;
        double gstAmount;
        double total;
        String hsn;
        String gstMode;
        double gstPercent;

        static class Item {
            String name;
            int quantity;
            double rate;
            double total;
            String unit;
        }

        static class BillFrom {
            String name;
            String streetAddress;
            String city;
            String postCode;
            String country;
            String gstin;
            String email;
        }

        static class BillTo {
            String clientEmail;
            String streetAddress;
            String city;
            String postCode;
            String country;
            String gstin;
        }
    }


    @Override
    public void handle(HttpExchange exchange) throws IOException {
        HandlerUtils.setCorsHeaders(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String sessionId = HandlerUtils.getSessionIdFromCookie(exchange);
        Integer userId = sessionId != null ? SessionManager.getUserId(sessionId) : null;

        if (userId == null) {
            sendResponse(exchange, 401, "{\"error\": \"Unauthorized: Please log in.\"}");
            return;
        }

        String responseBody = "";
        int statusCode = 500;

        try {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if ("GET".equalsIgnoreCase(method) && "/invoices".equals(path)) {
                responseBody = getInvoices(userId);
                statusCode = 200;
            } else if ("POST".equalsIgnoreCase(method) && "/invoices".equals(path)) {
                responseBody = createInvoice(exchange, userId); // <-- MODIFIED
                statusCode = 201;
            } else if ("PUT".equalsIgnoreCase(method) && "/invoices".equals(path)) {
                responseBody = updateInvoice(exchange, userId);
                statusCode = 200;
            } else if (path.startsWith("/invoices/")) {
                String invoiceId = path.substring("/invoices/".length());

                if ("GET".equalsIgnoreCase(method)) {
                    responseBody = getInvoiceById(invoiceId, userId);
                    statusCode = 200;
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    responseBody = deleteInvoice(invoiceId, userId);
                    statusCode = 200;
                } else {
                    statusCode = 405;
                    responseBody = "{\"error\": \"Method not allowed for /invoices/[id]\"}";
                }
            } else if ("POST".equalsIgnoreCase(method) && "/invoices/mark-paid".equals(path)) {
                responseBody = markAsPaid(exchange, userId);
                statusCode = 200;
            } else {
                statusCode = 405;
                responseBody = "{\"error\": \"Method not allowed.\"}";
            }
        } catch (SQLException e) {
            statusCode = 500;
            // Check for duplicate key violation
            if (e.getErrorCode() == 1062) { // 1062 is MySQL's duplicate entry code
                responseBody = "{\"error\": \"Database error: A duplicate invoice ID was detected. Please try again.\"}";
            } else {
                responseBody = "{\"error\": \"Database error: " + e.getMessage() + "\"}";
            }
            e.printStackTrace(); // For debugging
        } catch (JsonSyntaxException e) {
            statusCode = 400;
            responseBody = "{\"error\": \"Invalid JSON data: " + e.getMessage() + "\"}";
        } catch (IllegalArgumentException e) {
            statusCode = 400;
            responseBody = "{\"error\": \"" + e.getMessage() + "\"}";
        } catch (Exception e) {
            statusCode = 500;
            responseBody = "{\"error\": \"Server error: " + e.getMessage() + "\"}";
            e.printStackTrace(); // For debugging
        }

        sendResponse(exchange, statusCode, responseBody);
    }

    // --- HELPER METHODS ---

    private String getFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int startYear;

        if (today.getMonth().getValue() >= 4) { // April (4) or later
            startYear = year;
        } else {
            startYear = year - 1;
        }
        String endYear = String.valueOf(startYear + 1).substring(2);
        return startYear + "-" + endYear;
    }

    /**
     * Generates the next sequential invoice ID (e.g., "DS/2025-26/0001")
     * by querying the database for the highest existing number *for this user*
     * in the current FY.
     * This MUST be called from within an active transaction.
     */
    // --- MODIFIED ---
    private String generateNextInvoiceId(Connection conn, int userId) throws SQLException {
        String fy = getFinancialYear();
        String prefix = "DS/" + fy + "/"; // e.g., "DS/2025-26/"
        String nextId;
        int nextNumber = 1;

        // Find the highest ID *for this user* in this FY
        // Lock the rows to prevent race conditions (two requests from the same user)
        String sql = "SELECT id FROM invoices WHERE user_id = ? AND id LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId); // <-- ADDED
            stmt.setString(2, prefix + "%"); // <-- INDEX CHANGED

            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String lastId = rs.getString("id");
                try {
                    String numPart = lastId.substring(prefix.length()); // "0001"
                    int lastNum = Integer.parseInt(numPart);
                    nextNumber = lastNum + 1;
                } catch (Exception e) {
                    System.err.println("Error parsing last invoice ID: " + lastId + ". Resetting to 1.");
                    nextNumber = 1;
                }
            }
        }

        nextId = prefix + String.format("%04d", nextNumber); // "DS/2025-26/0001"
        return nextId;
    }
    // --- END MODIFICATION ---


    private String getInvoices(int userId) throws SQLException {
        // (This function is unchanged)
        List<Invoice> invoices = new ArrayList<>();
        String sql = "SELECT id, client_name, amount, status, items, bill_from, bill_to, project_description, payment_terms, invoice_date, terms_of_payment, suppliers_ref, other_ref, subtotal, gst_amount, total, hsn, gst_mode, gst_percent FROM invoices WHERE user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                Invoice invoice = new Invoice();
                invoice.id = rs.getString("id");
                invoice.clientName = rs.getString("client_name");
                invoice.amount = rs.getDouble("amount");
                invoice.status = rs.getString("status");

                invoice.items = gson.fromJson(rs.getString("items"), new TypeToken<List<Invoice.Item>>(){}.getType());

                invoice.billFrom = gson.fromJson(rs.getString("bill_from"), Invoice.BillFrom.class);
                invoice.billTo = gson.fromJson(rs.getString("bill_to"), Invoice.BillTo.class);
                invoice.projectDescription = rs.getString("project_description");
                invoice.paymentTerms = rs.getString("payment_terms");
                invoice.invoiceDate = rs.getString("invoice_date");
                invoice.termsOfPayment = rs.getString("terms_of_payment");
                invoice.suppliersRef = rs.getString("suppliers_ref");
                invoice.otherRef = rs.getString("other_ref");
                invoice.subtotal = rs.getDouble("subtotal");
                invoice.gstAmount = rs.getDouble("gst_amount");
                invoice.total = rs.getDouble("total");
                invoice.hsn = rs.getString("hsn");
                invoice.gstMode = rs.getString("gst_mode");
                invoice.gstPercent = rs.getDouble("gst_percent");
                invoices.add(invoice);
            }
        }
        return gson.toJson(invoices);
    }

    private String getInvoiceById(String invoiceId, int userId) throws SQLException {
        // (This function is unchanged)
        Invoice invoice = null;
        String sql = "SELECT id, client_name, amount, status, items, bill_from, bill_to, project_description, payment_terms, invoice_date, terms_of_payment, suppliers_ref, other_ref, subtotal, gst_amount, total, hsn, gst_mode, gst_percent FROM invoices WHERE id = ? AND user_id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, invoiceId);
            stmt.setInt(2, userId);

            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                invoice = new Invoice();
                invoice.id = rs.getString("id");
                invoice.clientName = rs.getString("client_name");
                invoice.amount = rs.getDouble("amount");
                invoice.status = rs.getString("status");
                invoice.items = gson.fromJson(rs.getString("items"), new TypeToken<List<Invoice.Item>>(){}.getType());
                invoice.billFrom = gson.fromJson(rs.getString("bill_from"), Invoice.BillFrom.class);
                invoice.billTo = gson.fromJson(rs.getString("bill_to"), Invoice.BillTo.class);
                invoice.projectDescription = rs.getString("project_description");
                invoice.paymentTerms = rs.getString("payment_terms");
                invoice.invoiceDate = rs.getString("invoice_date");
                invoice.termsOfPayment = rs.getString("terms_of_payment");
                invoice.suppliersRef = rs.getString("suppliers_ref");
                invoice.otherRef = rs.getString("other_ref");
                invoice.subtotal = rs.getDouble("subtotal");
                invoice.gstAmount = rs.getDouble("gst_amount");
                invoice.total = rs.getDouble("total");
                invoice.hsn = rs.getString("hsn");
                invoice.gstMode = rs.getString("gst_mode");
                invoice.gstPercent = rs.getDouble("gst_percent");
            }
        }

        if (invoice == null) {
            throw new IllegalArgumentException("Invoice not found or unauthorized.");
        }

        return gson.toJson(invoice);
    }


    private String createInvoice(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        System.out.println("Received create payload: " + jsonBody);

        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        validateInvoice(invoice);

        invoice.status = invoice.status != null ? invoice.status : "pending";
        invoice.amount = calculateAmount(invoice.items);

        String sql = "INSERT INTO invoices (id, user_id, client_name, amount, status, items, bill_from, bill_to, project_description, payment_terms, invoice_date, terms_of_payment, suppliers_ref, other_ref, subtotal, gst_amount, total, hsn, gst_mode, gst_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        Connection conn = null;
        try {
            conn = DatabaseUtil.getConnection();
            conn.setAutoCommit(false); // Start transaction

            // --- MODIFIED ---
            // Generate the new ID *for this user*
            invoice.id = generateNextInvoiceId(conn, userId);
            // ---

            // 1. Insert Invoice
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, invoice.id); // Use the new, generated ID
                stmt.setInt(2, userId);
                stmt.setString(3, invoice.clientName);
                stmt.setDouble(4, invoice.amount);
                stmt.setString(5, invoice.status);
                stmt.setString(6, gson.toJson(invoice.items));
                stmt.setString(7, gson.toJson(invoice.billFrom));
                stmt.setString(8, gson.toJson(invoice.billTo));
                stmt.setString(9, invoice.projectDescription);
                stmt.setString(10, invoice.paymentTerms);
                stmt.setString(11, invoice.invoiceDate);
                stmt.setString(12, invoice.termsOfPayment);
                stmt.setString(13, invoice.suppliersRef);
                stmt.setString(14, invoice.otherRef);
                stmt.setDouble(15, invoice.subtotal);
                stmt.setDouble(16, invoice.gstAmount);
                stmt.setDouble(17, invoice.total);
                stmt.setString(18, invoice.hsn);
                stmt.setString(19, invoice.gstMode);
                stmt.setDouble(20, invoice.gstPercent);
                stmt.executeUpdate();
            }

            // 2. Find or Create Customer
            int customerId = findOrCreateCustomer(conn, userId, invoice.clientName);

            // 3. Create Ledger Entry (Debit)
            String ledgerSql = "INSERT INTO ledger_entries (user_id, customer_id, invoice_id, entry_date, particulars, debit) VALUES (?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ledgerStmt = conn.prepareStatement(ledgerSql)) {
                ledgerStmt.setInt(1, userId);
                ledgerStmt.setInt(2, customerId);
                ledgerStmt.setString(3, invoice.id); // Use the new, generated ID
                ledgerStmt.setString(4, invoice.invoiceDate);
                ledgerStmt.setString(5, "BY BILL " + invoice.id);
                ledgerStmt.setDouble(6, invoice.total);
                ledgerStmt.executeUpdate();
            }

            conn.commit(); // Commit transaction

            return "{\"message\": \"Invoice created successfully\", \"id\": \"" + invoice.id + "\"}";

        } catch (SQLException e) {
            if (conn != null) conn.rollback(); // Rollback on error
            throw e; // Re-throw
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }

    private String updateInvoice(HttpExchange exchange, int userId) throws IOException, SQLException {
        // (This function is unchanged, it already uses id AND user_id)
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        validateInvoice(invoice);
        if (invoice.id == null) {
            throw new IllegalArgumentException("Invoice ID is required.");
        }

        invoice.amount = calculateAmount(invoice.items);

        String sql = "UPDATE invoices SET client_name = ?, amount = ?, status = ?, items = ?, bill_from = ?, bill_to = ?, project_description = ?, payment_terms = ?, invoice_date = ?, terms_of_payment = ?, suppliers_ref = ?, other_ref = ?, subtotal = ?, gst_amount = ?, total = ?, hsn = ?, gst_mode = ?, gst_percent = ? WHERE id = ? AND user_id = ?";

        Connection conn = null;
        try {
            conn = DatabaseUtil.getConnection();
            conn.setAutoCommit(false); // Start transaction

            int rows;
            // 1. Update Invoice
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, invoice.clientName);
                stmt.setDouble(2, invoice.amount);
                stmt.setString(3, invoice.status);
                stmt.setString(4, gson.toJson(invoice.items));
                stmt.setString(5, gson.toJson(invoice.billFrom));
                stmt.setString(6, gson.toJson(invoice.billTo));
                stmt.setString(7, invoice.projectDescription);
                stmt.setString(8, invoice.paymentTerms);
                stmt.setString(9, invoice.invoiceDate);
                stmt.setString(10, invoice.termsOfPayment);
                stmt.setString(11, invoice.suppliersRef);
                stmt.setString(12, invoice.otherRef);
                stmt.setDouble(13, invoice.subtotal);
                stmt.setDouble(14, invoice.gstAmount);
                stmt.setDouble(15, invoice.total);
                stmt.setString(16, invoice.hsn);
                stmt.setString(17, invoice.gstMode);
                stmt.setDouble(18, invoice.gstPercent);
                stmt.setString(19, invoice.id);
                stmt.setInt(20, userId);
                rows = stmt.executeUpdate();
            }

            if (rows > 0) {
                // 2. Find or Create new Customer
                int customerId = findOrCreateCustomer(conn, userId, invoice.clientName);

                // 3. Update Ledger Entry
                String ledgerSql = "UPDATE ledger_entries SET customer_id = ?, entry_date = ?, debit = ? " +
                        "WHERE user_id = ? AND invoice_id = ?";
                try (PreparedStatement ledgerStmt = conn.prepareStatement(ledgerSql)) {
                    ledgerStmt.setInt(1, customerId);
                    ledgerStmt.setString(2, invoice.invoiceDate);
                    ledgerStmt.setDouble(3, invoice.total);
                    ledgerStmt.setInt(4, userId);
                    ledgerStmt.setString(5, invoice.id);
                    ledgerStmt.executeUpdate();
                }

                conn.commit();
                return "{\"message\": \"Invoice updated successfully\"}";
            }
            throw new IllegalArgumentException("Invoice not found or unauthorized.");
        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }

    private String deleteInvoice(String invoiceId, int userId) throws SQLException {
        // (This function is unchanged, it already uses id AND user_id)
        Connection conn = null;
        try {
            conn = DatabaseUtil.getConnection();
            conn.setAutoCommit(false);

            String ledgerSql = "DELETE FROM ledger_entries WHERE invoice_id = ? AND user_id = ?";
            try (PreparedStatement ledgerStmt = conn.prepareStatement(ledgerSql)) {
                ledgerStmt.setString(1, invoiceId);
                ledgerStmt.setInt(2, userId);
                ledgerStmt.executeUpdate();
            }

            String sql = "DELETE FROM invoices WHERE id = ? AND user_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, invoiceId);
                stmt.setInt(2, userId);
                int rows = stmt.executeUpdate();
                if (rows > 0) {
                    conn.commit();
                    return "{\"message\": \"Invoice deleted successfully\"}";
                }
                throw new IllegalArgumentException("Invoice not found or unauthorized.");
            }
        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }

    private int findOrCreateCustomer(Connection conn, int userId, String clientName) throws SQLException {
        // (This function is unchanged)
        String selectSql = "SELECT id FROM customers WHERE user_id = ? AND name = ?";
        try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
            selectStmt.setInt(1, userId);
            selectStmt.setString(2, clientName);
            ResultSet rs = selectStmt.executeQuery();
            if (rs.next()) {
                return rs.getInt("id");
            }
        }

        String insertSql = "INSERT INTO customers (user_id, name) VALUES (?, ?)";
        try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            insertStmt.setInt(1, userId);
            insertStmt.setString(2, clientName);
            insertStmt.executeUpdate();
            ResultSet rs = insertStmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getInt(1);
            }
            throw new SQLException("Failed to create customer.");
        }
    }

    private String markAsPaid(HttpExchange exchange, int userId) throws IOException, SQLException {
        // (This function is unchanged)
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        if (invoice.id == null) throw new IllegalArgumentException("Invoice ID is required.");
        String sql = "UPDATE invoices SET status = 'paid' WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoice.id);
            stmt.setInt(2, userId);
            int rows = stmt.executeUpdate();
            if (rows > 0) return "{\"message\": \"Invoice marked as paid\"}";
            throw new IllegalArgumentException("Invoice not found or unauthorized.");
        }
    }

    private double calculateAmount(List<Invoice.Item> items) {
        // (This function is unchanged)
        if (items == null) return 0;
        return items.stream().mapToDouble(i -> i.quantity * i.rate).sum();
    }

    private void validateInvoice(Invoice invoice) {
        // (This function is unchanged)
        if (invoice.clientName == null || invoice.clientName.trim().isEmpty() ||
                invoice.items == null || invoice.items.isEmpty() ||
                invoice.billFrom == null || invoice.billTo == null ||
                invoice.invoiceDate == null || invoice.invoiceDate.trim().isEmpty() ||
                invoice.gstMode == null || invoice.gstMode.trim().isEmpty() ||
                invoice.gstPercent < 0) {
            throw new IllegalArgumentException("Missing or invalid required fields: clientName, items, billFrom, billTo, invoiceDate, HSN, GstMode, or GstPercent.");
        }
        for (Invoice.Item i : invoice.items) {
            if (i.name == null || i.name.trim().isEmpty() || i.quantity <= 0 || i.rate < 0)
                throw new IllegalArgumentException("Invalid item data: name, quantity, rate.");
        }
        if (invoice.billFrom.name == null || invoice.billFrom.streetAddress == null ||
                invoice.billTo.streetAddress == null) {
            throw new IllegalArgumentException("Invalid billFrom or billTo data: name and streetAddress are required.");
        }
    }

    private void sendResponse(HttpExchange exchange, int status, String body) throws IOException {
        // (This function is unchanged)
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
    }
}