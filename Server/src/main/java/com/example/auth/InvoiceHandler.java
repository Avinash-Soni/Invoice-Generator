package com.example.auth;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InvoiceHandler implements HttpHandler {
    private final Gson gson = new Gson();

    static class Invoice {
        String id;
        String clientName;
        String dueDate;
        double amount;
        String status;
        List<Item> items;
        BillFrom billFrom;
        BillTo billTo;
        String projectDescription;
        String paymentTerms;
        String invoiceDate;
        String termsOfPayment;
        String suppliersRef;
        String otherRef;
        double subtotal;
        double gstAmount;
        double total;

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
                responseBody = createInvoice(exchange, userId);
                statusCode = 201;
            } else if ("PUT".equalsIgnoreCase(method) && "/invoices".equals(path)) {
                responseBody = updateInvoice(exchange, userId);
                statusCode = 200;
            } else if ("DELETE".equalsIgnoreCase(method) && path.startsWith("/invoices/")) {
                String invoiceId = path.substring("/invoices/".length());
                responseBody = deleteInvoice(invoiceId, userId);
                statusCode = 200;
            } else if ("POST".equalsIgnoreCase(method) && "/invoices/mark-paid".equals(path)) {
                responseBody = markAsPaid(exchange, userId);
                statusCode = 200;
            } else {
                statusCode = 405;
                responseBody = "{\"error\": \"Method not allowed.\"}";
            }
        } catch (SQLException e) {
            statusCode = 500;
            responseBody = "{\"error\": \"Database error: " + e.getMessage() + "\"}";
        } catch (JsonSyntaxException e) {
            statusCode = 400;
            responseBody = "{\"error\": \"Invalid JSON data: " + e.getMessage() + "\"}";
        } catch (IllegalArgumentException e) {
            statusCode = 400;
            responseBody = "{\"error\": \"" + e.getMessage() + "\"}";
        } catch (Exception e) {
            statusCode = 500;
            responseBody = "{\"error\": \"Server error: " + e.getMessage() + "\"}";
        }

        sendResponse(exchange, statusCode, responseBody);
    }

    private String getInvoices(int userId) throws SQLException {
        List<Invoice> invoices = new ArrayList<>();
        String sql = "SELECT id, client_name, due_date, amount, status, items, bill_from, bill_to, project_description, payment_terms, invoice_date, terms_of_payment, suppliers_ref, other_ref, subtotal, gst_amount, total FROM invoices WHERE user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                Invoice invoice = new Invoice();
                invoice.id = rs.getString("id");
                invoice.clientName = rs.getString("client_name");
                invoice.dueDate = rs.getString("due_date");
                invoice.amount = rs.getDouble("amount");
                invoice.status = rs.getString("status");
                invoice.items = gson.fromJson(rs.getString("items"), List.class);
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
                invoices.add(invoice);
            }
        }
        return gson.toJson(invoices);
    }

    private String createInvoice(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        System.out.println("Received create payload: " + jsonBody); // ✅ Log payload

        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        validateInvoice(invoice);
        invoice.id = invoice.id != null ? invoice.id : UUID.randomUUID().toString();
        invoice.status = invoice.status != null ? invoice.status : "pending";
        invoice.amount = calculateAmount(invoice.items);
        invoice.subtotal = invoice.subtotal != 0 ? invoice.subtotal : invoice.amount;
        invoice.gstAmount = invoice.gstAmount != 0 ? invoice.gstAmount : invoice.subtotal * 0.18;
        invoice.total = invoice.total != 0 ? invoice.total : invoice.subtotal + invoice.gstAmount;

        String sql = "INSERT INTO invoices (id, user_id, client_name, due_date, amount, status, items, bill_from, bill_to, project_description, payment_terms, invoice_date, terms_of_payment, suppliers_ref, other_ref, subtotal, gst_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoice.id);
            stmt.setInt(2, userId);
            stmt.setString(3, invoice.clientName);
            stmt.setString(4, invoice.dueDate);
            stmt.setDouble(5, invoice.amount);
            stmt.setString(6, invoice.status);
            stmt.setString(7, gson.toJson(invoice.items));
            stmt.setString(8, gson.toJson(invoice.billFrom));
            stmt.setString(9, gson.toJson(invoice.billTo));
            stmt.setString(10, invoice.projectDescription);
            stmt.setString(11, invoice.paymentTerms);
            stmt.setString(12, invoice.invoiceDate);
            stmt.setString(13, invoice.termsOfPayment);
            stmt.setString(14, invoice.suppliersRef);
            stmt.setString(15, invoice.otherRef);
            stmt.setDouble(16, invoice.subtotal);
            stmt.setDouble(17, invoice.gstAmount);
            stmt.setDouble(18, invoice.total);
            stmt.executeUpdate();
        }
        return "{\"message\": \"Invoice created successfully\", \"id\": \"" + invoice.id + "\"}";
    }

    private String updateInvoice(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        System.out.println("Received update payload: " + jsonBody); // ✅ Log payload

        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        validateInvoice(invoice);
        if (invoice.id == null) {
            throw new IllegalArgumentException("Invoice ID is required.");
        }
        invoice.amount = calculateAmount(invoice.items);
        invoice.subtotal = invoice.subtotal != 0 ? invoice.subtotal : invoice.amount;
        invoice.gstAmount = invoice.gstAmount != 0 ? invoice.gstAmount : invoice.subtotal * 0.18;
        invoice.total = invoice.total != 0 ? invoice.total : invoice.subtotal + invoice.gstAmount;

        String sql = "UPDATE invoices SET client_name = ?, due_date = ?, amount = ?, status = ?, items = ?, bill_from = ?, bill_to = ?, project_description = ?, payment_terms = ?, invoice_date = ?, terms_of_payment = ?, suppliers_ref = ?, other_ref = ?, subtotal = ?, gst_amount = ?, total = ? WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoice.clientName);
            stmt.setString(2, invoice.dueDate);
            stmt.setDouble(3, invoice.amount);
            stmt.setString(4, invoice.status);
            stmt.setString(5, gson.toJson(invoice.items));
            stmt.setString(6, gson.toJson(invoice.billFrom));
            stmt.setString(7, gson.toJson(invoice.billTo));
            stmt.setString(8, invoice.projectDescription);
            stmt.setString(9, invoice.paymentTerms);
            stmt.setString(10, invoice.invoiceDate);
            stmt.setString(11, invoice.termsOfPayment);
            stmt.setString(12, invoice.suppliersRef);
            stmt.setString(13, invoice.otherRef);
            stmt.setDouble(14, invoice.subtotal);
            stmt.setDouble(15, invoice.gstAmount);
            stmt.setDouble(16, invoice.total);
            stmt.setString(17, invoice.id);
            stmt.setInt(18, userId);
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return "{\"message\": \"Invoice updated successfully\"}";
            } else {
                throw new IllegalArgumentException("Invoice not found or unauthorized.");
            }
        }
    }

    private String deleteInvoice(String invoiceId, int userId) throws SQLException {
        System.out.println("Attempting to delete invoice ID: " + invoiceId + " for user ID: " + userId); // ✅ Debug log
        String sql = "DELETE FROM invoices WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoiceId);
            stmt.setInt(2, userId);
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return "{\"message\": \"Invoice deleted successfully\"}";
            } else {
                throw new IllegalArgumentException("Invoice not found or unauthorized.");
            }
        }
    }

    private String markAsPaid(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        System.out.println("Received mark-paid payload: " + jsonBody); // ✅ Log payload

        Invoice invoice = gson.fromJson(jsonBody, Invoice.class);
        if (invoice.id == null) {
            throw new IllegalArgumentException("Invoice ID is required.");
        }
        String sql = "UPDATE invoices SET status = 'paid' WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoice.id);
            stmt.setInt(2, userId);
            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return "{\"message\": \"Invoice marked as paid\"}";
            } else {
                throw new IllegalArgumentException("Invoice not found or unauthorized.");
            }
        }
    }

    private double calculateAmount(List<Invoice.Item> items) {
        return items.stream().mapToDouble(item -> item.quantity * item.rate).sum();
    }

    private void validateInvoice(Invoice invoice) {
        if (invoice.clientName == null || invoice.clientName.trim().isEmpty() ||
                invoice.dueDate == null || invoice.dueDate.trim().isEmpty() ||
                invoice.items == null || invoice.items.isEmpty() ||
                invoice.billFrom == null || invoice.billTo == null ||
                invoice.invoiceDate == null || invoice.invoiceDate.trim().isEmpty()) {
            throw new IllegalArgumentException("Missing or invalid required fields: clientName, dueDate, items, billFrom, billTo, or invoiceDate.");
        }
        for (Invoice.Item item : invoice.items) {
            if (item.name == null || item.name.trim().isEmpty() || item.quantity <= 0 || item.rate < 0) {
                throw new IllegalArgumentException("Invalid item data: name must not be empty, quantity must be positive, and rate must be non-negative.");
            }
        }
        if (invoice.billFrom.name == null || invoice.billFrom.streetAddress == null ||
                invoice.billTo.streetAddress == null) {
            throw new IllegalArgumentException("Invalid billFrom or billTo data: name and streetAddress are required.");
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, responseBody.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBody.getBytes(StandardCharsets.UTF_8));
        }
    }
}
