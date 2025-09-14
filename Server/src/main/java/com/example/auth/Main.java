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

        server.setExecutor(null);
        System.out.println("Core Java backend server starting on port: " + port);
        server.start();
    }
}
