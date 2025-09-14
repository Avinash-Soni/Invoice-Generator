package com.example.auth;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;

public class LogoutHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        HandlerUtils.setCorsHeaders(exchange);

        String sessionId = HandlerUtils.getSessionIdFromCookie(exchange);
        if (sessionId != null) {
            SessionManager.removeSession(sessionId);
        }

        exchange.getResponseHeaders().add("Set-Cookie", "SESSIONID=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict");
        String response = "{\"message\": \"Logged out successfully\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
}
