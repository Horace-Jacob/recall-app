import { app, shell, BrowserWindow, ipcMain, nativeImage, Menu, Tray } from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { createMemoriesTable } from './database/memories';
import { createRecentSearchesTable } from './database/recent-searches';
import { registerMemoriesHandler } from './database/handlers/register-memories-handler';
import Database from 'better-sqlite3';
import { registerLocalSettingHandler } from './database/handlers/register-local-setting-handler';
import { createLocalSettingsTable } from './database/local-settings';
import log from 'electron-log';
import { startIPCServer } from './ipc-server/ipc-server';
import { processedIncomingWebData } from './data-processor/web-processor';
import { registerDbHandler } from './database/db';
import { registerSaveStorageHandler } from './auth/safe-storage';
import { registerHistoryProcessorHandler } from './data-processor/handlers/register-history-processor-handler';
import { registerSearchHandlers } from './data-processor/handlers/register-search-handler';
import 'dotenv/config';
import { registerSingleUrlHandler } from './data-processor/handlers/register-single-url-handler';
import { autoUpdater } from 'electron-updater';

log.transports.file.level = 'info';

// Configrue auto-updater logging
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// setup auto updater
function setupAutoUpdater() {
  // Check for updates every hour
  setInterval(
    () => {
      if (!is.dev) {
        autoUpdater.checkForUpdates();
      }
    },
    60 * 60 * 1000
  ); // 1 hour

  // When update is available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);

    // Send to renderer to show notification
    mainWindow?.webContents.send('update-available', info);

    // Auto-download the update
    autoUpdater.downloadUpdate();
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress.percent);
    mainWindow?.webContents.send('update-download-progress', progress);
  });

  // When update is downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);

    // Send to renderer to show "restart to install" notification
    mainWindow?.webContents.send('update-downloaded', info);
  });

  // Error handling
  autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    mainWindow?.webContents.send('update-error', err);
  });
}

// enable auto start on login
app.setLoginItemSettings({
  openAtLogin: true,
  path: process.execPath,
  args: ['--hidden']
});

// Open AI
if (!import.meta.env?.VITE_OPENAI_API_KEY) {
  log.warn('OpenAI key missing at startup');
}

// constants
const PROTOCOL_SCHEME = 'com.recall.app';

let mainWindow: BrowserWindow;
let dbInstance: Database.Database;
let tray: Tray;
let isQuitting = false;

// Registering the protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [
      path.resolve(process.argv[1])
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : { icon }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// tray icon
function createTray(): void {
  // Implementation for tray icon can be added here
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.show();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Memory Layer');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
const handleDeepLink = (url: string): void => {
  // Parse the URL to get the hash or query parameters
  // Supabase usually sends: electron-app://google-auth#access_token=...&refresh_token=...
  if (mainWindow) {
    // We send the raw URL to the renderer.
    // It's safer to parse token logic in the renderer where the Supabase client lives.
    mainWindow.webContents.send('supabase-auth-callback', url);
  }
};

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = commandLine.pop();
    if (url?.startsWith(`${PROTOCOL_SCHEME}://`)) {
      handleDeepLink(url);
    }
  });

  // App Ready
  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.recall.app');
    // Database initiliazation
    dbInstance = new Database(path.join(app.getPath('userData'), 'recall.db'));

    // Create Tray
    createTray();

    // Start ICP Server
    startIPCServer(dbInstance, processedIncomingWebData);

    // Table creations
    createMemoriesTable(dbInstance);
    createRecentSearchesTable(dbInstance);
    createLocalSettingsTable(dbInstance);

    // Register handlers
    registerDbHandler(dbInstance);
    registerMemoriesHandler(dbInstance);
    registerLocalSettingHandler(dbInstance);
    registerSaveStorageHandler();
    registerHistoryProcessorHandler(dbInstance);
    registerSearchHandlers();
    registerSingleUrlHandler(dbInstance);

    // Handle deep links
    app.on('open-url', (event, url) => {
      event.preventDefault();
      handleDeepLink(url);
    });

    ipcMain.on('open-external-url', (_, url) => {
      shell.openExternal(url);
    });

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    ipcMain.on('ping', () => console.log('pong'));

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('before-quit', () => {
      isQuitting = true;
    });

    // Setup auto-updater
    if (!is.dev) {
      setupAutoUpdater();
      setInterval(() => {
        autoUpdater.checkForUpdates();
      }, 5000);
    }
  });
}

app.on('window-all-closed', () => {});
