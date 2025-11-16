import { useState, useRef } from "react";
import { KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useJobStorage } from "@/hooks/useJobStorage";
import { AddJobForm } from "@/components/AddJobForm";
import { JobRow } from "@/components/JobRow";
import { CompletedJobsLog } from "@/components/CompletedJobsLog";
import { HandoverTab } from "@/components/HandoverTab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Archive, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";

const Index = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
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
  } = useJobStorage();
  const { toast } = useToast();

  const handleArchive = () => {
    const count = activeJobs.filter((job) => job.jobComplete && job.sapComplete).length;
    if (count === 0) {
      toast({
        title: "No jobs to archive",
        description: "All jobs must be marked as both Job Complete and SAP Complete to archive.",
      });
      return;
    }
    archiveCompletedJobs();
    toast({
      title: "Jobs archived",
      description: `${count} completed job(s) moved to Completed Jobs Log.`,
    });
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "Backup created",
      description: "Job data exported successfully. Save the file to your USB stick.",
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importData(file)
      .then(() => {
        toast({
          title: "Data imported",
          description: "Job data loaded successfully from backup.",
        });
      })
      .catch(() => {
        toast({
          title: "Import failed",
          description: "Could not load data from the selected file.",
          variant: "destructive",
        });
      });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Process3116") {
      setIsAdminMode(true);
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast({
        title: "Admin Mode Enabled",
        description: "You can now edit and delete completed jobs",
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again",
        variant: "destructive",
      });
      setPasswordInput("");
    }
  };

  const toggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      toast({
        title: "Admin Mode Disabled",
      });
    } else {
      setShowPasswordDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={mullerLogo} alt="Müller" className="h-12" />
              <div>
                <h1 className="text-3xl font-bold">Job Log</h1>
                <p className="text-muted-foreground"> </p>
              </div>
            </div>

            <TabsList className="grid w-full max-w-[500px] grid-cols-3">
              <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
              <TabsTrigger value="handover">Handover</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant={isAdminMode ? "destructive" : "outline"}
                size="icon"
                onClick={toggleAdminMode}
                title={isAdminMode ? "Exit Admin Mode" : "Admin Mode"}
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button onClick={handleExport} variant="outline" size="icon" title="Export Backup">
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

            {activeJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No active jobs. Add a job to get started.</div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-[180px_140px_1fr_100px_100px_50px] gap-2 px-1.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <div>Date</div>
                  <div>Department</div>
                  <div>Description</div>
                  <div className="text-center">Complete</div>
                  <div className="text-center">SAP</div>
                  <div></div>
                </div>
                {activeJobs.map((job) => (
                  <JobRow key={job.id} job={job} onUpdate={updateJob} onDelete={deleteJob} />
                ))}
              </div>
            )}

            {activeJobs.some((job) => job.jobComplete && job.sapComplete) && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleArchive} size="lg">
                  <Archive className="mr-2 h-5 w-5" />
                  Save Completed Jobs to Log
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <CompletedJobsLog
              jobs={completedJobs}
              isAdminMode={isAdminMode}
              onDelete={deleteCompletedJob}
              onUpdate={updateCompletedJob}
            />
          </TabsContent>

          <TabsContent value="handover">
            <HandoverTab activeJobs={activeJobs} completedJobs={completedJobs} />
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
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPasswordInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
