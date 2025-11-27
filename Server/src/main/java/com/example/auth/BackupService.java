package com.example.auth;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.sql.*;

public class BackupService {

    public void performBackup() {
        // 1. Target Folder: Google Drive (G:)
        File driveDir = new File("F:\\My Drive\\Client_App_Backups");

        if (!driveDir.exists()) {
            driveDir = new File(System.getProperty("user.home"), "Google Drive\\Client_App_Backups");
        }
        if (!driveDir.exists()) {
            driveDir = new File(System.getProperty("user.home"), "Desktop\\Client_App_Backups");
        }

        if (!driveDir.exists()) driveDir.mkdirs();

        // 2. Run Backups
        createSqlDump(driveDir);
        createExcelFriendlyExport(driveDir);
    }

    private void createSqlDump(File dir) {
        String fileName = "backup_latest.sql";
        File saveFile = new File(dir, fileName);

        String[] command = new String[]{
                "mysqldump",
                "-u" + DatabaseUtil.getDbUser(),
                "-p" + DatabaseUtil.getDbPassword(),
                DatabaseUtil.getDbName(),
                "-r",
                saveFile.getAbsolutePath()
        };

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.start().waitFor();
            System.out.println("SQL Backup updated: " + saveFile.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createExcelFriendlyExport(File baseDir) {
        File excelFolder = new File(baseDir, "Latest_Excel_Data");
        if (!excelFolder.exists()) {
            excelFolder.mkdirs();
        }

        // Clean up old files
        File[] files = excelFolder.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.getName().endsWith(".csv")) {
                    f.delete();
                }
            }
        }

        try (Connection conn = DatabaseUtil.getConnection()) {
            // --- ADDED "users" TABLE HERE ---
            exportTableToCsv(conn, excelFolder, "users");

            exportTableToCsv(conn, excelFolder, "invoices");
            exportTableToCsv(conn, excelFolder, "customers");
            exportTableToCsv(conn, excelFolder, "ledger_entries");

            System.out.println("Excel files updated in: " + excelFolder.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void exportTableToCsv(Connection conn, File folder, String tableName) throws SQLException, IOException {
        File csvFile = new File(folder, tableName + ".csv");

        try (FileWriter writer = new FileWriter(csvFile, false);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName)) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            for (int i = 1; i <= colCount; i++) {
                writer.append(escapeCsv(meta.getColumnName(i)));
                if (i < colCount) writer.append(",");
            }
            writer.append("\n");

            while (rs.next()) {
                for (int i = 1; i <= colCount; i++) {
                    String val = rs.getString(i);
                    writer.append(escapeCsv(val));
                    if (i < colCount) writer.append(",");
                }
                writer.append("\n");
            }
        }
    }

    private String escapeCsv(String data) {
        if (data == null) return "";
        if (data.contains(",") || data.contains("\"") || data.contains("\n")) {
            data = data.replace("\"", "\"\"");
            return "\"" + data + "\"";
        }
        return data;
    }
}