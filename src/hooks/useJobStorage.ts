import { useState, useEffect } from "react";

export interface Job {
  id: string;
  date: Date;
  department: string;
  description: string;
  jobComplete: boolean;
  sapComplete: boolean;
}

export interface CompletedJob extends Job {
  completedAt: Date;
}

const ACTIVE_JOBS_KEY = "activeJobs";
const COMPLETED_JOBS_KEY = "completedJobs";

export const useJobStorage = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);

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

  const importData = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.activeJobs) {
            setActiveJobs(
              data.activeJobs.map((job: any) => ({
                ...job,
                date: new Date(job.date),
              }))
            );
          }
          if (data.completedJobs) {
            setCompletedJobs(
              data.completedJobs.map((job: any) => ({
                ...job,
                date: new Date(job.date),
                completedAt: new Date(job.completedAt),
              }))
            );
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
  };
};
