import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Edit, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";

interface SAPEntry {
  id: string;
  sapNumber: string;
  storeLocation: string;
  description: string;
}

interface SAPJob {
  id: string;
  jobName: string;
  entries: SAPEntry[];
  expanded?: boolean;
}

const SAP_STORAGE_KEY = "sap_jobs";

const SAP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SAPJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<SAPJob | null>(null);
  
  // Form state
  const [jobName, setJobName] = useState("");
  const [entrySapNumber, setEntrySapNumber] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [editingEntries, setEditingEntries] = useState<SAPEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SAP_STORAGE_KEY);
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse SAP jobs", e);
      }
    }
  }, []);

  const saveJobs = (updatedJobs: SAPJob[]) => {
    setJobs(updatedJobs);
    localStorage.setItem(SAP_STORAGE_KEY, JSON.stringify(updatedJobs));
  };

  const handleAddJob = () => {
    if (!jobName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a job name",
        variant: "destructive"
      });
      return;
    }

    const newJob: SAPJob = {
      id: Date.now().toString(),
      jobName: jobName.trim(),
      entries: editingEntries,
      expanded: false
    };

    saveJobs([...jobs, newJob]);
    
    toast({
      title: "Job added",
      description: `${jobName} has been added`
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditJob = () => {
    if (!editingJob || !jobName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a job name",
        variant: "destructive"
      });
      return;
    }

    const updatedJobs = jobs.map(job => 
      job.id === editingJob.id 
        ? { ...job, jobName: jobName.trim(), entries: editingEntries }
        : job
    );

    saveJobs(updatedJobs);
    
    toast({
      title: "Job updated",
      description: `${jobName} has been updated`
    });

    resetForm();
    setEditingJob(null);
  };

  const handleDeleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    saveJobs(updatedJobs);
    
    toast({
      title: "Job deleted",
      description: "The job has been removed"
    });
  };

  const toggleExpand = (jobId: string) => {
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, expanded: !job.expanded } : job
    );
    saveJobs(updatedJobs);
  };

  const addEntry = () => {
    if (!entrySapNumber.trim() || !entryLocation.trim() || !entryDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all entry fields",
        variant: "destructive"
      });
      return;
    }
    
    const newEntry: SAPEntry = {
      id: Date.now().toString(),
      sapNumber: entrySapNumber.trim(),
      storeLocation: entryLocation.trim(),
      description: entryDescription.trim()
    };
    
    setEditingEntries([...editingEntries, newEntry]);
    setEntrySapNumber("");
    setEntryLocation("");
    setEntryDescription("");
  };

  const removeEntry = (entryId: string) => {
    setEditingEntries(editingEntries.filter(entry => entry.id !== entryId));
  };

  const resetForm = () => {
    setJobName("");
    setEntrySapNumber("");
    setEntryLocation("");
    setEntryDescription("");
    setEditingEntries([]);
  };

  const openEditDialog = (job: SAPJob) => {
    setEditingJob(job);
    setJobName(job.jobName);
    setEditingEntries([...job.entries]);
  };

  const filteredJobs = jobs.filter(job =>
    (job.jobName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.entries || []).some(entry => 
      (entry.sapNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.storeLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={mullerLogo} alt="Müller" className="h-12" />
            <div>
              <h1 className="text-3xl font-bold">SAP Common Jobs</h1>
              <p className="text-muted-foreground">Manage frequently used SAP jobs</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen || editingJob !== null} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingJob(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Job Name</label>
                  <Input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g., Common Maintenance Tasks"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SAP Entries</label>
                  <div className="space-y-2 mt-2">
                    {editingEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 p-3 bg-muted rounded-md">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">SAP:</span>
                            <span className="text-sm font-medium">{entry.sapNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">Location:</span>
                            <span className="text-sm">{entry.storeLocation}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{entry.description}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(entry.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="space-y-2 p-3 border rounded-md">
                      <p className="text-xs font-medium text-muted-foreground">Add New SAP Entry</p>
                      <Input
                        value={entrySapNumber}
                        onChange={(e) => setEntrySapNumber(e.target.value)}
                        placeholder="SAP Number"
                        className="h-9"
                      />
                      <Input
                        value={entryLocation}
                        onChange={(e) => setEntryLocation(e.target.value)}
                        placeholder="Store Location"
                        className="h-9"
                      />
                      <Textarea
                        value={entryDescription}
                        onChange={(e) => setEntryDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                      />
                      <Button onClick={addEntry} size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingJob(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingJob ? handleEditJob : handleAddJob}>
                    {editingJob ? "Update" : "Add"} Job
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job name, SAP number, location, or description..."
            className="pl-10"
          />
        </div>

        {/* Jobs List */}
        <div className="space-y-2">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? "No jobs found matching your search" : "No jobs added yet. Click 'Add Job' to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mt-0.5"
                        onClick={() => toggleExpand(job.id)}
                      >
                        {job.expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-lg">{job.jobName}</CardTitle>
                          {job.entries.length > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{job.entries.length} SAP entr{job.entries.length !== 1 ? 'ies' : 'y'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(job)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteJob(job.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {job.expanded && job.entries.length > 0 && (
                  <CardContent className="py-2 px-4 border-t">
                    <div className="space-y-2 ml-8">
                      {job.entries.map((entry, index) => (
                        <div key={entry.id} className="text-sm py-2 px-3 bg-muted/50 rounded space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-muted-foreground">{index + 1}.</span>
                            <span className="text-xs font-semibold text-muted-foreground">SAP:</span>
                            <span className="font-medium">{entry.sapNumber}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-xs font-semibold text-muted-foreground">Location:</span>
                            <span>{entry.storeLocation}</span>
                          </div>
                          <div className="ml-4 text-muted-foreground">{entry.description}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SAP;
