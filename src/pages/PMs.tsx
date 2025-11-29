import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Search, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { usePMStorage, PMJob } from "@/hooks/usePMStorage";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO, isAfter, isBefore, addMonths, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import mullerLogo from "@/assets/muller-logo.png";

const PMs = () => {
  const navigate = useNavigate();
  const { pmJobs, isLoading, importData, exportData, updatePM } = usePMStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedPM, setSelectedPM] = useState<PMJob | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [selectedPMs, setSelectedPMs] = useState<Set<string>>(new Set());

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return parseISO(dateStr);
    } catch {
      return null;
    }
  };

  const getStatusColor = (releaseDate: string, completed: boolean): string => {
    if (completed) return "";
    const release = parseDate(releaseDate);
    if (!release) return "";

    const now = new Date();
    const oneWeekFromNow = addWeeks(now, 1);
    const oneMonthFromNow = addMonths(now, 1);

    if (isBefore(release, oneWeekFromNow)) {
      return "bg-red-500/20 border-red-500/40";
    } else if (isBefore(release, oneMonthFromNow)) {
      return "bg-amber-500/20 border-amber-500/40";
    }
    return "";
  };

  const { activePMs, completedPMs } = useMemo(() => {
    let filtered = pmJobs;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pm) =>
          pm.functlocdescrip?.toLowerCase().includes(search) ||
          pm.order?.toLowerCase().includes(search) ||
          pm.description?.toLowerCase().includes(search) ||
          pm.objectDescription?.toLowerCase().includes(search)
      );
    }

    if (startDate || endDate) {
      filtered = filtered.filter((pm) => {
        const release = parseDate(pm.release);
        if (!release) return false;

        if (startDate && isBefore(release, startDate)) return false;
        if (endDate && isAfter(release, endDate)) return false;
        return true;
      });
    }

    const active = filtered
      .filter((pm) => !pm.completed)
      .sort((a, b) => {
        const dateA = parseDate(a.release);
        const dateB = parseDate(b.release);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

    const completed = filtered
      .filter((pm) => pm.completed)
      .sort((a, b) => {
        const dateA = parseDate(a.release);
        const dateB = parseDate(b.release);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    return { activePMs: active, completedPMs: completed };
  }, [pmJobs, searchTerm, startDate, endDate]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImportFile(file);
    setShowImportDialog(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = async (merge: boolean) => {
    if (!pendingImportFile) return;
    try {
      await importData(pendingImportFile, merge);
      toast({
        title: "Data imported",
        description: merge ? "PM jobs added to current data." : "PM jobs loaded successfully.",
      });
      setShowImportDialog(false);
      setPendingImportFile(null);
    } catch {
      toast({
        title: "Import failed",
        description: "Could not load data from the selected file.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "Export successful",
      description: "PM jobs exported successfully.",
    });
  };

  const handleRowClick = (pm: PMJob) => {
    setSelectedPM(pm);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPM) return;
    updatePM(selectedPM.order, selectedPM);
    toast({
      title: "PM updated",
      description: "Changes saved successfully.",
    });
    setEditDialogOpen(false);
    setSelectedPM(null);
  };

  const handleToggleComplete = () => {
    if (!selectedPM) return;
    const updated = { ...selectedPM, completed: !selectedPM.completed };
    setSelectedPM(updated);
    updatePM(selectedPM.order, { completed: !selectedPM.completed });
    toast({
      title: selectedPM.completed ? "PM marked as active" : "PM marked as complete",
    });
  };

  const handleCheckboxChange = (order: string, checked: boolean) => {
    const newSelected = new Set(selectedPMs);
    if (checked) {
      newSelected.add(order);
    } else {
      newSelected.delete(order);
    }
    setSelectedPMs(newSelected);
  };

  const handleSaveCompletions = () => {
    selectedPMs.forEach((order) => {
      updatePM(order, { completed: true });
    });
    toast({
      title: "PM jobs updated",
      description: `${selectedPMs.size} job(s) marked as complete.`,
    });
    setSelectedPMs(new Set());
  };

  const getHeatMapData = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysOfWeek.map((day) => {
      const count = activePMs.filter((pm) => {
        const release = parseDate(pm.release);
        return release && isSameDay(release, day);
      }).length;
      return { date: day, count };
    });
  };

  const heatMapData = getHeatMapData();

  const PMTable = ({ pms, showStatus }: { pms: PMJob[]; showStatus: boolean }) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium w-12">Complete</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Functional Location</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Order</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Release</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Object Description</th>
          </tr>
        </thead>
        <tbody>
          {pms.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No PM jobs found
              </td>
            </tr>
          ) : (
            pms.map((pm) => (
              <tr
                key={pm.order}
                className={cn(
                  "border-t hover:bg-muted/30 transition-colors",
                  showStatus && getStatusColor(pm.release, pm.completed || false)
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedPMs.has(pm.order)}
                    onCheckedChange={(checked) => handleCheckboxChange(pm.order, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => handleRowClick(pm)}>{pm.functlocdescrip}</td>
                <td className="px-4 py-3 text-sm font-medium cursor-pointer" onClick={() => handleRowClick(pm)}>{pm.order}</td>
                <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => handleRowClick(pm)}>{pm.release}</td>
                <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => handleRowClick(pm)}>{pm.description}</td>
                <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => handleRowClick(pm)}>{pm.objectDescription}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={mullerLogo} alt="Muller Logo" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">PM's</h1>
              <p className="text-sm text-muted-foreground">Preventive Maintenance Jobs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 border rounded-lg p-2">
              {heatMapData.map((day, idx) => {
                const intensity = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count === 2 ? 2 : 3;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-8 h-8 rounded flex flex-col items-center justify-center text-xs",
                      intensity === 0 && "bg-muted/30",
                      intensity === 1 && "bg-amber-500/30",
                      intensity === 2 && "bg-amber-500/60",
                      intensity === 3 && "bg-red-500/60"
                    )}
                    title={`${format(day.date, "EEE dd")}: ${day.count} PM(s)`}
                  >
                    <div className="font-medium">{format(day.date, "dd")}</div>
                    <div className="text-[10px] opacity-70">{format(day.date, "EEE")}</div>
                  </div>
                );
              })}
            </div>
            <ThemeToggle />
            <Button onClick={handleExport} variant="outline" size="icon" title="Export PM Jobs">
              <Download className="h-4 w-4" />
            </Button>
            <label>
              <Button variant="outline" size="icon" asChild title="Import PM Jobs">
                <span>
                  <Upload className="h-4 w-4" />
                  <input
                    ref={fileInputRef}
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

        {selectedPMs.size > 0 && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium">
              {selectedPMs.size} PM job(s) selected
            </p>
            <Button onClick={handleSaveCompletions} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PM jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Clear Dates
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading PM jobs...</div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active">Active ({activePMs.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedPMs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
              <PMTable pms={activePMs} showStatus={true} />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <PMTable pms={completedPMs} showStatus={false} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit PM Job</DialogTitle>
            <DialogDescription>Order: {selectedPM?.order}</DialogDescription>
          </DialogHeader>
          {selectedPM && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Functional Location</Label>
                  <Input
                    value={selectedPM.functlocdescrip}
                    onChange={(e) =>
                      setSelectedPM({ ...selectedPM, functlocdescrip: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Release Date</Label>
                  <Input
                    value={selectedPM.release}
                    onChange={(e) => setSelectedPM({ ...selectedPM, release: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedPM.description}
                  onChange={(e) => setSelectedPM({ ...selectedPM, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Object Description</Label>
                <Textarea
                  value={selectedPM.objectDescription}
                  onChange={(e) =>
                    setSelectedPM({ ...selectedPM, objectDescription: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleToggleComplete}>
                  Mark as {selectedPM.completed ? "Active" : "Complete"}
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import PM Jobs</DialogTitle>
            <DialogDescription>
              Would you like to merge with existing data or replace it?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleImportConfirm(true)}>
              Merge
            </Button>
            <Button onClick={() => handleImportConfirm(false)}>Replace</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PMs;
