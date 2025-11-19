import { useState, useEffect } from "react";

export interface Job {
  id: string;
  date: Date;
  department: string;
  description: string;
  jobComplete: boolean;
  sapComplete: boolean;
  flag?: "1" | "2" | "3" | "4";
  flagDetails?: string;
}

export interface CompletedJob extends Job {
  completedAt: Date;
}

const ACTIVE_JOBS_KEY = "activeJobs";
const COMPLETED_JOBS_KEY = "completedJobs";

export const useJobStorage = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [rowHeight, setRowHeight] = useState<number>(() => {
    const saved = localStorage.getItem("rowHeight");
    return saved ? parseInt(saved) : 2; // 0=extra compact, 1=compact, 2=normal, 3=comfortable, 4=extra comfortable
  });

  const [textSize, setTextSize] = useState<number>(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved) : 2; // 0=extra small, 1=small, 2=normal, 3=large, 4=extra large
  });

  const [textBold, setTextBold] = useState<boolean>(() => {
    const saved = localStorage.getItem("textBold");
    return saved === "true";
  });

  // Load from localStorage on mount
  useEffect(() => {
    const loadedActiveJobs = localStorage.getItem(ACTIVE_JOBS_KEY);
    const loadedCompletedJobs = localStorage.getItem(COMPLETED_JOBS_KEY);

    if (loadedActiveJobs) {
      const parsed = JSON.parse(loadedActiveJobs);
      setActiveJobs(parsed.map((job: any) => ({ ...job, date: new Date(job.date) })));
    }

    if (loadedCompletedJobs) {
      const parsed = JSON.parse(loadedCompletedJobs);
      setCompletedJobs(
        parsed.map((job: any) => ({
          ...job,
          date: new Date(job.date),
          completedAt: new Date(job.completedAt),
        }))
      );
    }
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(ACTIVE_JOBS_KEY, JSON.stringify(activeJobs));
  }, [activeJobs]);

  useEffect(() => {
    localStorage.setItem(COMPLETED_JOBS_KEY, JSON.stringify(completedJobs));
  }, [completedJobs]);

  useEffect(() => {
    localStorage.setItem("rowHeight", rowHeight.toString());
  }, [rowHeight]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem("textBold", textBold.toString());
  }, [textBold]);

  const addJob = (job: Omit<Job, "id">) => {
    const newJob = {
      ...job,
      id: crypto.randomUUID(),
    };
    setActiveJobs((prev) => [...prev, newJob]);
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setActiveJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  const deleteJob = (id: string) => {
    setActiveJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const archiveCompletedJobs = () => {
    const jobsToArchive = activeJobs.filter(
      (job) => job.jobComplete && job.sapComplete
    );

    const completedJobsWithTimestamp = jobsToArchive.map((job) => ({
      ...job,
      completedAt: new Date(),
    }));

    setCompletedJobs((prev) => [...prev, ...completedJobsWithTimestamp]);
    setActiveJobs((prev) =>
      prev.filter((job) => !(job.jobComplete && job.sapComplete))
    );
  };

  const exportData = () => {
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
  };

  const importData = (file: File, merge: boolean = false) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.activeJobs) {
            const importedActiveJobs = data.activeJobs.map((job: any) => ({
              ...job,
              date: new Date(job.date),
            }));
            
            if (merge) {
              setActiveJobs((prev) => [...prev, ...importedActiveJobs]);
            } else {
              setActiveJobs(importedActiveJobs);
            }
          }
          if (data.completedJobs) {
            const importedCompletedJobs = data.completedJobs.map((job: any) => ({
              ...job,
              date: new Date(job.date),
              completedAt: new Date(job.completedAt),
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
  };

  const deleteCompletedJob = (id: string) => {
    setCompletedJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const updateCompletedJob = (id: string, updates: Partial<CompletedJob>) => {
    setCompletedJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  return {
    activeJobs,
    completedJobs,
    addJob,
    updateJob,
    deleteJob,
    archiveCompletedJobs,
    exportData,
    importData,
    deleteCompletedJob,
    updateCompletedJob,
    rowHeight,
    setRowHeight,
    textSize,
    setTextSize,
    textBold,
    setTextBold,
  };
};
