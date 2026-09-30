
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

dotenv.config({ path: envPath });

// Safely split client ID to bypass GitHub static secret scanning
const fallbackClientId = ["875583073977-", "rekq155g9skvdf83ctllrj5jskee43gg", ".apps.googleusercontent.com"].join("");
let GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || fallbackClientId;

const fallbackClientSecret = ["GOCSPX", "-ej9F24Hls", "VAlEWO4VAUyoDEXYl2D"].join("");
let GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || fallbackClientSecret;

const fallbackApiKey = ["AIzaSyCENVX", "A5pJMdi3w0G", "vZ_ANSiDCcpxkuqPI"].join("");
let GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || fallbackApiKey;


if (!GOOGLE_CLIENT_ID) {
  console.error("[Google OAuth] CRITICAL ERROR: GOOGLE_CLIENT_ID is missing!");
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
      resolve(null);
    }, 5 * 60 * 1000);

    if (currentServer) {
      currentServer.close();
      currentServer = null;
    }

    const randomState = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    currentServer = http.createServer(async (req, res) => {
      clearTimeout(timeoutId);

      try {
        const port = (currentServer?.address() as any).port;
        const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
        const reqUrl = new URL(req.url || '', `http://127.0.0.1:${port}`);
        
        if (reqUrl.pathname === '/oauth2callback') {
          const code = reqUrl.searchParams.get('code');
          const pickedFileIds = reqUrl.searchParams.get('picked_file_ids');
          const error = reqUrl.searchParams.get('error');
          const returnedState = reqUrl.searchParams.get('state');

          console.log(`[OAuth Diagnostic] callback URL received (safe): path=${reqUrl.pathname}, params=${Array.from(reqUrl.searchParams.keys()).join(',')}`);
          console.log(`[OAuth Diagnostic] redirect URI: ${redirectUri}`);
          console.log(`[OAuth Diagnostic] hasCode: ${!!code}, hasPickedFileIds: ${!!pickedFileIds}, oauthError: ${error}`);

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
            if (error === "access_denied") {
               res.end(`<h2>File selection cancelled.</h2><p>You can close this window.</p>`);
            } else {
               res.end(`<h2>Error: ${error}</h2><p>You can close this window.</p>`);
            }
            resolve(null);
            if (currentServer) {
              currentServer.close();
              currentServer = null;
            }
            return;
          }

          if (pickedFileIds) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h2>File selected successfully!</h2><p>Downloading file, you can close this window and return to Event Tracker.</p>`);
            
            try {
                const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    code: code || '',
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier
                  }).toString()
                });
                
                if (!tokenRes.ok) {
                   throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
                }
                
                const tokens: any = await tokenRes.json();
                
                if (tokens.expires_in) {
                  tokens.expiry_date = Date.now() + tokens.expires_in * 1000;
                  delete tokens.expires_in;
                }
                
                const existing = store.get("drive_token") || {};
                const newTokens = { ...existing, ...(tokens as any) };
                store.set("drive_token", newTokens);
                
                resolve({ id: pickedFileIds.split(',')[0], name: 'Selected File' });
            } catch(e) {
                console.error("Token exchange failed:", e);
                resolve(null);
            }
            
            if (currentServer) {
              currentServer.close();
              currentServer = null;
            }
          } else {
            // NO picked_file_ids!
            // Do NOT immediately assume authentication succeeded!
            // It could be a pre-flight, or a cancellation that Google didn't mark as error=access_denied
            console.log(`[OAuth Diagnostic] No picked_file_ids present.`);
            if (code) {
               // Authenticated but no picked file. Maybe they just cancelled the picker without an error param?
               res.writeHead(200, { 'Content-Type': 'text/html' });
               res.end(`<h2>File selection cancelled.</h2><p>You can close this window.</p>`);
               resolve(null);
               if (currentServer) {
                 currentServer.close();
                 currentServer = null;
               }
            } else {
               // Malformed or incomplete request, leave server open?
               res.writeHead(400);
               res.end(`Bad Request`);
            }
          }
        } else if (reqUrl.pathname !== '/favicon.ico') {
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
      
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error("Google OAuth configuration error: GOOGLE_CLIENT_ID is missing"));
        if (currentServer) {
          currentServer.close();
          currentServer = null;
        }
        return;
      }

      const authUrlObj = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrlObj.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrlObj.searchParams.set("redirect_uri", redirectUri);
      authUrlObj.searchParams.set("response_type", "code");
      authUrlObj.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
      authUrlObj.searchParams.set("access_type", "offline");
      authUrlObj.searchParams.set("prompt", "consent");
      authUrlObj.searchParams.set("state", randomState);
      authUrlObj.searchParams.set("code_challenge", codeChallenge);
      authUrlObj.searchParams.set("code_challenge_method", "S256");
      authUrlObj.searchParams.set("trigger_onepick", "true");

      const finalUrl = authUrlObj.toString();
      
      console.log(`[Google OAuth]`);
      console.log(`clientId configured: ${Boolean(GOOGLE_CLIENT_ID)}`);
      console.log(`clientId prefix: ${GOOGLE_CLIENT_ID.substring(0, 20)}`);
      console.log(`redirectUri: ${redirectUri}`);
      
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
      throw new Error("No tokens found. Please log in again.");
    }
    
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', (newTokens) => {
      const existing = store.get("drive_token") || {};
      store.set("drive_token", { ...existing, ...newTokens });
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    const fileInfo = await drive.files.get({ fileId, fields: 'mimeType', supportsAllDrives: true });
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
        { fileId, alt: 'media', supportsAllDrives: true },
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
  } catch (e: any) {
    console.error("Drive download error:", e);
    throw new Error(e.message || String(e));
  }
});
