import { shouldShowImportButton } from '@renderer/services/onBoardingService';
import { useEffect, useState } from 'react';

export const useShowOnboardBtn = (): boolean => {
  const [showImportButton, setShowImportButton] = useState(false);

  useEffect(() => {
    const checkImportStatus = async (): Promise<void> => {
      const shouldShow = await shouldShowImportButton();
      setShowImportButton(shouldShow);
    };

    checkImportStatus();
  }, []);

  return showImportButton;
};
