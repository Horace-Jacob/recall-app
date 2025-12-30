// electron/main/ipcHandlers.ts
// Example implementation stubs for your Electron main process

import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { canonicalizeUrl } from '../../utils';
import { saveToDb } from '../../database/savedb';
import { Worker } from 'worker_threads';
import Database from 'better-sqlite3';

interface BrowserInfo {
  id: string;
  name: string;
  available: boolean;
}

interface BookmarkData {
  title: string;
  url: string;
  favicon?: string;
}

/**
 * Register all IPC handlers for onboarding
 */
export function registerOnboardingHandlers(dbInstance: Database.Database): void {
  // Get available browsers
  ipcMain.handle('get-available-browsers', async (): Promise<BrowserInfo[]> => {
    const browsers: BrowserInfo[] = [
      {
        id: 'chrome',
        name: 'Google Chrome',
        available: await isBrowserInstalled('chrome')
      },
      {
        id: 'firefox',
        name: 'Mozilla Firefox',
        available: await isBrowserInstalled('firefox')
      },
      {
        id: 'edge',
        name: 'Microsoft Edge',
        available: await isBrowserInstalled('edge')
      },
      {
        id: 'brave',
        name: 'Brave',
        available: await isBrowserInstalled('brave')
      },
      {
        id: 'safari',
        name: 'Safari',
        available: await isBrowserInstalled('safari')
      }
    ];

    return browsers;
  });

  // Get bookmarks from a specific browser
  ipcMain.handle('get-bookmarks', async (_event, browserId: string): Promise<BookmarkData[]> => {
    try {
      const bookmarksPath = getBrowserBookmarksPath(browserId);

      if (!bookmarksPath || !fs.existsSync(bookmarksPath)) {
        throw new Error(`Bookmarks file not found for ${browserId}`);
      }

      const bookmarks = await parseBookmarks(browserId, bookmarksPath);
      return bookmarks;
    } catch (error) {
      throw error;
    }
  });

  // Process a single bookmark
  ipcMain.handle('process-bookmark', async (_event, url: string, userId: string): Promise<void> => {
    try {
      // Get database instance (you'll need to pass this or get it from your app context) // Adjust path as needed

      await processBookmarkWithAI(url, userId, dbInstance);
    } catch (error) {
      throw error;
    }
  });
}

/**
 * Check if a browser is installed on the system
 */
async function isBrowserInstalled(browserId: string): Promise<boolean> {
  const platform = os.platform();
  const homedir = os.homedir();

  try {
    const paths = getBrowserPaths(browserId, platform, homedir);

    for (const browserPath of paths) {
      if (fs.existsSync(browserPath)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get possible installation paths for a browser
 */
function getBrowserPaths(browserId: string, platform: string, _homedir: string): string[] {
  const paths: Record<string, Record<string, string[]>> = {
    chrome: {
      win32: [
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe')
      ],
      darwin: ['/Applications/Google Chrome.app'],
      linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']
    },
    firefox: {
      win32: [path.join(process.env.PROGRAMFILES || '', 'Mozilla Firefox\\firefox.exe')],
      darwin: ['/Applications/Firefox.app'],
      linux: ['/usr/bin/firefox']
    },
    edge: {
      win32: [
        path.join(process.env.PROGRAMFILES || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(
          process.env['PROGRAMFILES(X86)'] || '',
          'Microsoft\\Edge\\Application\\msedge.exe'
        )
      ],
      darwin: ['/Applications/Microsoft Edge.app'],
      linux: ['/usr/bin/microsoft-edge']
    },
    brave: {
      win32: [
        path.join(
          process.env.LOCALAPPDATA || '',
          'BraveSoftware\\Brave-Browser\\Application\\brave.exe'
        ),
        path.join(
          process.env.PROGRAMFILES || '',
          'BraveSoftware\\Brave-Browser\\Application\\brave.exe'
        )
      ],
      darwin: ['/Applications/Brave Browser.app'],
      linux: ['/usr/bin/brave-browser']
    },
    safari: {
      darwin: ['/Applications/Safari.app']
    }
  };

  return paths[browserId]?.[platform] || [];
}

/**
 * Get the bookmarks file path for a specific browser
 */
function getBrowserBookmarksPath(browserId: string): string | null {
  const platform = os.platform();
  const homedir = os.homedir();

  const bookmarkPaths: Record<string, Record<string, string>> = {
    chrome: {
      win32: path.join(
        homedir,
        'AppData',
        'Local',
        'Google',
        'Chrome',
        'User Data',
        'Default',
        'Bookmarks'
      ),
      darwin: path.join(
        homedir,
        'Library',
        'Application Support',
        'Google',
        'Chrome',
        'Default',
        'Bookmarks'
      ),
      linux: path.join(homedir, '.config', 'google-chrome', 'Default', 'Bookmarks')
    },
    firefox: {
      // Firefox uses SQLite database, more complex to parse
      win32: path.join(homedir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles'),
      darwin: path.join(homedir, 'Library', 'Application Support', 'Firefox', 'Profiles'),
      linux: path.join(homedir, '.mozilla', 'firefox')
    },
    edge: {
      win32: path.join(
        homedir,
        'AppData',
        'Local',
        'Microsoft',
        'Edge',
        'User Data',
        'Default',
        'Bookmarks'
      ),
      darwin: path.join(
        homedir,
        'Library',
        'Application Support',
        'Microsoft Edge',
        'Default',
        'Bookmarks'
      ),
      linux: path.join(homedir, '.config', 'microsoft-edge', 'Default', 'Bookmarks')
    },
    brave: {
      win32: path.join(
        homedir,
        'AppData',
        'Local',
        'BraveSoftware',
        'Brave-Browser',
        'User Data',
        'Default',
        'Bookmarks'
      ),
      darwin: path.join(
        homedir,
        'Library',
        'Application Support',
        'BraveSoftware',
        'Brave-Browser',
        'Default',
        'Bookmarks'
      ),
      linux: path.join(homedir, '.config', 'BraveSoftware', 'Brave-Browser', 'Default', 'Bookmarks')
    },
    safari: {
      darwin: path.join(homedir, 'Library', 'Safari', 'Bookmarks.plist')
    }
  };

  return bookmarkPaths[browserId]?.[platform] || null;
}

/**
 * Parse bookmarks from browser file
 */
async function parseBookmarks(browserId: string, bookmarksPath: string): Promise<BookmarkData[]> {
  const bookmarks: BookmarkData[] = [];

  try {
    // Chrome-based browsers (Chrome, Edge, Brave)
    if (['chrome', 'edge', 'brave'].includes(browserId)) {
      const data = fs.readFileSync(bookmarksPath, 'utf8');
      const bookmarksData = JSON.parse(data);

      // Recursively extract bookmarks from the bookmark tree
      const extractBookmarks = (node: any): void => {
        if (node.type === 'url') {
          bookmarks.push({
            title: node.name || node.url,
            url: node.url,
            favicon: node.favicon
          });
        } else if (node.children) {
          node.children.forEach(extractBookmarks);
        }
      };

      // Chrome stores bookmarks in bookmark_bar and other roots
      if (bookmarksData.roots) {
        Object.values(bookmarksData.roots).forEach((root: any) => {
          if (root.children) {
            root.children.forEach(extractBookmarks);
          }
        });
      }
    }

    // Firefox uses SQLite - you'll need a SQLite library
    // TODO: Implement Firefox bookmark parsing

    // Safari uses plist format - you'll need a plist parser
    // TODO: Implement Safari bookmark parsing

    return bookmarks;
  } catch (error) {
    throw new Error(`Failed to parse bookmarks from ${browserId}`);
  }
}

/**
 * Process a bookmark URL with AI
 * Uses the same worker-based content extraction as history processing
 */
async function processBookmarkWithAI(url: string, userId: string, dbInstance: any): Promise<void> {
  try {
    // Use the content-fetch-worker for consistent extraction
    const result = await fetchBookmarkContent(url);

    if (!result.success || !result.content) {
      if (result.error) {
        throw new Error(result.error);
      }
      throw new Error('Failed to extract content');
    }

    // Check minimum content length (same as history processing)
    const MIN_CONTENT_LENGTH = 400;
    if (result.content.contentLength < MIN_CONTENT_LENGTH) {
      throw new Error('Content too short - Not enough meaningful content');
    }

    // Save to database using the same method as history processing
    const canonicalUrl = canonicalizeUrl(url);

    await saveToDb(
      dbInstance,
      {
        url: url,
        canonicalUrl: canonicalUrl,
        title: result.content.title || url,
        content: result.content.content
      },
      'bookmark-import',
      userId
    );
  } catch (error: any) {
    // Enhanced error handling with user-friendly messages
    if (error.message) {
      throw error; // Already has a message, pass it through
    }

    // Network errors
    if (error.code === 'ENOTFOUND') {
      throw new Error('Site not found - Invalid URL');
    } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
      throw new Error('Connection timeout - Site took too long to respond');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Connection refused - Site is not accessible');
    } else if (error.code === 'ECONNRESET') {
      throw new Error('Connection reset - Site closed the connection');
    } else if (
      error.code === 'CERT_HAS_EXPIRED' ||
      error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    ) {
      throw new Error('SSL certificate error - Site security certificate is invalid');
    } else {
      throw new Error('Failed to process bookmark - ' + (error.message || 'Unknown error'));
    }
  }
}

/**
 * Fetch bookmark content using worker thread (same as history processing)
 */
async function fetchBookmarkContent(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'content-fetch-worker.js');
    const worker = new Worker(workerPath);

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Content extraction timeout'));
    }, 15000); // 15 second timeout for bookmarks

    worker.on('message', (result: any) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(result);
    });

    worker.on('error', (error: Error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    });

    worker.postMessage({ url, index: 0 });
  });
}
