import { useAuth } from '@renderer/context/AuthContext';
import { saveArticle } from '@renderer/lib/supabase';
import { useEffect } from 'react';

export const useActivityTracking = () => {
  const { session } = useAuth();
  useEffect(() => {
    if (!session?.user.id) return;
    // Listen for article saved events from main process
    const handleArticleSaved = async (): Promise<void> => {
      // Track in Supabase
      await saveArticle(session.user.id);
    };

    // Set up listener
    window.electronAPI.track.onSavedArticle(handleArticleSaved);

    // Cleanup
    return () => {
      window.electronAPI.track.removeArticleSavedListener();
    };
  }, []);
};
