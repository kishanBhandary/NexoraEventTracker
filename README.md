# Nexora Event Tracker

<p align="center">
  <img src="public/eventlogo-removebg-preview.png" alt="Nexora Event Tracker" width="180" />
</p>

<p align="center">
  <strong>A secure, offline-first desktop platform for managing student events, achievements, and spreadsheet-based records.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#technology-stack">Technology</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#building-for-production">Build</a> •
  <a href="#security">Security</a>
</p>

---

## Overview

**Nexora Event Tracker** is a cross-platform desktop application built to simplify the management of student event participation, achievements, certificates, and related records.

The application combines **Electron, Next.js, TypeScript, SQLite, and Google Drive integration** to provide a fast, secure, and offline-first experience.

Administrators can import structured spreadsheet data from event registration and participation forms, process the records locally, and maintain a centralized event database without depending on a continuously available internet connection.

### Core Objectives

* Simplify student event and achievement management
* Reduce manual spreadsheet processing
* Provide fast local data access
* Integrate securely with Google Drive
* Maintain an offline-first architecture
* Support Windows, Linux, and macOS
* Provide a modern and intuitive desktop experience

---

## ✨ Features

### 🖥️ Cross-Platform Desktop Application

Built with Electron to provide a consistent desktop experience across:

* Windows
* Linux
* macOS

The application can be distributed as native installers/packages for each supported operating system.

### ☁️ Google Drive Integration

Nexora Event Tracker integrates with Google Drive to allow administrators to securely access spreadsheets directly from the application.

Features include:

* OAuth 2.0 authentication
* PKCE-based authorization
* Google Picker integration
* Secure spreadsheet selection
* Direct file retrieval
* No external callback server required

### 📊 Excel Spreadsheet Processing

The application supports structured spreadsheet workflows for event management.

It can process data from:

* **Form 1** — Student consent / registration information
* **Form 2** — Event participation / certificate information

Imported records can then be processed and stored in the local database.

### 🗄️ Offline-First Local Database

Nexora uses **SQLite** through `better-sqlite3` for local data persistence.

This provides:

* Fast database operations
* Offline access
* Local data storage
* Reduced network dependency
* Reliable desktop performance

Student and event records remain stored locally rather than requiring a continuously connected cloud database.

### 🔎 Student Search & Event Tracking

Administrators can search student records using identifiers such as:

* USN
* Student name
* Branch
* Email
* Phone number

Associated event participation and achievement information can then be viewed from the student's record.

### 🎨 Modern User Interface

The interface is built using:

* Next.js
* React
* Tailwind CSS
* TypeScript

The application focuses on:

* Clean navigation
* Responsive layouts
* Fast interactions
* Minimal visual clutter
* Consistent UI components

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │     Nexora UI        │
                    │ Next.js + React      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Electron Runtime   │
                    │   Main Process       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
       │ SQLite DB   │  │ Google APIs │  │ File System  │
       │ better-     │  │ Drive /     │  │ Local Files  │
       │ sqlite3     │  │ Picker      │  │ & Exports    │
       └─────────────┘  └─────────────┘  └──────────────┘
```

### Data Flow

```text
Google Drive
     │
     ▼
Google OAuth + PKCE
     │
     ▼
Google Picker
     │
     ▼
Excel File
     │
     ▼
Spreadsheet Parser
     │
     ▼
Data Validation
     │
     ▼
SQLite Database
     │
     ▼
Nexora Dashboard
     │
     ▼
Student / Event Records
```

---

# 🛠️ Technology Stack

| Layer             | Technology        |
| ----------------- | ----------------- |
| Desktop Framework | Electron          |
| Frontend          | Next.js + React   |
| Language          | TypeScript        |
| Styling           | Tailwind CSS      |
| Database          | SQLite            |
| Database Driver   | better-sqlite3    |
| Cloud Storage     | Google Drive      |
| File Selection    | Google Picker API |
| Authentication    | OAuth 2.0 + PKCE  |
| Packaging         | electron-builder  |
| Package Manager   | npm               |

---

# 📁 Project Structure

```text
NexoraEventTracker/
│
├── public/
│   └── eventlogo-removebg-preview.png
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── ...
│
├── database/
│   └── ...
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

> The exact directory structure may evolve as the application architecture develops.

---

# 🚀 Getting Started

## Prerequisites

Make sure the following software is installed:

* [Node.js](https://nodejs.org/) — v18 or later
* npm — included with Node.js
* Git

Verify your installation:

```bash
node --version
npm --version
git --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/kishanBhandary/NexoraEventTracker.git
```

### 2. Navigate to the project

```bash
cd NexoraEventTracker
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application

```bash
npm run dev
```

This starts the development environment with Next.js and Electron.

---

# 📦 Building for Production

Nexora Event Tracker uses **electron-builder** to generate production-ready desktop packages.

## Windows

Generate a Windows executable:

```bash
npm run dist:win
```

Depending on the electron-builder configuration, this can produce an `.exe` installer.

---

## Linux

Build Linux packages:

```bash
npm run dist:linux
```

Supported package formats can include:

```text
.AppImage
.deb
.rpm
```

---

## macOS

Build the macOS application:

```bash
npm run dist:mac
```

This generates the configured macOS distribution, such as:

```text
.dmg
```

---

## Build Output

Production artifacts are generated in:

```text
dist/
```

Example:

```text
dist/
├── Nexora Event Tracker Setup.exe
├── Nexora Event Tracker.AppImage
├── nexora-event-tracker.rpm
└── Nexora Event Tracker.dmg
```

---

# 🔐 Security

Security is a core part of the Nexora Event Tracker architecture.

## OAuth 2.0 + PKCE

The application uses **OAuth 2.0 with Proof Key for Code Exchange (PKCE)** for Google authentication.

This approach is designed for public desktop applications where a traditional client secret cannot be safely embedded in the application.

### Key security characteristics

* PKCE authorization flow
* No embedded Google client secret
* Short-lived authorization codes
* Secure token exchange
* Electron main-process authentication handling

---

## 🔄 Secure Loopback Callback

Instead of depending on an external callback server, the application uses a local loopback callback:

```text
Google Authorization
        │
        ▼
Google OAuth
        │
        ▼
127.0.0.1:<dynamic-port>
        │
        ▼
Electron Main Process
```

The callback uses a dynamically allocated local port managed by the Electron application.

This keeps the authentication callback local to the user's machine.

---

## 🔒 Electron Security Practices

The application is designed around Electron security best practices, including:

* Context isolation
* Preload-based API exposure
* Restricted renderer capabilities
* Main-process handling of privileged operations
* Controlled IPC communication
* No unnecessary Node.js access from the renderer

Sensitive operations such as filesystem access, database operations, and authentication-related processing should remain outside the renderer process.

---

# 🗃️ Offline-First Design

Nexora Event Tracker is designed to continue functioning without a constant internet connection.

```text
Internet Available
       │
       ├── Google Drive
       ├── OAuth
       └── File Import
       
              ↓

       Local Processing

              ↓

        SQLite Database

              ↓

       Offline Application
```

Internet access is primarily required for cloud-dependent operations such as Google authentication and retrieving files from Google Drive.

Once the required data has been imported, the application can operate against its local SQLite database.

---

# 📈 Event Management Workflow

A typical workflow looks like this:

```text
1. Authenticate with Google
          ↓
2. Open Google Drive Picker
          ↓
3. Select spreadsheet
          ↓
4. Download spreadsheet
          ↓
5. Validate spreadsheet structure
          ↓
6. Process Form 1 / Form 2 data
          ↓
7. Store records in SQLite
          ↓
8. Search students
          ↓
9. View event participation
          ↓
10. Manage local records
```

---

# ⚡ Performance

The application is optimized for desktop usage by combining:

* Local SQLite database operations
* Native Electron processes
* Efficient React rendering
* Local data access
* Minimal network dependency
* Optimized spreadsheet processing

This allows frequently accessed student and event information to be retrieved without making repeated network requests.

---

# 🌐 Supported Platforms

| Platform | Distribution                |
| -------- | --------------------------- |
| Windows  | `.exe`                      |
| Linux    | `.AppImage`, `.deb`, `.rpm` |
| macOS    | `.dmg`                      |

---

# 🧪 Development

Run the application in development mode:

```bash
npm run dev
```

Before creating a production release, verify:

```bash
npm run build
```

Then generate the platform-specific package:

```bash
npm run dist:win
```

or:

```bash
npm run dist:linux
```

or:

```bash
npm run dist:mac
```

---

# 🤝 Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Test the application
5. Commit your changes

```bash
git commit -m "feat: add your feature"
```

6. Push the branch

```bash
git push origin feature/your-feature
```

7. Open a Pull Request

For bugs and feature requests, please use the project's issue tracker.

**Issues:**
https://github.com/kishanBhandary/NexoraEventTracker/issues

---

# 🗺️ Roadmap

Potential future improvements include:

* [ ] Advanced analytics dashboard
* [ ] Event-wise statistics
* [ ] Student achievement reports
* [ ] Certificate tracking
* [ ] PDF report generation
* [ ] Excel export
* [ ] Automated duplicate detection
* [ ] Improved import validation
* [ ] Automatic database backups
* [ ] Role-based access control
* [ ] Application auto-updates
* [ ] Improved audit logging
* [ ] Multi-college / multi-department support

---

# 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

---

# 👨‍💻 Author

**Kishan Bhandary**

Information Science & Engineering
AJ Institute of Engineering & Technology

GitHub:
https://github.com/kishanBhandary

---

<p align="center">
  <strong>Nexora Event Tracker</strong>
  <br />
  <sub>Built to make student event management faster, simpler, and more reliable.</sub>
</p>
