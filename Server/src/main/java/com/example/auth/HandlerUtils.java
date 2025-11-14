package com.example.auth;

import com.sun.net.httpserver.HttpExchange;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HandlerUtils {
    public static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:5173");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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

    /**
     * --- NEW METHOD ---
     * Parses a query string (e.g., "year=2025-26&foo=bar") into a Map.
     */
    public static Map<String, String> parseQueryParams(String query) {
        if (query == null || query.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, String> params = new HashMap<>();
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            try {
                String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8.name());
                String value = "";
                if (pair.length > 1) {
                    value = URLDecoder.decode(pair[1], StandardCharsets.UTF_8.name());
                }
                params.put(key, value);
            } catch (UnsupportedEncodingException e) {
                // This should not happen with UTF-8
                e.printStackTrace();
            }
        }
        return params;
    }
}