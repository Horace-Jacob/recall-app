export interface HistoryRetrievalResult {
  success: boolean;
  entries: BrowserHistoryEntry[];
  browser: BrowserInfo;
  error?: string;
  totalEntries: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface BrowserHistoryEntry {
  url: string;
  title: string;
  visitTime: Date;
  visitCount: number;
  typedCount?: number;
  lastVisitTime?: Date;
}

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'edge' | 'safari' | 'brave' | 'opera' | 'unknown';
  profilePath: string;
  historyDbPath: string;
}

export interface ProcessedHistoryEntry {
  url: string;
  normalizedUrl: string;
  title: string;
  content: string;
  contentLength: number;
  wordCount: number;
  visitCount: number;
  visitTime: Date;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ProcessingProgress {
  stage: 'filtering' | 'ai-selection' | 'fetching' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  currentUrl?: string;
  stats?: Partial<ProcessingResult['stats']>;
}

export interface ScoreBreakdown {
  visitCountScore: number;
  recencyScore: number;
  titleQualityScore: number;
  contentQualityScore: number;
  urlStructureScore: number;
  totalScore: number;
}

export interface ProcessingResult {
  success: boolean;
  processedEntries: ProcessedHistoryEntry[];
  stats: {
    totalInput: number;
    afterBlocklist: number;
    sentToAI: number;
    aiSelected: number;
    successfullyFetched: number;
    finalCount: number;
  };
  message?: string;
  error?: string;
}

export interface LocalSetting {
  localProfileId: string | null;
  onboardingCompleted: number;
  lastImportAt: string | null;
  skipOnboarding: number;
}

export interface OnboardingState {
  shouldShowOnboarding: boolean;
  canImportHistory: boolean;
  reason: 'new_user' | 'incomplete_onboarding' | 'already_completed' | 'device_already_imported';
  message: string;
}
