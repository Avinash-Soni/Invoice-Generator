@echo off
title Invoice App Launcher

:: 1. Start the Java Backend (Silently)
:: This runs in the background. No black window will appear for Java.
start "" "C:\Program Files\Java\jdk-25\bin\java.exe" -cp "C:\Users\HP\Desktop\auth-backend-core.jar;C:\Path\To\mysql-connector.jar" com.example.auth.Main

:: NOTE: If mysql-connector is NOT inside your main JAR, 
:: you must include it in the -cp path above separated by a semicolon (;).
:: Example: -cp "C:\App\auth-backend-core.jar;C:\App\mysql-connector-j-8.0.33.jar"

:: 2. Wait 3 seconds for backend to initialize
timeout /t 3 >nul

:: 3. Open the Frontend (Apache) in the default browser
start http://localhost/

exit