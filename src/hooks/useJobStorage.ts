import { useState, useEffect, useCallback, useMemo } from "react";
import { loadJobs, saveJobs, Job, CompletedJob, JobsState } from "@/api/jobs";
import { useJobsAutosave, SaveStatus } from "./useJobsAutosave";

export type { Job, CompletedJob } from "@/api/jobs";

export const useJobStorage = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rowHeight, setRowHeight] = useState<number>(() => {
    const saved = localStorage.getItem("rowHeight");
    return saved ? parseInt(saved) : 2;
  });

  const [textSize, setTextSize] = useState<number>(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved) : 2;
  });

  const [textBold, setTextBold] = useState<boolean>(() => {
    const saved = localStorage.getItem("textBold");
    return saved === "true";
  });

  // Memoize state for autosave
  const jobsState = useMemo<JobsState>(() => ({
    activeJobs,
    completedJobs,
  }), [activeJobs, completedJobs]);

  // Autosave hook
  const { saveStatus } = useJobsAutosave(jobsState, isInitialized);

  // Load from DB on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await loadJobs();
        setActiveJobs(data.activeJobs);
        setCompletedJobs(data.completedJobs);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load jobs:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Persist UI settings to localStorage
  useEffect(() => {
    localStorage.setItem("rowHeight", rowHeight.toString());
  }, [rowHeight]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem("textBold", textBold.toString());
  }, [textBold]);

  const addJob = useCallback((job: Omit<Job, "id">) => {
    const newJob: Job = {
      ...job,
      id: crypto.randomUUID(),
    };
    setActiveJobs((prev) => [...prev, newJob]);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setActiveJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  }, []);

  const deleteJob = useCallback((id: string) => {
    setActiveJobs((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const archiveCompletedJobs = useCallback(() => {
    setActiveJobs((prev) => {
      const jobsToArchive = prev.filter(
        (job) => job.jobComplete && job.sapComplete
      );

      const completedJobsWithTimestamp: CompletedJob[] = jobsToArchive.map((job) => ({
        ...job,
        completedAt: new Date().toISOString(),
      }));

      setCompletedJobs((prevCompleted) => [...prevCompleted, ...completedJobsWithTimestamp]);

      return prev.filter((job) => !(job.jobComplete && job.sapComplete));
    });
  }, []);

  const exportData = useCallback(() => {
    const data = {
      activeJobs,
      completedJobs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-log-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeJobs, completedJobs]);

  const importData = useCallback((file: File, merge: boolean = false) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.activeJobs) {
            const importedActiveJobs: Job[] = data.activeJobs.map((job: any) => ({
              ...job,
              date: typeof job.date === 'string' ? job.date : new Date(job.date).toISOString(),
            }));
            
            if (merge) {
              setActiveJobs((prev) => [...prev, ...importedActiveJobs]);
            } else {
              setActiveJobs(importedActiveJobs);
            }
          }
          if (data.completedJobs) {
            const importedCompletedJobs: CompletedJob[] = data.completedJobs.map((job: any) => ({
              ...job,
              date: typeof job.date === 'string' ? job.date : new Date(job.date).toISOString(),
              completedAt: typeof job.completedAt === 'string' ? job.completedAt : new Date(job.completedAt).toISOString(),
            }));
            
            if (merge) {
              setCompletedJobs((prev) => [...prev, ...importedCompletedJobs]);
            } else {
              setCompletedJobs(importedCompletedJobs);
            }
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const deleteCompletedJob = useCallback((id: string) => {
    setCompletedJobs((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const updateCompletedJob = useCallback((id: string, updates: Partial<CompletedJob>) => {
    setCompletedJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  }, []);

  const restoreJob = useCallback((id: string) => {
    setCompletedJobs((prev) => {
      const jobToRestore = prev.find((job) => job.id === id);
      if (!jobToRestore) return prev;

      const { completedAt, ...activeJobData } = jobToRestore;
      const restoredJob: Job = {
        ...activeJobData,
        jobComplete: false,
        sapComplete: false,
      };

      setActiveJobs((prevActive) => [...prevActive, restoredJob]);
      return prev.filter((job) => job.id !== id);
    });
  }, []);

  return {
    activeJobs,
    completedJobs,
    addJob,
    updateJob,
    deleteJob,
    archiveCompletedJobs,
    rowHeight,
    setRowHeight,
    textSize,
    setTextSize,
    textBold,
    setTextBold,
    exportData,
    importData,
    deleteCompletedJob,
    updateCompletedJob,
    restoreJob,
    saveStatus,
    isLoading,
    loadError,
    isInitialized,
  };
};
