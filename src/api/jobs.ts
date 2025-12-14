export interface Job {
  id: string;
  date: string;
  department: string;
  description: string;
  jobComplete: boolean;
  sapComplete: boolean;
  jobNumber?: string;
}

export interface CompletedJob extends Job {
  completedAt: string;
}

export interface JobsState {
  activeJobs: Job[];
  completedJobs: CompletedJob[];
}

const API_BASE = '/api/jobs';
const ACTIVE_JOBS_KEY = "activeJobs";
const COMPLETED_JOBS_KEY = "completedJobs";

// Check if API is available
let apiAvailable: boolean | null = null;

async function checkApiAvailability(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  
  try {
    const response = await fetch(API_BASE, { method: 'GET' });
    const contentType = response.headers.get('content-type');
    apiAvailable = response.ok && contentType?.includes('application/json');
  } catch {
    apiAvailable = false;
  }
  
  return apiAvailable;
}

function loadFromLocalStorage(): JobsState {
  const activeJobs = localStorage.getItem(ACTIVE_JOBS_KEY);
  const completedJobs = localStorage.getItem(COMPLETED_JOBS_KEY);
  
  return {
    activeJobs: activeJobs ? JSON.parse(activeJobs) : [],
    completedJobs: completedJobs ? JSON.parse(completedJobs) : [],
  };
}

function saveToLocalStorage(state: JobsState): void {
  localStorage.setItem(ACTIVE_JOBS_KEY, JSON.stringify(state.activeJobs));
  localStorage.setItem(COMPLETED_JOBS_KEY, JSON.stringify(state.completedJobs));
}

export async function loadJobs(): Promise<JobsState> {
  const isApiAvailable = await checkApiAvailability();
  
  if (!isApiAvailable) {
    console.log('API not available, loading from localStorage');
    return loadFromLocalStorage();
  }
  
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to load jobs: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    activeJobs: data.activeJobs || [],
    completedJobs: data.completedJobs || [],
  };
}

export async function saveJobs(state: JobsState): Promise<void> {
  // Always save to localStorage as backup
  saveToLocalStorage(state);
  
  const isApiAvailable = await checkApiAvailability();
  
  if (!isApiAvailable) {
    console.log('API not available, saved to localStorage only');
    return;
  }
  
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save jobs: ${response.statusText}`);
  }
}

export function isApiEnabled(): boolean {
  return apiAvailable === true;
}
