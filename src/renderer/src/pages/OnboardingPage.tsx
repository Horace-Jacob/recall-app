// import { Loading } from '@renderer/components/Loading';
// import { useAuth } from '@renderer/context/AuthContext';
// import { useBrowserHistory } from '@renderer/hooks/useBrowserHistory';
// import { type FC, useEffect, useState } from 'react';
// import {
//   Sparkles,
//   Globe,
//   Shield,
//   Zap,
//   ArrowRight,
//   Check,
//   AlertCircle,
//   FileText,
//   Clock,
//   Chromium
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { skipOnboarding } from '@renderer/services/onBoardingService';

// export const OnBoardingPage: FC = () => {
//   const { session, loading } = useAuth();
//   const {
//     importHistory,
//     loading: importing,
//     error,
//     result,
//     progress,
//     processingComplete
//   } = useBrowserHistory();
//   const [currentStep, setCurrentStep] = useState<'welcome' | 'importing' | 'success'>('welcome');
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (processingComplete && currentStep === 'importing') {
//       setCurrentStep('success');

//       // Redirect after success
//       setTimeout(() => {
//         navigate('/');
//       }, 2000);
//     }
//   }, [processingComplete, currentStep, navigate]);

//   const handleImport = async (): Promise<void> => {
//     setCurrentStep('importing');

//     // This returns immediately, processing happens in background
//     await importHistory(10);

//     // Don't wait for processing to complete, it happens via events
//     // The useEffect above will handle the transition to success
//   };

//   const handleSkip = (): void => {
//     // Navigate to main page
//     skipOnboarding();
//     navigate('/');
//   };

//   if (loading && !session) {
//     return <Loading IsOpen={loading} />;
//   }

//   return (
//     <div className="min-h-screen bg-background flex items-center justify-center p-6">
//       <div className="w-full max-w-2xl">
//         {/* Welcome Step */}
//         {currentStep === 'welcome' && (
//           <div className="space-y-8 animate-in fade-in duration-500">
//             {/* Header */}
//             <div className="text-center space-y-4">
//               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 mb-4">
//                 <Sparkles className="w-8 h-8 text-foreground" />
//               </div>
//               <h1 className="text-4xl font-semibold text-foreground tracking-tight">
//                 Welcome to Memory Layer
//               </h1>
//               <p className="text-lg text-secondary-foreground max-w-md mx-auto">
//                 Lets personalize your experience by importing your browsing history
//               </p>
//             </div>

//             {/* Feature Cards */}
//             <div className="grid gap-4 mt-12">
//               <FeatureCard
//                 icon={<Globe className="w-5 h-5" />}
//                 title="Smart Context"
//                 description="We'll analyze your browsing patterns to provide relevant suggestions"
//               />
//               <FeatureCard
//                 icon={<Shield className="w-5 h-5" />}
//                 title="Privacy First"
//                 description="Your data stays on your device. Nothing is sent to external servers"
//               />
//               <FeatureCard
//                 icon={<Zap className="w-5 h-5" />}
//                 title="Instant Setup"
//                 description="Takes only a moment to import the last 10 days of history"
//               />
//             </div>

//             {/* CTA Buttons */}
//             <div className="flex flex-col gap-3 mt-12">
//               <button
//                 onClick={handleImport}
//                 disabled={importing}
//                 className="group relative w-full px-6 py-4 bg-background hover:bg-secondary text-foreground rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-secondary disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Chromium className="w-5 h-5" />
//                 <span>Import Browser History</span>
//                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//               </button>

//               <button
//                 onClick={handleSkip}
//                 className="w-full px-6 py-4 text-foreground hover:text-secondary-foreground hover:bg-secondary rounded-xl font-medium transition-all duration-200"
//               >
//                 Skip
//               </button>
//             </div>

//             {/* Error Display */}
//             {error && (
//               <div className="flex items-start gap-3 p-4 bg-background border border-border rounded-xl mt-6 animate-in fade-in duration-300">
//                 <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-red-900">Import failed</p>
//                   <p className="text-sm text-error mt-1">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Footer Note */}
//             <p className="text-center text-sm text-secondary-foreground mt-8">
//               You can always import your history later from settings
//             </p>
//           </div>
//         )}

//         {/* Importing Step */}
//         {currentStep === 'importing' && (
//           <div className="text-center space-y-8 animate-in fade-in duration-500">
//             <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 mb-4">
//               <div className="relative">
//                 <Chromium className="w-10 h-10 text-foreground animate-pulse" />
//                 <div className="absolute -top-1 -right-1">
//                   <div className="w-3 h-3 bg-background rounded-full animate-ping" />
//                   <div className="absolute top-0 right-0 w-3 h-3 bg-background rounded-full" />
//                 </div>
//               </div>
//             </div>

//             {/*<div className="space-y-3">
//               <h2 className="text-2xl font-semibold text-gray-900">Importing your history...</h2>
//               <p className="text-gray-600">This will only take a moment</p>
//             </div>*/}

//             <div className="space-y-3">
//               <h2 className="text-2xl font-semibold text-foreground">
//                 {progress?.message || 'Processing...'}
//               </h2>
//               <p className="text-gray-600">
//                 {progress?.stage === 'filtering' && 'Filtering your browsing history'}
//                 {progress?.stage === 'ai-selection' && 'Selecting quality content'}
//                 {progress?.stage === 'fetching' && 'Extracting content from articles'}
//                 {progress?.stage === 'complete' && 'Finishing up...'}
//               </p>
//             </div>

//             <div className="max-w-xs mx-auto mt-8">
//               <div className="h-2 bg-secondary rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-linear-to-br from-blue-500 to-purple-600 rounded-full transition-all duration-300"
//                   style={{ width: `${progress?.progress || 0}%` }}
//                 />
//               </div>
//               <p className="text-xs text-secondary-foreground mt-2">{progress?.progress || 0}%</p>
//             </div>

//             {/* Current URL being processed */}
//             {progress?.currentUrl && (
//               <div className="mt-6 p-3 bg-secondary rounded-lg">
//                 <p className="text-xs text-secondary-foreground truncate">{progress.currentUrl}</p>
//               </div>
//             )}

//             {/* Import Stats */}
//             {result && (
//               <div className="mt-12 space-y-3">
//                 <div className="flex items-center justify-center gap-2 text-sm text-secondary-foreground">
//                   <Clock className="w-4 h-4" />
//                   <span>Scanning last 10 days</span>
//                 </div>
//                 {result.totalEntries > 0 && (
//                   <div className="flex items-center justify-center gap-2 text-sm text-secondary-foreground">
//                     <FileText className="w-4 h-4" />
//                     <span>{result.totalEntries} entries found</span>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Success Step */}
//         {currentStep === 'success' && (
//           <div className="text-center space-y-8 animate-in fade-in duration-500">
//             <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 mb-4">
//               <Check className="w-10 h-10 text-foreground" strokeWidth={3} />
//             </div>

//             <div className="space-y-3">
//               <h2 className="text-2xl font-semibold text-foreground">All set! 🎉</h2>
//               <p className="text-secondary-foreground">
//                 Successfully imported {result?.totalEntries || 0} entries from{' '}
//                 {result?.browser.name || 'your browser'}
//               </p>
//             </div>

//             {/* Success Stats */}
//             <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
//               <StatCard value={result?.totalEntries || 0} label="Entries" />
//               <StatCard value="30" label="Days" />
//               <StatCard value={result?.browser.name || 'Browser'} label="Source" capitalize />
//             </div>

//             <p className="text-sm text-secondary-foreground mt-8">
//               Redirecting to your workspace...
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Add custom animation keyframes via style tag */}
//       <style>{`
//         @keyframes loading {
//           0% {
//             transform: translateX(-100%);
//           }
//           50% {
//             transform: translateX(100%);
//           }
//           100% {
//             transform: translateX(-100%);
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// // Feature Card Component
// const FeatureCard: FC<{
//   icon: React.ReactNode;
//   title: string;
//   description: string;
// }> = ({ icon, title, description }) => {
//   return (
//     <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-secondary transition-all duration-200 group">
//       <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary group-hover:bg-background flex items-center justify-center text-secondary-foreground transition-colors">
//         {icon}
//       </div>
//       <div className="flex-1 min-w-0">
//         <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
//         <p className="text-sm text-secondary-foreground leading-relaxed">{description}</p>
//       </div>
//     </div>
//   );
// };

// // Stat Card Component
// const StatCard: FC<{
//   value: string | number;
//   label: string;
//   capitalize?: boolean;
// }> = ({ value, label, capitalize = false }) => {
//   return (
//     <div className="p-4 rounded-xl bg-secondary border border-border">
//       <div
//         className={`text-2xl font-semibold text-foreground mb-1 ${capitalize ? 'capitalize' : ''}`}
//       >
//         {value}
//       </div>
//       <div className="text-xs text-secondary-foreground uppercase tracking-wide">{label}</div>
//     </div>
//   );
// };

import { Loading } from '@renderer/components/Loading';
import { useAuth } from '@renderer/context/AuthContext';
import { type FC, useEffect, useState } from 'react';
import {
  Sparkles,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  Check,
  AlertCircle,
  FileText,
  Bookmark,
  ExternalLink,
  XCircle,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { skipOnboarding } from '@renderer/services/onBoardingService';
import { PROFILE_ID } from '@renderer/utils/constants';

// Types
interface Browser {
  id: string;
  name: string;
  icon: LucideIcon;
  available: boolean;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  selected: boolean;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  failedUrls: Array<{ url: string; reason: string }>;
}

export const OnBoardingPage: FC = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState<
    'welcome' | 'browser-select' | 'bookmark-select' | 'processing' | 'complete'
  >('welcome');
  const [availableBrowsers, setAvailableBrowsers] = useState<Browser[]>([]);
  const [selectedBrowser, setSelectedBrowser] = useState<Browser | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingUrl, setCurrentProcessingUrl] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available browsers on mount
  useEffect(() => {
    loadAvailableBrowsers();
  }, []);

  // Helper to get icon for browser
  const getBrowserIcon = (browserId: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      chrome: Globe,
      firefox: Globe,
      edge: Globe,
      brave: Shield,
      safari: Globe
    };
    return iconMap[browserId] || Globe;
  };

  const loadAvailableBrowsers = async (): Promise<void> => {
    try {
      // Call your electron IPC to get available browsers
      // This is a placeholder - replace with your actual implementation
      const browsers = await window.electronAPI.bookmark.getAvailableBrowsers();

      // Add icons to each browser
      const browsersWithIcons = browsers.map((browser) => ({
        ...browser,
        icon: getBrowserIcon(browser.id)
      }));

      setAvailableBrowsers(browsersWithIcons);
    } catch (err) {
      setError('Failed to detect browsers');
      console.error(err);
    }
  };

  const handleBrowserSelect = async (browser: Browser): Promise<void> => {
    setSelectedBrowser(browser);
    setLoadingBookmarks(true);
    setError(null);

    try {
      // Call your electron IPC to get bookmarks
      const fetchedBookmarks = await window.electronAPI.bookmark.getBookmarks(browser.id);

      // Convert to BookmarkItem format with selected: false by default
      const bookmarkItems: BookmarkItem[] = fetchedBookmarks.map(
        (bookmark: any, index: number) => ({
          id: `bookmark-${index}`,
          title: bookmark.title || bookmark.url,
          url: bookmark.url,
          favicon: bookmark.favicon,
          selected: false
        })
      );

      setBookmarks(bookmarkItems);
      setCurrentStep('bookmark-select');
    } catch (err) {
      setError('Failed to load bookmarks from ' + browser.name);
      console.error(err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const toggleBookmark = (id: string): void => {
    setBookmarks((prev) => {
      const selectedCount = prev.filter((b) => b.selected).length;
      const bookmark = prev.find((b) => b.id === id);

      // If trying to select and already have 20 selected, don't allow
      if (bookmark && !bookmark.selected && selectedCount >= 20) {
        return prev;
      }

      return prev.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b));
    });
  };

  const handleProcessBookmarks = async (): Promise<void> => {
    const selectedBookmarks = bookmarks.filter((b) => b.selected);

    if (selectedBookmarks.length === 0) {
      setError('Please select at least one bookmark');
      return;
    }

    setCurrentStep('processing');
    setProcessing(true);
    setError(null);

    const failedUrls: Array<{ url: string; reason: string }> = [];
    let successful = 0;

    try {
      for (let i = 0; i < selectedBookmarks.length; i++) {
        const bookmark = selectedBookmarks[i];
        setCurrentProcessingUrl(bookmark.url);
        setProcessingProgress(Math.round(((i + 1) / selectedBookmarks.length) * 100));

        try {
          // Call your electron IPC to process the bookmark
          await window.electronAPI.bookmark.processBookmark(bookmark.url, PROFILE_ID);
          successful++;
        } catch (err: any) {
          failedUrls.push({
            url: bookmark.url,
            reason: err.message || 'Failed to access site'
          });
        }

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setResult({
        successful,
        failed: failedUrls.length,
        failedUrls
      });

      setCurrentStep('complete');

      // Auto-redirect after showing results
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError('Processing failed. Please try again.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = (): void => {
    skipOnboarding();
    navigate('/');
  };

  const handleBack = (): void => {
    if (currentStep === 'bookmark-select') {
      setCurrentStep('browser-select');
      setBookmarks([]);
      setSelectedBrowser(null);
    } else if (currentStep === 'browser-select') {
      setCurrentStep('welcome');
    }
  };

  if (loading && !session) {
    return <Loading IsOpen={loading} />;
  }

  const selectedCount = bookmarks.filter((b) => b.selected).length;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                Welcome to Memory Layer
              </h1>
              <p className="text-lg text-secondary-foreground max-w-md mx-auto">
                Let's personalize your experience by importing your favorite bookmarks
              </p>
            </div>

            <div className="grid gap-4 mt-12">
              <FeatureCard
                icon={<Bookmark className="w-5 h-5" />}
                title="Choose Your Bookmarks"
                description="Select up to 20 bookmarks from your browser to get started"
              />
              <FeatureCard
                icon={<Shield className="w-5 h-5" />}
                title="Privacy First"
                description="Your data stays on your device. Nothing is sent to external servers"
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5" />}
                title="AI-Powered"
                description="We'll process your bookmarks to provide personalized insights"
              />
            </div>

            <div className="flex flex-col gap-3 mt-12">
              <button
                onClick={() => setCurrentStep('browser-select')}
                className="group relative w-full px-6 py-4 bg-linear-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Bookmark className="w-5 h-5" />
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleSkip}
                className="w-full px-6 py-4 text-foreground hover:text-secondary-foreground hover:bg-secondary rounded-xl font-medium transition-all duration-200"
              >
                Skip for now
              </button>
            </div>

            {/* <p className="text-center text-sm text-secondary-foreground mt-8">
              You can always import bookmarks later from settings
            </p> */}
          </div>
        )}

        {/* Browser Selection Step */}
        {currentStep === 'browser-select' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-semibold text-foreground">Select Your Browser</h2>
              <p className="text-secondary-foreground">
                Choose the browser to import bookmarks from
              </p>
            </div>

            {loadingBookmarks ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-secondary-foreground mt-4">Loading bookmarks...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableBrowsers.map((browser) => (
                  <button
                    key={browser.id}
                    onClick={() => handleBrowserSelect(browser)}
                    disabled={!browser.available}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-blue-500 hover:bg-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-secondary group-hover:bg-background flex items-center justify-center transition-colors">
                      <browser.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-base font-medium text-foreground">{browser.name}</h3>
                      <p className="text-sm text-secondary-foreground">
                        {browser.available ? 'Available' : 'Not installed'}
                      </p>
                    </div>
                    {browser.available && (
                      <ChevronRight className="w-5 h-5 text-secondary-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 text-foreground hover:bg-secondary rounded-xl font-medium transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 text-foreground hover:bg-secondary rounded-xl font-medium transition-all duration-200"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Bookmark Selection Step */}
        {currentStep === 'bookmark-select' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold text-foreground">Choose Your Bookmarks</h2>
              <p className="text-secondary-foreground">Select up to 20 bookmarks to process</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mt-4">
                <span className="text-sm font-medium text-foreground">
                  {selectedCount} / 20 selected
                </span>
              </div>
            </div>

            <div className="max-h-100 overflow-y-auto space-y-2 pr-2">
              {bookmarks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  onClick={() => toggleBookmark(bookmark.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                    bookmark.selected
                      ? 'border-blue-500 bg-muted-foreground'
                      : 'border-border hover:border-border hover:bg-secondary'
                  }`}
                >
                  <div
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      bookmark.selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {bookmark.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {bookmark.title}
                    </h4>
                    <p className="text-xs text-secondary-foreground truncate mt-1">
                      {bookmark.url}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-secondary-foreground shrink-0 mt-0.5" />
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 text-foreground hover:bg-secondary rounded-xl font-medium transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={handleProcessBookmarks}
                disabled={selectedCount === 0}
                className="flex-1 px-6 py-3 bg-linear-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process {selectedCount} Bookmark{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 mb-4">
              <FileText className="w-10 h-10 text-white animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Processing Bookmarks...</h2>
              <p className="text-secondary-foreground">
                Analyzing and extracting content from your bookmarks
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary-foreground">{processingProgress}% complete</p>
            </div>

            {currentProcessingUrl && (
              <div className="mt-6 p-3 bg-secondary rounded-lg max-w-md mx-auto">
                <p className="text-xs text-secondary-foreground truncate">
                  Processing: {currentProcessingUrl}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && result && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
                result.failed === 0
                  ? 'bg-linear-to-br from-green-500 to-emerald-600'
                  : 'bg-linear-to-br from-yellow-500 to-orange-600'
              }`}
            >
              {result.failed === 0 ? (
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              ) : (
                <AlertCircle className="w-10 h-10 text-white" strokeWidth={3} />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {result.failed === 0 ? 'All Done! 🎉' : 'Processing Complete'}
              </h2>
              <p className="text-secondary-foreground">
                Successfully processed {result.successful} bookmark
                {result.successful !== 1 ? 's' : ''}
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="text-2xl font-semibold text-green-700 mb-1">
                  {result.successful}
                </div>
                <div className="text-xs text-green-600 uppercase tracking-wide">Successful</div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="text-2xl font-semibold text-red-700 mb-1">{result.failed}</div>
                <div className="text-xs text-red-600 uppercase tracking-wide">Failed</div>
              </div>
            </div>

            {result.failedUrls.length > 0 && (
              <div className="mt-8 text-left max-w-md mx-auto">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Unable to Process:
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.failedUrls.map((failed, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-left"
                    >
                      <p className="text-xs font-medium text-red-900 truncate">{failed.url}</p>
                      <p className="text-xs text-red-600 mt-1">{failed.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-secondary-foreground mt-8">
              Redirecting to your workspace...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-secondary transition-all duration-200 group">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary group-hover:bg-background flex items-center justify-center text-secondary-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-secondary-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
