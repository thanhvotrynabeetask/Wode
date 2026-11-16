import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function useBeforeUnload(): void {
  const isDirty = useProjectStore((s) => s.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard trigger for browser exit confirmation
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}
