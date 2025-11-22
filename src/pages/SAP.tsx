import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Edit, ChevronDown, ChevronRight, ArrowLeft, Tag, X, Download, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  jobTypes: string[];
  entries: SAPEntry[];
  locationTags: string[];
  expanded?: boolean;
}

const SAP_STORAGE_KEY = "sap_jobs";
const JOB_TYPES_STORAGE_KEY = "sap_job_types";

const DEFAULT_JOB_TYPES = [
  "Valve",
  "Pump",
  "Motor",
  "Electrical",
  "Mechanical",
  "Solenoid",
  "Seals"
];

const DEFAULT_LOCATION_TAGS = [
  "Basement",
  "Gea Matrix",
  "Fruit",
  "Rice",
  "Buffer Tanks",
  "P1",
  "P2"
];

const SAP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SAPJob[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>(DEFAULT_JOB_TYPES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<SAPJob | null>(null);
  const [addingTagToJob, setAddingTagToJob] = useState<string | null>(null);
  const [newLocationTag, setNewLocationTag] = useState("");
  const [isAddingJobType, setIsAddingJobType] = useState(false);
  const [newJobType, setNewJobType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter state
  const [selectedJobTypeFilter, setSelectedJobTypeFilter] = useState<string>("all");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");
  const [showAllJobTypes, setShowAllJobTypes] = useState(false);
  
  // Form state
  const [jobName, setJobName] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntrySapNumber, setEditEntrySapNumber] = useState("");
  const [editEntryLocation, setEditEntryLocation] = useState("");
  const [editEntryDescription, setEditEntryDescription] = useState("");
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
    
    const savedTypes = localStorage.getItem(JOB_TYPES_STORAGE_KEY);
    if (savedTypes) {
      try {
        setJobTypes(JSON.parse(savedTypes));
      } catch (e) {
        console.error("Failed to parse job types", e);
      }
    }
  }, []);

  const saveJobs = (updatedJobs: SAPJob[]) => {
    setJobs(updatedJobs);
    localStorage.setItem(SAP_STORAGE_KEY, JSON.stringify(updatedJobs));
  };

  const saveJobTypes = (types: string[]) => {
    setJobTypes(types);
    localStorage.setItem(JOB_TYPES_STORAGE_KEY, JSON.stringify(types));
  };

  const handleAddJob = () => {
    if (!jobName.trim() || selectedJobTypes.length === 0) {
      toast({
        title: "Missing information",
        description: "Please enter a job name and select at least one job type",
        variant: "destructive"
      });
      return;
    }

    const newJob: SAPJob = {
      id: Date.now().toString(),
      jobName: jobName.trim(),
      jobTypes: selectedJobTypes,
      entries: editingEntries,
      locationTags: [],
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
    if (!editingJob || !jobName.trim() || selectedJobTypes.length === 0) {
      toast({
        title: "Missing information",
        description: "Please enter a job name and select at least one job type",
        variant: "destructive"
      });
      return;
    }

    const updatedJobs = jobs.map(job => 
      job.id === editingJob.id 
        ? { ...job, jobName: jobName.trim(), jobTypes: selectedJobTypes, entries: editingEntries }
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
    if (editingEntryId === entryId) {
      setEditingEntryId(null);
      setEditEntrySapNumber("");
      setEditEntryLocation("");
      setEditEntryDescription("");
    }
  };

  const startEditEntry = (entry: SAPEntry) => {
    setEditingEntryId(entry.id);
    setEditEntrySapNumber(entry.sapNumber);
    setEditEntryLocation(entry.storeLocation);
    setEditEntryDescription(entry.description);
  };

  const saveEditEntry = () => {
    if (!editEntrySapNumber.trim() || !editEntryLocation.trim() || !editEntryDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all entry fields",
        variant: "destructive"
      });
      return;
    }

    setEditingEntries(editingEntries.map(entry =>
      entry.id === editingEntryId
        ? {
            ...entry,
            sapNumber: editEntrySapNumber.trim(),
            storeLocation: editEntryLocation.trim(),
            description: editEntryDescription.trim()
          }
        : entry
    ));

    setEditingEntryId(null);
    setEditEntrySapNumber("");
    setEditEntryLocation("");
    setEditEntryDescription("");

    toast({
      title: "Entry updated",
      description: "SAP entry has been updated"
    });
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEditEntrySapNumber("");
    setEditEntryLocation("");
    setEditEntryDescription("");
  };

  const resetForm = () => {
    setJobName("");
    setSelectedJobTypes([]);
    setEntrySapNumber("");
    setEntryLocation("");
    setEntryDescription("");
    setEditingEntries([]);
    setEditingEntryId(null);
    setEditEntrySapNumber("");
    setEditEntryLocation("");
    setEditEntryDescription("");
  };

  const openEditDialog = (job: SAPJob) => {
    setEditingJob(job);
    setJobName(job.jobName);
    setSelectedJobTypes(job.jobTypes || []);
    setEditingEntries([...job.entries]);
  };

  const addJobType = () => {
    if (!newJobType.trim()) return;
    
    if (jobTypes.includes(newJobType.trim())) {
      toast({
        title: "Job type exists",
        description: "This job type already exists",
        variant: "destructive"
      });
      return;
    }
    
    const updatedTypes = [...jobTypes, newJobType.trim()];
    saveJobTypes(updatedTypes);
    setNewJobType("");
    setIsAddingJobType(false);
    
    toast({
      title: "Job type added",
      description: `"${newJobType.trim()}" has been added`
    });
  };

  const removeJobType = (typeToRemove: string) => {
    if (DEFAULT_JOB_TYPES.includes(typeToRemove)) {
      toast({
        title: "Cannot remove default type",
        description: "Default job types cannot be removed",
        variant: "destructive"
      });
      return;
    }
    
    const updatedTypes = jobTypes.filter(type => type !== typeToRemove);
    saveJobTypes(updatedTypes);
    
    toast({
      title: "Job type removed",
      description: `"${typeToRemove}" has been removed`
    });
  };

  const toggleJobType = (type: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleExport = () => {
    const exportData = {
      jobs,
      jobTypes,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sap-jobs-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup created",
      description: "SAP jobs exported successfully"
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        if (imported.jobs) {
          saveJobs(imported.jobs);
        }
        
        if (imported.jobTypes) {
          saveJobTypes(imported.jobTypes);
        }
        
        toast({
          title: "Data imported",
          description: "SAP jobs loaded successfully from backup"
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Could not load data from the selected file",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredJobs = jobs.filter(job => {
    // Search filter
    const matchesSearch = 
      (job.jobName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.jobTypes || []).some(type => type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.locationTags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.entries || []).some(entry => 
        (entry.sapNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.storeLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Job type filter
    const matchesJobType = selectedJobTypeFilter === "all" || 
      (job.jobTypes || []).includes(selectedJobTypeFilter);
    
    // Location filter
    const matchesLocation = selectedLocationFilter === "all" || 
      (job.locationTags || []).includes(selectedLocationFilter);
    
    return matchesSearch && matchesJobType && matchesLocation;
  });

  const addLocationTag = (jobId: string, tag: string) => {
    if (!tag.trim()) return;
    
    const updatedJobs = jobs.map(job => {
      if (job.id === jobId) {
        const currentTags = job.locationTags || [];
        if (!currentTags.includes(tag.trim())) {
          return { ...job, locationTags: [...currentTags, tag.trim()] };
        }
      }
      return job;
    });
    
    saveJobs(updatedJobs);
    setNewLocationTag("");
    setAddingTagToJob(null);
    
    toast({
      title: "Location tag added",
      description: `Tagged with "${tag.trim()}"`
    });
  };

  const removeLocationTag = (jobId: string, tagToRemove: string) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          locationTags: (job.locationTags || []).filter(tag => tag !== tagToRemove)
        };
      }
      return job;
    });
    
    saveJobs(updatedJobs);
    
    toast({
      title: "Location tag removed"
    });
  };

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

          <div className="flex gap-2">
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
                  <label className="text-sm font-medium">Job Types (Select one or more)</label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[44px]">
                      {selectedJobTypes.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No job types selected</span>
                      ) : (
                        selectedJobTypes.map((type) => (
                          <Badge key={type} variant="default" className="gap-1">
                            {type}
                            <button
                              onClick={() => toggleJobType(type)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {(showAllJobTypes ? jobTypes : jobTypes.slice(0, 3)).map((type) => (
                        <div key={type} className="relative group">
                          <Button
                            type="button"
                            variant={selectedJobTypes.includes(type) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => toggleJobType(type)}
                            className="h-8 pr-8"
                          >
                            {type}
                          </Button>
                          {!DEFAULT_JOB_TYPES.includes(type) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeJobType(type);
                              }}
                              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove job type"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!showAllJobTypes && jobTypes.length > 3 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllJobTypes(true)}
                          className="h-8"
                        >
                          +{jobTypes.length - 3} more
                        </Button>
                      )}
                      {showAllJobTypes && jobTypes.length > 3 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllJobTypes(false)}
                          className="h-8"
                        >
                          Show less
                        </Button>
                      )}
                      {!isAddingJobType ? (
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsAddingJobType(true)}
                          className="h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Type
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Input
                            value={newJobType}
                            onChange={(e) => setNewJobType(e.target.value)}
                            placeholder="New type"
                            className="h-8 w-32"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addJobType();
                              }
                              if (e.key === "Escape") {
                                setIsAddingJobType(false);
                                setNewJobType("");
                              }
                            }}
                          />
                          <Button type="button" size="sm" onClick={addJobType} className="h-8">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">SAP Entries</label>
                  <div className="space-y-2 mt-2">
                    {editingEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 p-3 bg-muted rounded-md">
                        {editingEntryId === entry.id ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              value={editEntrySapNumber}
                              onChange={(e) => setEditEntrySapNumber(e.target.value)}
                              placeholder="SAP Number"
                              className="h-8"
                            />
                            <Input
                              value={editEntryLocation}
                              onChange={(e) => setEditEntryLocation(e.target.value)}
                              placeholder="Store Location"
                              className="h-8"
                            />
                            <Textarea
                              value={editEntryDescription}
                              onChange={(e) => setEditEntryDescription(e.target.value)}
                              placeholder="Description"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditEntry} className="h-8">
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditEntry} className="h-8">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditEntry(entry)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEntry(entry.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
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
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job name, SAP number, location, description, or tags..."
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedJobTypeFilter} onValueChange={setSelectedJobTypeFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Types</SelectItem>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {Array.from(new Set(jobs.flatMap(job => job.locationTags || []))).sort().map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(selectedJobTypeFilter !== "all" || selectedLocationFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedJobTypeFilter("all");
                  setSelectedLocationFilter("all");
                }}
                className="h-9"
              >
                Clear Filters
              </Button>
            )}
          </div>
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
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-lg">{job.jobName || 'Untitled Job'}</CardTitle>
                          {(job.jobTypes || []).map((type) => (
                            <Badge key={type} variant="outline" className="font-normal">
                              {type}
                            </Badge>
                          ))}
                          {(job.entries || []).length > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{(job.entries || []).length} SAP entr{(job.entries || []).length !== 1 ? 'ies' : 'y'}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Location Tags at Job Level */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(job.locationTags || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <button
                                onClick={() => removeLocationTag(job.id, tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Popover open={addingTagToJob === job.id} onOpenChange={(open) => {
                            setAddingTagToJob(open ? job.id : null);
                            if (!open) setNewLocationTag("");
                          }}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => setAddingTagToJob(job.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Tag Location
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-background" align="start">
                              <div className="space-y-3">
                                <label className="text-sm font-medium">Add Location Tag</label>
                                
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">Quick tags:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {DEFAULT_LOCATION_TAGS.map((tag) => (
                                      <Button
                                        key={tag}
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => addLocationTag(job.id, tag)}
                                        className="h-7 text-xs"
                                      >
                                        {tag}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">Or add custom tag:</p>
                                  <div className="flex gap-2">
                                    <Input
                                      value={newLocationTag}
                                      onChange={(e) => setNewLocationTag(e.target.value)}
                                      placeholder="Custom location"
                                      className="h-8"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          addLocationTag(job.id, newLocationTag);
                                        }
                                      }}
                                    />
                                    <Button 
                                      size="sm" 
                                      className="h-8"
                                      onClick={() => addLocationTag(job.id, newLocationTag)}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
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
                
                {job.expanded && (job.entries || []).length > 0 && (
                  <CardContent className="py-2 px-4 border-t">
                    <div className="space-y-2 ml-8">
                      {(job.entries || []).map((entry, index) => (
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
