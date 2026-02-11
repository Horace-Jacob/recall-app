import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export function ensureNativeMessagingSetup() {
  if (process.platform !== 'win32') return;

  try {
    const memoryLayerDir = path.join(app.getPath('userData'));
    const installDir = path.dirname(app.getPath('exe'));
    const nativeHostPath = path.join(installDir, 'native-host.exe');

    const HOST_NAME = 'com.recall.native_host';
    const CHROME_EXTENSION_ID = 'jkoekcdligppajejbhfofemcjnbhljik';
    const FIREFOX_EXTENSION_ID = 'memory-layer@lon.com';

    // Ensure directory exists
    if (!fs.existsSync(memoryLayerDir)) {
      fs.mkdirSync(memoryLayerDir, { recursive: true });
    }

    // ========================================
    // Create/Update Chrome/Edge manifest
    // ========================================
    const chromeManifestPath = path.join(memoryLayerDir, 'native-host-manifest.json');
    const chromeManifest = {
      name: HOST_NAME,
      description: 'Memory Layer Desktop Native Messaging Host',
      path: nativeHostPath,
      type: 'stdio',
      allowed_origins: [`chrome-extension://${CHROME_EXTENSION_ID}/`]
    };

    fs.writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2));

    // ========================================
    // Create/Update Firefox manifest
    // ========================================
    const firefoxManifestPath = path.join(memoryLayerDir, 'firefox-host-manifest.json');
    const firefoxManifest = {
      name: HOST_NAME,
      description: 'Memory Layer Desktop Native Messaging Host',
      path: nativeHostPath,
      type: 'stdio',
      allowed_extensions: [FIREFOX_EXTENSION_ID]
    };

    fs.writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2));

    // ========================================
    // Register all registry keys (no CMD flash)
    // ========================================
    const { exec } = require('child_process');

    const registryCommands = [
      // Chrome
      `reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}" /ve /d "${chromeManifestPath}" /f`,
      // Edge
      `reg add "HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${HOST_NAME}" /ve /d "${chromeManifestPath}" /f`,
      // Firefox
      `reg add "HKCU\\Software\\Mozilla\\NativeMessagingHosts\\${HOST_NAME}" /ve /d "${firefoxManifestPath}" /f`
    ];

    registryCommands.forEach((command) => {
      exec(command, { windowsHide: true }, (error) => {
        if (error) {
          console.error('Registry update failed:', error);
        }
      });
    });

    console.log('Native messaging setup completed for Chrome, Edge, and Firefox');
  } catch (err) {
    console.error('Failed to setup native messaging:', err);
  }
}
