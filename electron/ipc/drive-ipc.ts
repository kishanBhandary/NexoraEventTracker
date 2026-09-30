import { ipcMain, BrowserWindow, shell, app } from "electron";
import { google } from "googleapis";
import Store from "electron-store";
import path from "path";
import os from "os";
import { spawn } from "child_process";

import fs, { createWriteStream } from "fs";
import dotenv from "dotenv";
import http from 'http';
import url from 'url';
import crypto from "crypto";

const envPath = app.isPackaged 
  ? path.join(process.resourcesPath, '.env')
  : path.resolve(__dirname, '../../.env');

const envResult = dotenv.config({ path: envPath });

let GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oauthJsonPath = path.join(__dirname, '../oauth.json');
if (fs.existsSync(oauthJsonPath)) {
  try {
    const oauthConfig = JSON.parse(fs.readFileSync(oauthJsonPath, 'utf8'));
    if (oauthConfig.GOOGLE_CLIENT_ID) GOOGLE_CLIENT_ID = oauthConfig.GOOGLE_CLIENT_ID;
    if (oauthConfig.GOOGLE_CLIENT_SECRET) GOOGLE_CLIENT_SECRET = oauthConfig.GOOGLE_CLIENT_SECRET;
    console.log("[Google OAuth] Successfully loaded configuration from internal oauth.json");
  } catch (e) {
    console.error("Failed to parse oauth.json", e);
  }
}

if (!GOOGLE_CLIENT_ID) {
  console.error("[Google OAuth] CRITICAL ERROR: GOOGLE_CLIENT_ID is missing!");
  console.error("Attempted to load .env from:", envPath);
  console.error("Attempted to load config from:", oauthJsonPath);
}

const store = new Store() as any;


function safeOpenExternal(targetUrl: string) {
  if (process.platform === 'linux' && process.env.APPIMAGE) {
    const env = { ...process.env };
    delete env.APPIMAGE;
    delete env.APPDIR;
    delete env.LD_LIBRARY_PATH;
    if (process.env.LD_LIBRARY_PATH_ORIG) {
      env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH_ORIG;
    }
    
    const child = spawn('xdg-open', [targetUrl], { env, detached: true, stdio: 'ignore' });
    child.unref();
    child.on('error', (err) => {
      console.error("Failed to spawn xdg-open:", err);
      shell.openExternal(targetUrl);
    });
  } else {
    shell.openExternal(targetUrl);
  }
}

let currentServer: http.Server | null = null;



ipcMain.handle("drive:pick", async () => {
  return new Promise((resolve, reject) => {
    let timeoutId = setTimeout(() => {
      if (currentServer) {
        currentServer.close();
        currentServer = null;
      }
      resolve(null); // Timeout
    }, 5 * 60 * 1000); // 5 minutes timeout

    if (currentServer) {
      currentServer.close();
      currentServer = null;
    }

    const randomState = crypto.randomBytes(16).toString('hex');

    currentServer = http.createServer(async (req, res) => {
      clearTimeout(timeoutId);

      try {
        const reqUrl = url.parse(req.url || '', true);
        if (reqUrl.pathname === '/oauth2callback') {
          const code = reqUrl.query.code as string;
          const pickedFileIds = reqUrl.query.picked_file_ids as string;
          const error = reqUrl.query.error as string;
          const returnedState = reqUrl.query.state as string;

          if (returnedState !== randomState) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h2>Error: Invalid State</h2><p>CSRF verification failed.</p>`);
            resolve(null);
            if (currentServer) {
              currentServer.close();
              currentServer = null;
            }
            return;
          }

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h2>Error: ${error}</h2><p>You can close this window.</p>`);
            resolve(null);
          } else if (pickedFileIds) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h2>File selected successfully!</h2><p>You can close this window and return to Event Tracker.</p>`);
            resolve({ id: pickedFileIds.split(',')[0], name: 'Selected File' });
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h2>Authentication successful, but no file selected.</h2><p>You can close this window.</p>`);
            resolve(null);
          }

          if (code) {
             try {
                const port = (currentServer?.address() as any).port;
                const tempClient = new google.auth.OAuth2(
                  GOOGLE_CLIENT_ID,
                  GOOGLE_CLIENT_SECRET,
                  `http://127.0.0.1:${port}/oauth2callback`
                );
                const { tokens } = await tempClient.getToken(code);
                
                const existing = store.get("drive_token") || {};
                const newTokens = { ...existing, ...tokens };
                store.set("drive_token", newTokens);
             } catch(e) {
                console.error("Token exchange failed:", e);
             }
          }
          
          if (currentServer) {
            currentServer.close();
            currentServer = null;
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      } catch (e) {
        res.writeHead(500);
        res.end("Internal Server Error");
        resolve(null);
      }
    });

currentServer.listen(0, '127.0.0.1', () => {
      const port = (currentServer?.address() as any).port;
      const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
      
      const clientId = GOOGLE_CLIENT_ID;
      if (!clientId) {
        reject(new Error("Google OAuth configuration error: GOOGLE_CLIENT_ID is missing"));
        if (currentServer) {
          currentServer.close();
          currentServer = null;
        }
        return;
      }

      const authUrlObj = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrlObj.searchParams.set("client_id", clientId);
      authUrlObj.searchParams.set("redirect_uri", redirectUri);
      authUrlObj.searchParams.set("response_type", "code");
      authUrlObj.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
      authUrlObj.searchParams.set("access_type", "offline");
      authUrlObj.searchParams.set("state", randomState);
      authUrlObj.searchParams.set("trigger_onepick", "true");

      const finalUrl = authUrlObj.toString();
      
      console.log(`[Google OAuth]`);
      console.log(`clientId configured: ${Boolean(clientId)}`);
      console.log(`clientId prefix: ${clientId.substring(0, 20)}`);
      console.log(`redirectUri: ${redirectUri}`);
      console.log(`scope: https://www.googleapis.com/auth/drive.file`);
      
      safeOpenExternal(finalUrl);
    }).on('error', (err: any) => {
      console.error('Callback server error', err);
      resolve(null);
    });
  });
});

ipcMain.handle("drive:download", async (_, fileId: string, fileName: string) => {
  try {
    const tokens = store.get("drive_token");
    if (!tokens) {
      console.error("No tokens found for drive:download");
      return null;
    }
    
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', (newTokens) => {
      const existing = store.get("drive_token") || {};
      store.set("drive_token", { ...existing, ...newTokens });
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Check if it's a google sheet
    const fileInfo = await drive.files.get({ fileId, fields: 'mimeType' });
    const isGoogleSheet = fileInfo.data.mimeType === 'application/vnd.google-apps.spreadsheet';
    
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);
    const dest = createWriteStream(tempPath);
    
    if (isGoogleSheet) {
      const res = await drive.files.export(
        { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { responseType: 'stream' }
      );
      await new Promise((resolve, reject) => {
        res.data
          .on('end', () => resolve(tempPath))
          .on('error', (err: any) => reject(err))
          .pipe(dest);
      });
    } else {
      const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      await new Promise((resolve, reject) => {
        res.data
          .on('end', () => resolve(tempPath))
          .on('error', (err: any) => reject(err))
          .pipe(dest);
      });
    }
    return tempPath;
  } catch (e) {
    console.error("Drive download error:", e);
    return null;
  }
});
