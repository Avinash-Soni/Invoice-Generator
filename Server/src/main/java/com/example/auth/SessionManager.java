package com.example.auth;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SessionManager {
    private static final Map<String, Integer> sessions = new ConcurrentHashMap<>();

    public static void createSession(String sessionId, int userId) {
        sessions.put(sessionId, userId);
    }

    public static Integer getUserId(String sessionId) {
        return sessions.get(sessionId);
    }

    public static void removeSession(String sessionId) {
        sessions.remove(sessionId);
    }
}
