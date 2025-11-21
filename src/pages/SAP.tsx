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

interface SAPItem {
  id: string;
  description: string;
}

interface SAPJob {
  id: string;
  sapNumber: string;
  location: string;
  description: string;
  items: SAPItem[];
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
  const [sapNumber, setSapNumber] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [editingItems, setEditingItems] = useState<SAPItem[]>([]);

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
    if (!sapNumber.trim() || !location.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newJob: SAPJob = {
      id: Date.now().toString(),
      sapNumber: sapNumber.trim(),
      location: location.trim(),
      description: description.trim(),
      items: editingItems,
      expanded: false
    };

    saveJobs([...jobs, newJob]);
    
    toast({
      title: "Job added",
      description: `SAP ${sapNumber} has been added`
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditJob = () => {
    if (!editingJob || !sapNumber.trim() || !location.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const updatedJobs = jobs.map(job => 
      job.id === editingJob.id 
        ? { ...job, sapNumber: sapNumber.trim(), location: location.trim(), description: description.trim(), items: editingItems }
        : job
    );

    saveJobs(updatedJobs);
    
    toast({
      title: "Job updated",
      description: `SAP ${sapNumber} has been updated`
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

  const addItem = () => {
    if (!newItemDescription.trim()) return;
    
    const newItem: SAPItem = {
      id: Date.now().toString(),
      description: newItemDescription.trim()
    };
    
    setEditingItems([...editingItems, newItem]);
    setNewItemDescription("");
  };

  const removeItem = (itemId: string) => {
    setEditingItems(editingItems.filter(item => item.id !== itemId));
  };

  const resetForm = () => {
    setSapNumber("");
    setLocation("");
    setDescription("");
    setNewItemDescription("");
    setEditingItems([]);
  };

  const openEditDialog = (job: SAPJob) => {
    setEditingJob(job);
    setSapNumber(job.sapNumber);
    setLocation(job.location);
    setDescription(job.description);
    setEditingItems([...job.items]);
  };

  const filteredJobs = jobs.filter(job =>
    job.sapNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.items.some(item => item.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
                  <label className="text-sm font-medium">SAP Number</label>
                  <Input
                    value={sapNumber}
                    onChange={(e) => setSapNumber(e.target.value)}
                    placeholder="e.g., 12345678"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Warehouse A"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Main job description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Items</label>
                  <div className="space-y-2 mt-2">
                    {editingItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <div className="flex-1 p-2 bg-muted rounded-md text-sm">
                          {item.description}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <Input
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Add item description"
                        onKeyDown={(e) => e.key === "Enter" && addItem()}
                      />
                      <Button onClick={addItem} size="icon">
                        <Plus className="h-4 w-4" />
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
            placeholder="Search by SAP number, location, description, or items..."
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
                          <CardTitle className="text-lg">SAP: {job.sapNumber}</CardTitle>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm font-medium text-muted-foreground">{job.location}</span>
                          {job.items.length > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{job.items.length} item{job.items.length !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
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
                
                {job.expanded && job.items.length > 0 && (
                  <CardContent className="py-2 px-4 border-t">
                    <div className="space-y-1 ml-8">
                      {job.items.map((item, index) => (
                        <div key={item.id} className="text-sm py-1.5 px-3 bg-muted/50 rounded">
                          <span className="font-medium text-muted-foreground mr-2">{index + 1}.</span>
                          {item.description}
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
