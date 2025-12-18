import { useEffect, useState } from 'react';
import { X, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export function UpdateNotification() {
  const [updateState, setUpdateState] = useState<
    'idle' | 'available' | 'downloading' | 'downloaded' | 'error'
  >('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Listen for update events from Electron
    window.electronAPI.update.onUpdateAvailable?.((info) => {
      console.log('Update available:', info);
      setUpdateInfo(info);
      setUpdateState('downloading');
      setIsVisible(true);
      setIsDismissed(false);
    });

    window.electronAPI.update.onUpdateDownloadProgress?.((progress) => {
      setDownloadProgress(Math.round(progress.percent));
      setUpdateState('downloading');
    });

    window.electronAPI.update.onUpdateDownloaded?.((info) => {
      console.log('Update downloaded:', info);
      setUpdateInfo(info);
      setUpdateState('downloaded');
      setIsVisible(true);
    });

    window.electronAPI.update.onUpdateError?.((err) => {
      console.error('Update error:', err);
      setUpdateState('error');
      setIsVisible(true);

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
        setUpdateState('idle');
      }, 5000);
    });
  }, []);

  // const handleInstallUpdate = async () => {
  //   await window.electronAPI.update.quitAndInstallUpdate();
  // };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      {/* Downloading state */}
      {updateState === 'downloading' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-80 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-bounce" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Downloading update
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Version {updateInfo?.version || '...'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {downloadProgress}% complete
                </span>
                <span className="text-neutral-400 dark:text-neutral-500 font-mono">
                  {downloadProgress < 100 ? 'Downloading...' : 'Finalizing...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Downloaded - Ready to install */}
      {updateState === 'downloaded' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-80 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Update ready to install
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Version {updateInfo?.version || '...'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Please restart to complete the installation.
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* <button
                onClick={() => handleInstallUpdate()}
                className="flex-1 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                Restart Now
              </button> */}
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {updateState === 'error' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-900 w-80 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Update failed
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Unable to download the update. Please check your connection and try again later.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
