package com.example.auth;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Main {
    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Register your existing handlers
        server.createContext("/signup", new SignUpHandler());
        server.createContext("/login", new LoginHandler());
        server.createContext("/logout", new LogoutHandler());
        server.createContext("/check-session", new CheckSessionHandler());
        server.createContext("/invoices", new InvoiceHandler());
        server.createContext("/customers", new CustomerHandler());
        server.createContext("/ledger/", new LedgerHandler());
        server.createContext("/items/suggestions", new ItemSuggestionHandler());

        server.setExecutor(null);
        server.start();

        // --- START BACKUP SCHEDULER ---
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        BackupService backupService = new BackupService();

        // Backup every 60 minutes
        scheduler.scheduleAtFixedRate(() -> {
            backupService.performBackup();
        }, 0, 60, TimeUnit.MINUTES);
    }
}