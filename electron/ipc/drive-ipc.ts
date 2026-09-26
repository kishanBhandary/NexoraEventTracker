import { ipcMain, BrowserWindow, shell } from "electron";
import { google } from "googleapis";
import Store from "electron-store";
import path from "path";
import os from "os";
import fs from "fs";
import { createWriteStream } from "fs";
import dotenv from "dotenv";

import { app } from "electron";

const envPath = app.isPackaged 
  ? path.join(process.resourcesPath, '.env')
  : path.join(app.getAppPath(), '.env');

dotenv.config({ path: envPath });

const store = new Store() as any;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
);

// We will use a standard out-of-band flow or a custom local server for OAuth
// Actually, urn:ietf:wg:oauth:2.0:oob is deprecated for desktop apps.
// Better to use a custom loopback server. Let's do a simple one.
import http from 'http';
import url from 'url';

let authServer: http.Server | null = null;

async function authenticate(): Promise<void> {
  const token = store.get("drive_token");
  if (token) {
    oauth2Client.setCredentials(token as any);
    return;
  }

  return new Promise((resolve, reject) => {
    // start local server
    const redirectUri = 'http://localhost:3002/oauth2callback';
    const tempClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    authServer = http.createServer(async (req, res) => {
      try {
        if (req.url?.indexOf('/oauth2callback') !== -1) {
          const qs = new url.URL(req.url || '', 'http://localhost:3002').searchParams;
          const code = qs.get('code');
          res.end('Authentication successful! You can close this window and return to the app.');
          authServer?.close();
          authServer = null;
          
          if (code) {
            const { tokens } = await tempClient.getToken(code);
            oauth2Client.setCredentials(tokens);
            store.set("drive_token", tokens);
            resolve();
          } else {
            reject(new Error('No code found'));
          }
        }
      } catch (e) {
        reject(e);
      }
    }).listen(3002, () => {
      const authUrl = tempClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
      });
      
      shell.openExternal(authUrl);
      
      // Since it's in the system browser, we don't know if the user closed the window.
      // The local server will just wait until it times out or succeeds.
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error('Auth server is already running. Please close the existing authentication window and try again.'));
      } else {
        reject(err);
      }
    });
  });
}

ipcMain.handle("drive:auth", async () => {
  try {
    await authenticate();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});


let pickerServer: http.Server | null = null;


ipcMain.handle("drive:pick", async () => {
  let accessToken = store.get("drive_token")?.access_token;
  try {
    const res = await oauth2Client.getAccessToken();
    if (res?.token) {
      accessToken = res.token;
    }
  } catch (e) {
    console.warn("Failed to get fresh access token, using stored", e);
  }

  return new Promise((resolve, reject) => {
    if (pickerServer) {
      pickerServer.close();
    }


    
    if (!accessToken) {
      resolve(null);
      return;
    }
    
    pickerServer = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      
      if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Select from Google Drive</title>
            <script src="https://apis.google.com/js/api.js"></script>
            <script>
              const accessToken = "${accessToken}";
              const developerKey = "${process.env.GOOGLE_API_KEY || ''}";
              const appId = "${(process.env.GOOGLE_CLIENT_ID || '').split('-')[0]}";
              
              function onApiLoad() {
                gapi.load('picker', { 'callback': onPickerApiLoad });
              }
              

              function onPickerApiLoad() {
                const view = new google.picker.View(google.picker.ViewId.SPREADSHEETS);
                let pickerBuilder = new google.picker.PickerBuilder()
                  .addView(view)
                  .setOAuthToken(accessToken);
                  
                if (developerKey) {
                  pickerBuilder = pickerBuilder.setDeveloperKey(developerKey);
                }
                if (appId) {
                  pickerBuilder = pickerBuilder.setAppId(appId);
                }
                
                const picker = pickerBuilder.setCallback(pickerCallback).build();
                picker.setVisible(true);
              }

              
              function pickerCallback(data) {
                if (data.action == google.picker.Action.PICKED) {
                  const doc = data.docs[0];
                  fetch('/callback?fileId=' + encodeURIComponent(doc.id) + '&name=' + encodeURIComponent(doc.name))
                    .then(() => {
                      document.body.innerHTML = '<h2>File selected! You can close this tab and return to the application.</h2>';
                    });
                } else if (data.action == google.picker.Action.CANCEL) {
                  fetch('/callback?cancel=true').then(() => {
                    document.body.innerHTML = '<h2>Selection cancelled. You can close this tab and return to the application.</h2>';
                  });
                }
              }
            </script>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; }
            </style>
          </head>
          <body onload="onApiLoad()">
            <h2>Opening Google Picker...</h2>
          </body>
          </html>
        `);
      } else if (parsedUrl.pathname === '/callback') {
        const fileId = parsedUrl.query.fileId as string;
        const name = parsedUrl.query.name as string;
        const cancel = parsedUrl.query.cancel;
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        
        pickerServer?.close();
        pickerServer = null;
        
        if (fileId) {
          resolve({ id: fileId, name: name });
        } else {
          resolve(null);
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    pickerServer.listen(3003, () => {
      shell.openExternal('http://localhost:3003');
    }).on('error', (err: any) => {
      console.error('Picker server error', err);
      resolve(null);
    });
  });
});

ipcMain.handle("drive:download", async (_, fileId: string, fileName: string) => {
  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Check if it's a google sheet
    const fileInfo = await drive.files.get({ fileId, fields: 'mimeType' });
    const isGoogleSheet = fileInfo.data.mimeType === 'application/vnd.google-apps.spreadsheet';
    
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${fileName}.xlsx`);
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
    console.error(e);
    return null;
  }
});

