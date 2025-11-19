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
import { FlagPresetsDialog } from "@/components/FlagPresetsDialog";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFlagPresetsDialog, setShowFlagPresetsDialog] = useState(false);
  
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
    flag1Color: "#dc2626",
    flag2Color: "#f59e0b",
    flag3Color: "#16a34a",
    flag4Color: "#2563eb"
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
    setTextBold,
    flagPresets,
    setFlagPresets,
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
          flag1Color: parsed.flag1Color || "#dc2626",
          flag2Color: parsed.flag2Color || "#f59e0b",
          flag3Color: parsed.flag3Color || "#16a34a",
          flag4Color: parsed.flag4Color || "#2563eb"
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
          flag1Color: parsed.flag1Color || "#dc2626",
          flag2Color: parsed.flag2Color || "#f59e0b",
          flag3Color: parsed.flag3Color || "#16a34a",
          flag4Color: parsed.flag4Color || "#2563eb"
        });
      } catch (e) {
        console.error("Failed to parse admin settings", e);
      }
    }
  };
  return <div className="min-h-screen bg-background p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowFlagPresetsDialog(true)}
                className="hover:opacity-70 transition-opacity"
                title="Manage Flag Presets"
              >
                <img src={mullerLogo} alt="Müller" className="h-12 cursor-pointer" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Job Log</h1>
                <p className="text-muted-foreground">{adminSettings.appName}</p>
              </div>
            </div>

            <TabsList className="grid w-full max-w-[500px] grid-cols-3">
              <TabsTrigger value="active">{adminSettings.tabNameActive} ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">{adminSettings.tabNameCompleted} ({completedJobs.length})</TabsTrigger>
              <TabsTrigger value="handover">{adminSettings.tabNameHandover}</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {isAdminMode && <>
                  <AdminSettingsDialog onSettingsChange={handleSettingsChange} onTestSavePrompt={testBackupReminder} />
                  
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
            <AddJobForm onAdd={addJob} departments={adminSettings.departments} />

            {activeJobs.length === 0 ? <div className="text-center py-12 text-muted-foreground">No active jobs. Add a job to get started.</div> : <div className="space-y-0.5">
                <div className="grid grid-cols-[20px_180px_140px_1fr_100px_100px_50px] gap-2 px-1.5 py-1 text-xs font-medium text-muted-foreground">
                  <div></div>
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
                  }} expandPopupSize={adminSettings.expandPopupSize} flagPresets={flagPresets} />)}
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

        <FlagPresetsDialog 
          open={showFlagPresetsDialog}
          onOpenChange={setShowFlagPresetsDialog}
          presets={flagPresets}
          onPresetsChange={setFlagPresets}
        />
      </div>
    </div>;
};
export default Index;