# 🧾 Invoice Generator & ERP Billing Module

![Status](https://img.shields.io/badge/Status-Completed-success)
![Client](https://img.shields.io/badge/Client-Designer%20Square-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

A full-stack, robust **Billing and Financial Tracking Module** developed for **Designer Square Company**. This application streamlines the invoicing process, manages client ledgers, and automates data backups, replacing manual workflows with a digital ERP solution.

---

## 🏢 About the Client

**Designer Square Company**
*Founder & CEO: Mr. Veeru Soni*

This project was commissioned by Designer Square Company to modernize their financial infrastructure. The module serves as a critical component of their customized Enterprise Resource Planning (ERP) System, designed to automate billing, manage client ledgers, and ensure data security through automated cloud backups.

---

## 🚀 Key Features

### 🖥️ Frontend (Client Side)
* **Dynamic Invoice Creation:** Form-based invoice generator with automatic calculations for Subtotal, GST (IGST/CGST/SGST), and Grand Total.
* **PDF Generation:** One-click generation of professional PDF invoices using `@react-pdf/renderer`.
* **Interactive Dashboard:** A visual hub to manage clients, view summaries, and navigate features.
* **Ledger System:** Detailed financial ledgers for every client with Debit/Credit tracking and running balance calculations.
* **Financial Year Filtering:** Smart filtering logic to view data across specific financial years (e.g., 2024-25, 2025-26).
* **Responsive UI:** Built with **Tailwind CSS** and **Framer Motion** for smooth animations and mobile responsiveness.

### ⚙️ Backend (Server Side)
* **Custom Java Server:** Built using core Java (`com.sun.net.httpserver`) without heavy frameworks for maximum performance and control.
* **Automated Backups:** Integrated `BackupService` that automatically dumps the SQL database and exports data to CSV/Excel format to **Google Drive** every 60 minutes for disaster recovery.
* **Session Management:** Secure login/signup system with cookie-based session handling.
* **Raw JDBC:** Direct database interaction for optimized transaction management (ACID compliance) between Invoices, Customers, and Ledgers.

---

## 🛠️ Tech Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Redux Toolkit, Tailwind CSS, Framer Motion, Axios |
| **Backend** | Core Java, JDBC, Gson (JSON parsing) |
| **Database** | MySQL |
| **Tools** | Git, Google Drive API (Local Integration) |

---

## 📸 Application Overview

The application is divided into two primary modules:

1.  **Invoice Generator:**
    * Add items, quantity, and rates.
    * Toggle GST modes (Auto 18%, Manual, or None).
    * Manage Bill To/Bill From details automatically.

2.  **Financial Dashboard:**
    * **Customer Summary:** View all clients and their current account balances.
    * **Ledger View:** A detailed table showing every transaction (Bill generation vs. Payments received) with CRUD capabilities for manual entries.

---

## 💾 Installation & Setup

### Prerequisites
* Java Development Kit (JDK) 17 or higher.
* Node.js & npm.
* MySQL Server.


## 👨‍💻 Development Team

This project was successfully designed, developed, and deployed by a dedicated team of **B.Tech CSE (AI/ML)** students from **Shri Shankaracharya Technical Campus (SSTC)**, Bhilai.

**Team Members:**
* **Avinash Soni** - *301410923031*
* **Srikar Dhavala** - *301410923102*
* **Akshat Jaiswal** - *301410923011*
* **Tejaswini Sahu** - *301410923111*
* **Varsha Tarafdar** - *301410923118*

*Recognized for outstanding contribution and technical proficiency in Full Stack Development (Java, React, SQL).*
