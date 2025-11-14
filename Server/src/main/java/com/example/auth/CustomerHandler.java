package com.example.auth;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate; // <-- ADDED IMPORT
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CustomerHandler implements HttpHandler {
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

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if ("GET".equalsIgnoreCase(method)) {
                // GET /customers?year=...
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> queryParams = HandlerUtils.parseQueryParams(query);
                // --- MODIFIED: Default to current financial year ---
                String year = queryParams.getOrDefault("year", getCurrentFinancialYear());
                getCustomers(exchange, userId, year);
            } else if ("POST".equalsIgnoreCase(method)) {
                // POST /customers
                addCustomer(exchange, userId);
            } else if ("PUT".equalsIgnoreCase(method)) {
                // PUT /customers
                updateCustomer(exchange, userId);
            } else if ("DELETE".equalsIgnoreCase(method)) {
                // DELETE /customers/[id]
                String[] pathParts = path.split("/");
                if (pathParts.length > 2) {
                    int customerId = Integer.parseInt(pathParts[2]);
                    deleteCustomer(exchange, userId, customerId);
                } else {
                    sendResponse(exchange, 400, "{\"error\": \"Customer ID required for DELETE\"}");
                }
            } else {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            }
        } catch (SQLException e) {
            sendResponse(exchange, 500, "{\"error\": \"Database error: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
        }
    }

    private void getCustomers(HttpExchange exchange, int userId, String year) throws IOException, SQLException {
        List<Customer> customers = new ArrayList<>();
        // 1. Get all customers for the user (MODIFIED to fetch all fields)
        String sql = "SELECT id, name, client_email, street_address, city, post_code, country, gstin " +
                "FROM customers WHERE user_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                Customer customer = new Customer(rs.getInt("id"), rs.getString("name"));
                customer.setClientEmail(rs.getString("client_email"));
                customer.setStreetAddress(rs.getString("street_address"));
                customer.setCity(rs.getString("city"));
                customer.setPostCode(rs.getString("post_code"));
                customer.setCountry(rs.getString("country"));
                customer.setGstin(rs.getString("gstin"));
                customers.add(customer);
            }
        }

        // 2. For each customer, calculate their balance
        // --- MODIFIED: Validate year and remove "All" logic ---
        String[] financialYearDates = getFinancialYearDates(year);
        if (financialYearDates == null) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid or missing year format. Expected YYYY-YY.\"}");
            return;
        }

        String balanceSql;

        // --- MODIFIED: Removed 'isYearlyFilter' and 'else' block ---
        balanceSql = "SELECT " +
                "SUM(CASE WHEN entry_date < ? THEN (debit - credit) ELSE 0 END) AS openingBalance, " +
                "SUM(CASE WHEN entry_date >= ? AND entry_date <= ? THEN debit ELSE 0 END) AS totalDebit, " +
                "SUM(CASE WHEN entry_date >= ? AND entry_date <= ? THEN credit ELSE 0 END) AS totalCredit " +
                "FROM ledger_entries WHERE user_id = ? AND customer_id = ?";


        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement balanceStmt = conn.prepareStatement(balanceSql)) {
            for (Customer customer : customers) {
                // --- MODIFIED: Removed 'if(isYearlyFilter)' wrapper ---
                String startDate = financialYearDates[0];
                String endDate = financialYearDates[1];
                balanceStmt.setString(1, startDate);
                balanceStmt.setString(2, startDate);
                balanceStmt.setString(3, endDate);
                balanceStmt.setString(4, startDate);
                balanceStmt.setString(5, endDate);
                balanceStmt.setInt(6, userId);
                balanceStmt.setInt(7, customer.getId());

                ResultSet rs = balanceStmt.executeQuery();
                if (rs.next()) {
                    // --- MODIFIED: Removed 'if(isYearlyFilter)' wrapper ---
                    double openingBalance = rs.getDouble("openingBalance");
                    double totalDebit = rs.getDouble("totalDebit");
                    double totalCredit = rs.getDouble("totalCredit");
                    customer.setBalance(openingBalance + totalDebit - totalCredit);
                }
            }
        }

        sendResponse(exchange, 200, gson.toJson(customers));
    }

    // --- (addCustomer method is unchanged) ---
    private void addCustomer(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Customer customer = gson.fromJson(jsonBody, Customer.class);

        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            sendResponse(exchange, 400, "{\"error\": \"Customer name is required\"}");
            return;
        }

        String sql = "INSERT INTO customers (user_id, name, client_email, street_address, city, post_code, country, gstin) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, userId);
            stmt.setString(2, customer.getName());
            stmt.setString(3, customer.getClientEmail());
            stmt.setString(4, customer.getStreetAddress());
            stmt.setString(5, customer.getCity());
            stmt.setString(6, customer.getPostCode());
            stmt.setString(7, customer.getCountry());
            stmt.setString(8, customer.getGstin());

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        customer.setId(generatedKeys.getInt(1)); // Set the new ID on the object
                        sendResponse(exchange, 201, gson.toJson(customer)); // Return the new customer
                    } else {
                        throw new SQLException("Creating customer failed, no ID obtained.");
                    }
                }
            } else {
                sendResponse(exchange, 500, "{\"error\": \"Failed to create customer\"}");
            }
        }
    }

    // --- (updateCustomer method is unchanged) ---
    private void updateCustomer(HttpExchange exchange, int userId) throws IOException, SQLException {
        String jsonBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Customer customer = gson.fromJson(jsonBody, Customer.class);

        if (customer.getId() == 0 || customer.getName() == null || customer.getName().trim().isEmpty()) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid customer data\"}");
            return;
        }

        String sql = "UPDATE customers SET name = ?, client_email = ?, street_address = ?, city = ?, " +
                "post_code = ?, country = ?, gstin = ? WHERE id = ? AND user_id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, customer.getName());
            stmt.setString(2, customer.getClientEmail());
            stmt.setString(3, customer.getStreetAddress());
            stmt.setString(4, customer.getCity());
            stmt.setString(5, customer.getPostCode());
            stmt.setString(6, customer.getCountry());
            stmt.setString(7, customer.getGstin());
            stmt.setInt(8, customer.getId());
            stmt.setInt(9, userId);

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                sendResponse(exchange, 200, "{\"message\": \"Customer updated\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\": \"Customer not found or unauthorized\"}");
            }
        }
    }

    // --- (deleteCustomer method is unchanged) ---
    private void deleteCustomer(HttpExchange exchange, int userId, int customerId) throws IOException, SQLException {
        // We must also delete related ledger entries to avoid foreign key constraints
        // Or set them to NULL. Let's delete them.
        String ledgerSql = "DELETE FROM ledger_entries WHERE customer_id = ? AND user_id = ?";
        String customerSql = "DELETE FROM customers WHERE id = ? AND user_id = ?";

        Connection conn = null;
        try {
            conn = DatabaseUtil.getConnection();
            conn.setAutoCommit(false); // Start transaction

            // Delete ledger entries first
            try (PreparedStatement ledgerStmt = conn.prepareStatement(ledgerSql)) {
                ledgerStmt.setInt(1, customerId);
                ledgerStmt.setInt(2, userId);
                ledgerStmt.executeUpdate();
            }

            // Then delete the customer
            try (PreparedStatement customerStmt = conn.prepareStatement(customerSql)) {
                customerStmt.setInt(1, customerId);
                customerStmt.setInt(2, userId);
                int rows = customerStmt.executeUpdate();

                if (rows > 0) {
                    conn.commit(); // Commit transaction
                    sendResponse(exchange, 200, "{\"message\": \"Customer deleted\"}");
                } else {
                    conn.rollback(); // Rollback if customer not found
                    sendResponse(exchange, 404, "{\"error\": \"Customer not found or unauthorized\"}");
                }
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

    // --- (sendResponse method is unchanged) ---
    private void sendResponse(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
    }
}