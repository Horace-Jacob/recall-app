import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { LocalSetting, QueryDBParams } from '../main/types';

// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('electronAPI', {
      db: {
        query: (sql: string, params: QueryDBParams[] = []) =>
          ipcRenderer.invoke('db-query', sql, params),
        deleteMemoryById: (id: number) => ipcRenderer.invoke('delete-memory', id)
      },
      auth: {
        onAuthCallback: (callback: (url: string) => void) => {
          ipcRenderer.on('supabase-auth-callback', (_event, url) => callback(url));
        },

        openExternalUrl: (url: string) => ipcRenderer.send('open-external-url', url),
        encrypt: (key: string, value: string) =>
          ipcRenderer.invoke('safe-storage-encrypt', key, value),
        decrypt: (key: string, value: string) =>
          ipcRenderer.invoke('safe-storage-decrypt', key, value)
      },
      local: {
        getLocalSetting: () => ipcRenderer.invoke('get-local-setting'),
        updateLocalSetting: (settings: Partial<LocalSetting>) =>
          ipcRenderer.invoke('update-local-setting', settings),
        updateLocalProfileId: (userId: string) =>
          ipcRenderer.invoke('update-local-profile-id', userId),
        resetLocalSetting: () => ipcRenderer.invoke('reset-local-setting'),
        skipOnboarding: () => ipcRenderer.invoke('skip-onboarding')
      },
      browser: {
        getBrowserHistory: (days: number) => ipcRenderer.invoke('get-browser-history', days),

        // Start processing (non-blocking, returns immediately)
        startProcessingHistory: (userId: string, entries: any[]) =>
          ipcRenderer.send('browser:startProcessingHistory', userId, entries),

        // Progress listener
        onProcessingProgress: (callback: (progress: any) => void) => {
          const listener = (_event: any, progress: any): any => callback(progress);
          ipcRenderer.on('browser:processingProgress', listener);
        },
        offProcessingProgress: (_callback: (progress: any) => void) => {
          ipcRenderer.removeAllListeners('browser:processingProgress');
        },

        // Complete listener
        onProcessingComplete: (callback: (result: any) => void) => {
          const listener = (_event: any, result: any): any => callback(result);
          ipcRenderer.on('browser:processingComplete', listener);
        },
        offProcessingComplete: (_callback: (result: any) => void) => {
          ipcRenderer.removeAllListeners('browser:processingComplete');
        },

        // Error listener
        onProcessingError: (callback: (error: any) => void) => {
          const listener = (_event: any, error: any): any => callback(error);
          ipcRenderer.on('browser:processingError', listener);
        },
        offProcessingError: (_callback: (error: any) => void) => {
          ipcRenderer.removeAllListeners('browser:processingError');
        }
      },
      search: {
        semanticSearch: (userId: string, query: string) =>
          ipcRenderer.invoke('search:semanticSearch', userId, query),

        getStats: (userId: string) => ipcRenderer.invoke('search:getStats', userId),
        getRecentSearches: (userId: string) =>
          ipcRenderer.invoke('search:getRecentSearches', userId)
      },
      ui: {
        processSingleUrl: (url: string) => ipcRenderer.invoke('process-single-url', url)
      },
      update: {
        checkForUpdates: () => {
          ipcRenderer.send('check-for-updates');
        },
        onUpdateAvailable: (callback: (info: any) => void) => {
          ipcRenderer.on('update-available', (_, info) => callback(info));
        },
        onUpdateDownloadProgress: (callback: (progress: any) => void) => {
          ipcRenderer.on('update-download-progress', (_, progress) => callback(progress));
        },
        onUpdateDownloaded: (callback: (info: any) => void) => {
          ipcRenderer.on('update-downloaded', (_, info) => callback(info));
        },
        onUpdateError: (callback: (err: any) => void) => {
          ipcRenderer.on('update-error', (_, err) => callback(err));
        },
        quitAndInstall: () => {
          ipcRenderer.invoke('quit-and-install');
        }
      },
      bookmark: {
        getAvailableBrowsers: () => {
          return ipcRenderer.invoke('get-available-browsers');
        },

        /**
         * Get bookmarks from a specific browser
         */
        getBookmarks: (browserId: string) => {
          return ipcRenderer.invoke('get-bookmarks', browserId);
        },

        /**
         * Process a single bookmark URL
         */
        processBookmark: (url: string, userId: string) => {
          return ipcRenderer.invoke('process-bookmark', url, userId);
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
