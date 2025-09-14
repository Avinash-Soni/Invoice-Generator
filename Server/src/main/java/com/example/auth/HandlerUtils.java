package com.example.auth;

import com.sun.net.httpserver.HttpExchange;

import java.util.Arrays;
import java.util.List;

public class HandlerUtils {
    public static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:5173");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type,Authorization");
        exchange.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
    }

    public static String getSessionIdFromCookie(HttpExchange exchange) {
        List<String> cookies = exchange.getRequestHeaders().get("Cookie");
        if (cookies != null) {
            for (String cookie : cookies) {
                for (String part : cookie.split(";")) {
                    if (part.trim().startsWith("SESSIONID=")) {
                        return part.trim().substring("SESSIONID=".length());
                    }
                }
            }
        }
        return null;
    }
}
