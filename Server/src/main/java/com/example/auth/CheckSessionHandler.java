package com.example.auth;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;

public class CheckSessionHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        HandlerUtils.setCorsHeaders(exchange);

        String sessionId = HandlerUtils.getSessionIdFromCookie(exchange);
        boolean isLoggedIn = sessionId != null && SessionManager.getUserId(sessionId) != null;

        String response = "{\"loggedIn\": " + isLoggedIn + "}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
}
