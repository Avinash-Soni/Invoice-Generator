package com.example.auth;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/signup", new SignUpHandler());
        server.createContext("/login", new LoginHandler());
        server.createContext("/logout", new LogoutHandler());
        server.createContext("/check-session", new CheckSessionHandler());
        server.createContext("/invoices", new InvoiceHandler());

        // --- NEW ROUTES ---
        server.createContext("/customers", new CustomerHandler());
        server.createContext("/ledger/", new LedgerHandler()); // Handles /ledger/[name]
        server.createContext("/items/suggestions", new ItemSuggestionHandler());

        server.setExecutor(null);
        System.out.println("Core Java backend server starting on port: " + port);
        server.start();
    }
}