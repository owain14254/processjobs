import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useJobStorage } from "@/hooks/useJobStorage";
import { AddJobForm } from "@/components/AddJobForm";
import { JobRow } from "@/components/JobRow";
import { CompletedJobsLog } from "@/components/CompletedJobsLog";
import { Archive, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";

const Index = () => {
  const {
    activeJobs,
    completedJobs,
    addJob,
    updateJob,
    deleteJob,
    archiveCompletedJobs,
    exportData,
    importData,
  } = useJobStorage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");

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
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={mullerLogo} alt="Müller" className="h-12" />
            <div>
              <h1 className="text-3xl font-bold">Job Logging Platform</h1>
              <p className="text-muted-foreground">Track and manage maintenance jobs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Backup
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="active">Active Jobs ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed Jobs ({completedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <AddJobForm onAdd={addJob} />

            {activeJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No active jobs. Add a job to get started.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[200px_180px_1fr_120px_120px_60px] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                  <div>Date</div>
                  <div>Department</div>
                  <div>Description</div>
                  <div className="text-center">Job Complete</div>
                  <div className="text-center">SAP Complete</div>
                  <div></div>
                </div>
                {activeJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onUpdate={updateJob}
                    onDelete={deleteJob}
                  />
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
            <CompletedJobsLog jobs={completedJobs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
