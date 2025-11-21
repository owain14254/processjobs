import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useJobStorage } from "@/hooks/useJobStorage";
import { AddJobForm } from "@/components/AddJobForm";
import { JobRow } from "@/components/JobRow";
import { CompletedJobsLog } from "@/components/CompletedJobsLog";
import { HandoverTab } from "@/components/HandoverTab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminSettingsDialog } from "@/components/AdminSettingsDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Archive, Download, Upload, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";
import { formatDistanceToNow } from "date-fns";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin settings state
  const [adminSettings, setAdminSettings] = useState({
    tabNameActive: "Active",
    tabNameCompleted: "Completed",
    tabNameHandover: "Handover",
    appName: "Process Tracker",
    departments: ["Process", "Fruit", "Filling", "Warehouse", "Services", "Other"],
    shiftDuration: 12,
    setDuration: 96,
    rowHeightActive: 2,
    rowHeightCompleted: 2,
    rowHeightHandover: 2,
    textSizeActive: 2,
    textSizeCompleted: 2,
    textSizeHandover: 2,
    textBoldActive: false,
    textBoldCompleted: false,
    textBoldHandover: false,
    expandPopupSize: 2,
    statusColorAmber: "#ffc252",
    statusColorLightGreen: "#8bea8b",
    statusColorDarkGreen: "#00b300",
    clockVisible: true,
    clockSize: 2
  });
  const {
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
    setTextBold
  } = useJobStorage();
  const {
    toast
  } = useToast();
  const handleArchive = () => {
    const count = activeJobs.filter(job => job.jobComplete && job.sapComplete).length;
    if (count === 0) {
      toast({
        title: "No jobs to archive",
        description: "All jobs must be marked as both Job Complete and SAP Complete to archive."
      });
      return;
    }
    archiveCompletedJobs();
    toast({
      title: "Jobs archived",
      description: `${count} completed job(s) moved to Completed Jobs Log.`
    });
  };
  const handleExport = () => {
    exportData();
    const now = new Date();
    setLastSaveTime(now);
    localStorage.setItem("lastSaveTime", now.toISOString());
    toast({
      title: "Backup created",
      description: "Job data exported successfully. Save the file to your USB stick."
    });
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImportFile(file);
    setShowImportDialog(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleImportConfirm = (merge: boolean) => {
    if (!pendingImportFile) return;
    importData(pendingImportFile, merge).then(() => {
      toast({
        title: "Data imported",
        description: merge ? "Jobs added to current data successfully." : "Job data loaded successfully from backup."
      });
      setShowImportDialog(false);
      setPendingImportFile(null);
    }).catch(() => {
      toast({
        title: "Import failed",
        description: "Could not load data from the selected file.",
        variant: "destructive"
      });
    });
  };
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Process3116") {
      setIsAdminMode(true);
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast({
        title: "Admin Mode Enabled",
        description: "You can now edit and delete completed jobs"
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again",
        variant: "destructive"
      });
      setPasswordInput("");
    }
  };
  const toggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      toast({
        title: "Admin Mode Disabled"
      });
    } else {
      setShowPasswordDialog(true);
    }
  };
  const checkBackupReminder = () => {
    const lastBackupReminder = localStorage.getItem("lastBackupReminder");
    if (!lastBackupReminder) {
      // First time, set timestamp and don't show
      localStorage.setItem("lastBackupReminder", new Date().toISOString());
      return;
    }
    const lastReminderDate = new Date(lastBackupReminder);
    const now = new Date();
    const hoursSinceLastReminder = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastReminder >= 24) {
      setShowBackupReminder(true);
    }
  };
  const handleBackupReminderClose = () => {
    setShowBackupReminder(false);
    localStorage.setItem("lastBackupReminder", new Date().toISOString());
  };
  const handleBackupReminderDownload = () => {
    handleExport();
    handleBackupReminderClose();
  };
  const testBackupReminder = () => {
    setShowBackupReminder(true);
  };
  useEffect(() => {
    checkBackupReminder();
    // Check every hour if 24 hours have passed
    const interval = setInterval(checkBackupReminder, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto theme switching
  useEffect(() => {
    const checkAndSwitchTheme = () => {
      const savedSettings = localStorage.getItem("adminSettings");
      if (!savedSettings) return;
      
      try {
        const parsed = JSON.parse(savedSettings);
        if (!parsed.autoThemeEnabled) return;

        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const lightTime = parsed.autoThemeLightTime || "06:00";
        const darkTime = parsed.autoThemeDarkTime || "18:00";

        // Check if we've hit one of the scheduled times
        const lastAutoSwitch = localStorage.getItem("lastAutoThemeSwitch");
        const isLightTime = currentTimeStr === lightTime;
        const isDarkTime = currentTimeStr === darkTime;
        
        // Only auto-switch at exact scheduled times, and not if we've already switched this minute
        if ((isLightTime || isDarkTime) && lastAutoSwitch !== currentTimeStr) {
          const root = document.documentElement;
          if (isDarkTime) {
            root.classList.add('dark');
          } else if (isLightTime) {
            root.classList.remove('dark');
          }
          localStorage.setItem("lastAutoThemeSwitch", currentTimeStr);
        }
      } catch (e) {
        console.error("Failed to auto-switch theme", e);
      }
    };

    // Calculate milliseconds until the next full minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Check immediately
    checkAndSwitchTheme();
    
    // Schedule first check at the start of next minute
    const initialTimeout = setTimeout(() => {
      checkAndSwitchTheme();
      // Then check every minute exactly
      const interval = setInterval(checkAndSwitchTheme, 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  // Update current time display
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const savedLastSave = localStorage.getItem("lastSaveTime");
    if (savedLastSave) {
      setLastSaveTime(new Date(savedLastSave));
    }
    
    // Load admin settings
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const deptArray = parsed.departments 
          ? parsed.departments.split(',').map((d: string) => d.trim()).filter((d: string) => d)
          : ["Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];
        
        setAdminSettings({
          tabNameActive: parsed.tabNameActive || "Active",
          tabNameCompleted: parsed.tabNameCompleted || "Completed",
          tabNameHandover: parsed.tabNameHandover || "Handover",
          appName: parsed.appName || "Process Tracker",
          departments: deptArray,
          shiftDuration: parsed.shiftDuration || 12,
          setDuration: parsed.setDuration || 96,
          rowHeightActive: parsed.rowHeightActive ?? 2,
          rowHeightCompleted: parsed.rowHeightCompleted ?? 2,
          rowHeightHandover: parsed.rowHeightHandover ?? 2,
          textSizeActive: parsed.textSizeActive ?? 2,
          textSizeCompleted: parsed.textSizeCompleted ?? 2,
          textSizeHandover: parsed.textSizeHandover ?? 2,
          textBoldActive: parsed.textBoldActive ?? false,
          textBoldCompleted: parsed.textBoldCompleted ?? false,
          textBoldHandover: parsed.textBoldHandover ?? false,
          expandPopupSize: parsed.expandPopupSize ?? 2,
          statusColorAmber: parsed.statusColorAmber || "#ffc252",
          statusColorLightGreen: parsed.statusColorLightGreen || "#8bea8b",
          statusColorDarkGreen: parsed.statusColorDarkGreen || "#00b300",
          clockVisible: parsed.clockVisible ?? true,
          clockSize: parsed.clockSize ?? 2
        });
      } catch (e) {
        console.error("Failed to parse admin settings", e);
      }
    }
  }, []);
  
  const handleSettingsChange = () => {
    // Reload settings when they change
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const deptArray = parsed.departments 
          ? parsed.departments.split(',').map((d: string) => d.trim()).filter((d: string) => d)
          : ["Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];
        
        setAdminSettings({
          tabNameActive: parsed.tabNameActive || "Active",
          tabNameCompleted: parsed.tabNameCompleted || "Completed",
          tabNameHandover: parsed.tabNameHandover || "Handover",
          appName: parsed.appName || "Process Tracker",
          departments: deptArray,
          shiftDuration: parsed.shiftDuration || 12,
          setDuration: parsed.setDuration || 96,
          rowHeightActive: parsed.rowHeightActive ?? 2,
          rowHeightCompleted: parsed.rowHeightCompleted ?? 2,
          rowHeightHandover: parsed.rowHeightHandover ?? 2,
          textSizeActive: parsed.textSizeActive ?? 2,
          textSizeCompleted: parsed.textSizeCompleted ?? 2,
          textSizeHandover: parsed.textSizeHandover ?? 2,
          textBoldActive: parsed.textBoldActive ?? false,
          textBoldCompleted: parsed.textBoldCompleted ?? false,
          textBoldHandover: parsed.textBoldHandover ?? false,
          expandPopupSize: parsed.expandPopupSize ?? 2,
          statusColorAmber: parsed.statusColorAmber || "#ffc252",
          statusColorLightGreen: parsed.statusColorLightGreen || "#8bea8b",
          statusColorDarkGreen: parsed.statusColorDarkGreen || "#00b300",
          clockVisible: parsed.clockVisible ?? true,
          clockSize: parsed.clockSize ?? 2
        });
      } catch (e) {
        console.error("Failed to parse admin settings", e);
      }
    }
  };
  return <div className="min-h-screen bg-background p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="hover:opacity-70 transition-opacity relative"
                    title="Menu"
                  >
                    <img src={mullerLogo} alt="Müller" className="h-12 cursor-pointer" />
                    {isAdminMode && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                        ADMIN
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => navigate("/sap")}>
                    <FileText className="h-4 w-4 mr-2" />
                    SAP
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/metrics")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Metrics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleAdminMode}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    {isAdminMode ? "Exit Admin Mode" : "Enter Admin Mode"}
                  </DropdownMenuItem>
                  {isAdminMode && (
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      document.querySelector('[data-admin-settings-trigger]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div>
                <h1 className="text-3xl font-bold">Job Log</h1>
                <p className="text-muted-foreground">{adminSettings.appName}</p>
              </div>
            </div>

            <div className="flex justify-center" style={{ visibility: adminSettings.clockVisible ? 'visible' : 'hidden' }}>
              <div 
                className="font-bold font-mono tabular-nums"
                style={{ 
                  fontSize: ['1rem', '1.25rem', '1.5rem', '1.75rem', '2rem'][adminSettings.clockSize] 
                }}
              >
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <div className="hidden">
                <AdminSettingsDialog onSettingsChange={handleSettingsChange} onTestSavePrompt={testBackupReminder} />
              </div>
              <ThemeToggle />
              <Button onClick={handleExport} variant="outline" size="icon" title="Export Backup" className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                <Download className="h-4 w-4" />
              </Button>
              <label>
                <Button variant="outline" size="icon" asChild title="Import Backup">
                  <span>
                    <Upload className="h-4 w-4" />
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <TabsList className="grid w-full max-w-[500px] grid-cols-3 mx-auto h-8">
            <TabsTrigger value="active" className="py-0.5">{adminSettings.tabNameActive} ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="completed" className="py-0.5">{adminSettings.tabNameCompleted} ({completedJobs.length})</TabsTrigger>
            <TabsTrigger value="handover" className="py-0.5">{adminSettings.tabNameHandover}</TabsTrigger>
          </TabsList>

          {/* Tab Content */}

          <TabsContent value="active" className="space-y-3">
            <AddJobForm onAdd={addJob} departments={adminSettings.departments} />

            {activeJobs.length === 0 ? <div className="text-center py-12 text-muted-foreground">No active jobs. Add a job to get started.</div> : <div className="space-y-0.5">
                <div className="grid grid-cols-[180px_140px_1fr_100px_100px_50px] gap-2 px-1.5 py-1 text-xs font-medium text-muted-foreground">
                  <div>Date</div>
                  <div>Department</div>
                  <div>Description</div>
                  <div className="text-center">Complete</div>
                  <div className="text-center">SAP</div>
                  <div></div>
                </div>
                {activeJobs.map(job => <JobRow key={job.id} job={job} onUpdate={updateJob} onDelete={deleteJob} rowHeight={adminSettings.rowHeightActive} textSize={adminSettings.textSizeActive} textBold={adminSettings.textBoldActive} departments={adminSettings.departments} statusColors={{
                    amber: adminSettings.statusColorAmber,
                    lightGreen: adminSettings.statusColorLightGreen,
                    darkGreen: adminSettings.statusColorDarkGreen
                  }} expandPopupSize={adminSettings.expandPopupSize} onResolutionSave={(jobId, resolution) => {
                    // Append resolution to the job description in Active tab only with brackets format
                    const job = activeJobs.find(j => j.id === jobId);
                    if (job) {
                      const updatedDescription = `${job.description} (Resolution: ${resolution})`;
                      updateJob(jobId, { description: updatedDescription });
                    }
                  }} />)}
              </div>}

            {activeJobs.some(job => job.jobComplete && job.sapComplete) && <div className="flex justify-center pt-4">
                <Button onClick={handleArchive} size="lg">
                  <Archive className="mr-2 h-5 w-5" />
                  Save Completed Jobs to Log
                </Button>
              </div>}
          </TabsContent>

          <TabsContent value="completed">
            <CompletedJobsLog 
              jobs={completedJobs} 
              isAdminMode={isAdminMode} 
              onDelete={deleteCompletedJob} 
              onUpdate={updateCompletedJob} 
              rowHeight={adminSettings.rowHeightCompleted} 
              textSize={adminSettings.textSizeCompleted} 
              textBold={adminSettings.textBoldCompleted} 
              departments={["All", ...adminSettings.departments]} 
              statusColors={{
                amber: adminSettings.statusColorAmber,
                lightGreen: adminSettings.statusColorLightGreen,
                darkGreen: adminSettings.statusColorDarkGreen
              }} 
              expandPopupSize={adminSettings.expandPopupSize} 
            />
          </TabsContent>

          <TabsContent value="handover">
            <HandoverTab 
              activeJobs={activeJobs}
              completedJobs={completedJobs}
              shiftDuration={adminSettings.shiftDuration} 
              setDuration={adminSettings.setDuration} 
              rowHeight={adminSettings.rowHeightHandover} 
              textSize={adminSettings.textSizeHandover} 
              textBold={adminSettings.textBoldHandover}
              statusColors={{
                amber: adminSettings.statusColorAmber,
                lightGreen: adminSettings.statusColorLightGreen,
                darkGreen: adminSettings.statusColorDarkGreen
              }} 
            />
          </TabsContent>
        </div>
      </Tabs>

      <div className="max-w-[1600px] mx-auto">
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Authentication</DialogTitle>
              <DialogDescription>Enter the admin password to access admin mode</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input type="password" placeholder="Enter password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                setShowPasswordDialog(false);
                setPasswordInput("");
              }}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Backup</DialogTitle>
              <DialogDescription>
                Choose how to import the backup file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button onClick={() => handleImportConfirm(true)} className="w-full" variant="default">
                Add to Current Jobs
              </Button>
              <Button onClick={() => handleImportConfirm(false)} className="w-full" variant="outline">
                Replace All Jobs
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBackupReminder} onOpenChange={handleBackupReminderClose}>
          <DialogContent className="sm:max-w-md fixed bottom-4 right-4 top-auto left-auto translate-x-0 translate-y-0">
            <DialogHeader>
              <DialogTitle>Please backup the log</DialogTitle>
              {lastSaveTime && <p className="text-sm text-muted-foreground">
                  Last save: {formatDistanceToNow(lastSaveTime, {
                addSuffix: true
              })}
                </p>}
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={handleBackupReminderDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <Button onClick={handleBackupReminderClose} variant="outline" className="w-full">
                Remind Me Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default Index;