import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
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
import { Archive, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";
import { formatDistanceToNow } from "date-fns";

interface AdminSettings {
  rowHeightActive: number;
  rowHeightCompleted: number;
  rowHeightHandover: number;
  textSizeActive: number;
  textSizeCompleted: number;
  textSizeHandover: number;
  expandPopupSize: number;
  statusColorAmber: string;
  statusColorLightGreen: string;
  statusColorDarkGreen: string;
  tabNameActive: string;
  tabNameCompleted: string;
  tabNameHandover: string;
  appName: string;
  departments: string;
  shiftDuration: number;
  setDuration: number;
  autoSaveInterval: number;
  backupReminderInterval: number;
}

const defaultSettings: AdminSettings = {
  rowHeightActive: 1,
  rowHeightCompleted: 1,
  rowHeightHandover: 1,
  textSizeActive: 2,
  textSizeCompleted: 2,
  textSizeHandover: 2,
  expandPopupSize: 1,
  statusColorAmber: "#f59e0b",
  statusColorLightGreen: "#84cc16",
  statusColorDarkGreen: "#22c55e",
  tabNameActive: "Active",
  tabNameCompleted: "Completed",
  tabNameHandover: "Handover",
  appName: "Job Log",
  departments: "Process,Fruit,Filling,Warehouse,Services,Other",
  shiftDuration: 12,
  setDuration: 4,
  autoSaveInterval: 30,
  backupReminderInterval: 24,
};

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
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(defaultSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    const savedLastSave = localStorage.getItem("lastSaveTime");
    if (savedLastSave) {
      setLastSaveTime(new Date(savedLastSave));
    }
    
    // Load admin settings
    loadAdminSettings();
  }, []);

  const loadAdminSettings = () => {
    const getSetting = (key: string, defaultValue: any) => {
      const value = localStorage.getItem(`admin_${key}`);
      if (value === null) return defaultValue;
      if (key.includes('Color') || key.includes('Name') || key === 'departments' || key === 'appName') {
        return value;
      }
      return Number(value);
    };

    setAdminSettings({
      rowHeightActive: getSetting('rowHeightActive', defaultSettings.rowHeightActive) as number,
      rowHeightCompleted: getSetting('rowHeightCompleted', defaultSettings.rowHeightCompleted) as number,
      rowHeightHandover: getSetting('rowHeightHandover', defaultSettings.rowHeightHandover) as number,
      textSizeActive: getSetting('textSizeActive', defaultSettings.textSizeActive) as number,
      textSizeCompleted: getSetting('textSizeCompleted', defaultSettings.textSizeCompleted) as number,
      textSizeHandover: getSetting('textSizeHandover', defaultSettings.textSizeHandover) as number,
      expandPopupSize: getSetting('expandPopupSize', defaultSettings.expandPopupSize) as number,
      statusColorAmber: getSetting('statusColorAmber', defaultSettings.statusColorAmber) as string,
      statusColorLightGreen: getSetting('statusColorLightGreen', defaultSettings.statusColorLightGreen) as string,
      statusColorDarkGreen: getSetting('statusColorDarkGreen', defaultSettings.statusColorDarkGreen) as string,
      tabNameActive: getSetting('tabNameActive', defaultSettings.tabNameActive) as string,
      tabNameCompleted: getSetting('tabNameCompleted', defaultSettings.tabNameCompleted) as string,
      tabNameHandover: getSetting('tabNameHandover', defaultSettings.tabNameHandover) as string,
      appName: getSetting('appName', defaultSettings.appName) as string,
      departments: getSetting('departments', defaultSettings.departments) as string,
      shiftDuration: getSetting('shiftDuration', defaultSettings.shiftDuration) as number,
      setDuration: getSetting('setDuration', defaultSettings.setDuration) as number,
      autoSaveInterval: getSetting('autoSaveInterval', defaultSettings.autoSaveInterval) as number,
      backupReminderInterval: getSetting('backupReminderInterval', defaultSettings.backupReminderInterval) as number,
    });
  };

  const handleSettingsChange = () => {
    loadAdminSettings();
  };
  return <div className="min-h-screen bg-background p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={mullerLogo} alt="Müller" className="h-12" />
              <div>
                <h1 className="text-3xl font-bold">{adminSettings.appName}</h1>
                <p className="text-muted-foreground">Process Tracker</p>
              </div>
            </div>

            <TabsList className="grid w-full max-w-[500px] grid-cols-3">
              <TabsTrigger value="active">{adminSettings.tabNameActive} ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">{adminSettings.tabNameCompleted} ({completedJobs.length})</TabsTrigger>
              <TabsTrigger value="handover">{adminSettings.tabNameHandover}</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {isAdminMode && <>
                  <AdminSettingsDialog onSettingsChange={handleSettingsChange} />
                  
                </>}
              <Button variant={isAdminMode ? "destructive" : "outline"} size="icon" onClick={toggleAdminMode} title={isAdminMode ? "Exit Admin Mode" : "Admin Mode"}>
                <KeyRound className="h-4 w-4" />
              </Button>
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

          {/* Tab Content */}

          <TabsContent value="active" className="space-y-3">
            <AddJobForm onAdd={addJob} />

            {activeJobs.length === 0 ? <div className="text-center py-12 text-muted-foreground">No active jobs. Add a job to get started.</div> : <div className="space-y-0.5">
                <div className="grid grid-cols-[180px_140px_1fr_100px_100px_50px] gap-2 px-1.5 py-1 text-xs font-medium text-muted-foreground">
                  <div>Date</div>
                  <div>Department</div>
                  <div>Description</div>
                  <div className="text-center">Complete</div>
                  <div className="text-center">SAP</div>
                  <div></div>
                </div>
                {activeJobs.map(job => <JobRow 
                  key={job.id} 
                  job={job} 
                  onUpdate={updateJob} 
                  onDelete={deleteJob} 
                  rowHeight={adminSettings.rowHeightActive} 
                  textSize={adminSettings.textSizeActive} 
                  textBold={textBold}
                  statusColorAmber={adminSettings.statusColorAmber}
                  statusColorLightGreen={adminSettings.statusColorLightGreen}
                  statusColorDarkGreen={adminSettings.statusColorDarkGreen}
                  expandPopupSize={adminSettings.expandPopupSize}
                />)}
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
              textBold={textBold}
              statusColorAmber={adminSettings.statusColorAmber}
              statusColorLightGreen={adminSettings.statusColorLightGreen}
              statusColorDarkGreen={adminSettings.statusColorDarkGreen}
              expandPopupSize={adminSettings.expandPopupSize}
            />
          </TabsContent>

          <TabsContent value="handover">
            <HandoverTab 
              activeJobs={activeJobs} 
              completedJobs={completedJobs} 
              textSize={adminSettings.textSizeHandover} 
              textBold={textBold} 
              rowHeight={adminSettings.rowHeightHandover}
              statusColorAmber={adminSettings.statusColorAmber}
              statusColorLightGreen={adminSettings.statusColorLightGreen}
              statusColorDarkGreen={adminSettings.statusColorDarkGreen}
              expandPopupSize={adminSettings.expandPopupSize}
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