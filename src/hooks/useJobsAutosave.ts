import { useState, useEffect, useRef, useCallback } from 'react';
import { saveJobs, JobsState } from '@/api/jobs';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 300;
const SAVED_DISPLAY_MS = 2000;

export function useJobsAutosave(state: JobsState, isInitialized: boolean) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');
  const isFirstSaveRef = useRef(true);

  const performSave = useCallback(async (currentState: JobsState) => {
    const stateString = JSON.stringify(currentState);
    
    // Skip if state hasn't changed from last successful save
    if (stateString === lastSavedStateRef.current) {
      return;
    }

    if (isSavingRef.current) {
      isDirtyRef.current = true;
      return;
    }

    isSavingRef.current = true;
    isDirtyRef.current = false;
    
    // Don't show "Saving..." on the very first save (initial sync)
    if (!isFirstSaveRef.current) {
      setSaveStatus('saving');
    }

    try {
      await saveJobs(currentState);
      lastSavedStateRef.current = stateString;
      isFirstSaveRef.current = false;
      setSaveStatus('saved');
      
      // Clear any existing saved timer
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      
      // Reset to idle after showing "saved" briefly
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, SAVED_DISPLAY_MS);
    } catch (error) {
      console.error('Autosave failed:', error);
      // Only show error if it's not the first save attempt
      if (!isFirstSaveRef.current) {
        setSaveStatus('error');
      } else {
        isFirstSaveRef.current = false;
        setSaveStatus('idle');
      }
    } finally {
      isSavingRef.current = false;

      // If marked dirty during save, trigger another save
      if (isDirtyRef.current) {
        isDirtyRef.current = false;
        performSave(currentState);
      }
    }
  }, []);

  useEffect(() => {
    // Don't trigger saves until initial load is complete
    if (!isInitialized) return;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the save
    debounceTimerRef.current = setTimeout(() => {
      performSave(state);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, isInitialized, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return { saveStatus };
}
