import { useEffect } from 'react';

export const useBeforeUnload = (shouldWarn: boolean, message?: string) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldWarn) {
        const defaultMessage = message || 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = defaultMessage;
        return defaultMessage;
      }
    };

    if (shouldWarn) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldWarn, message]);
}; 