# 📊 Nexora Event Tracker

**Nexora Event Tracker** is a powerful, cross-platform desktop application designed to streamline event management, spreadsheet processing, and local database tracking. Built with modern web technologies and packaged via Electron, it delivers a secure and responsive desktop experience.

![Event Tracker Interface](public/eventlogo-removebg-preview.png)

## ✨ Key Features

- **🚀 Native Desktop Experience:** Fully cross-platform (Windows, macOS, Linux) with a seamless, native feel.
- **☁️ Google Drive Integration:** Natively connects to Google Drive using the secure OAuth 2.0 PKCE flow. Features the official Google Picker UI to seamlessly browse and download Excel files directly into the app.
- **📂 Excel Spreadsheet Import:** Advanced parsing of "Form 1" and "Form 2" spreadsheets.
- **🗄️ Local SQLite Database:** Completely offline-first capability using `better-sqlite3`. Your data remains fully secure and stored locally on your machine.
- **🎨 Modern UI/UX:** Built with Next.js, React, and Tailwind CSS for a beautiful, responsive user interface.

## 🛠️ Technology Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React), [Tailwind CSS](https://tailwindcss.com/)
- **Backend / Desktop:** [Electron](https://www.electronjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Database:** [SQLite](https://sqlite.org/) via `better-sqlite3`
- **Google API:** Official Google Drive & Google Picker APIs (OAuth 2.0 Desktop Flow)
- **Bundler:** [electron-builder](https://www.electron.build/)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kishanBhandary/NexoraEventTracker.git
   cd NexoraEventTracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *This command runs Next.js and Electron concurrently with live-reloading enabled.*

## 📦 Building for Production

To package the application into a standalone executable for your operating system, use `electron-builder`:

- **Build for Windows (`.exe`):**
  ```bash
  npm run dist:win
  ```
- **Build for Linux (`.AppImage`, `.deb`, `.rpm`):**
  ```bash
  npm run dist:linux
  ```
- **Build for macOS (`.dmg`):**
  ```bash
  npm run dist:mac
  ```

The compiled binaries will be output to the `dist/` folder.

## 🔒 Security & OAuth Configuration
This application utilizes a secure **PKCE (Proof Key for Code Exchange)** OAuth 2.0 flow tailored specifically for Desktop applications.
- **No Client Secret Required:** The application strictly uses PKCE, meaning there are no sensitive `client_secret` strings exposed in the binary.
- **Secure Loopback Callback:** Authentication redirects to a dynamic `127.0.0.1` port managed entirely by the Electron main process, eliminating the need for external callback servers.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/kishanBhandary/NexoraEventTracker/issues).

## 📝 License
This project is licensed under the MIT License.
