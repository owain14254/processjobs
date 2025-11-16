import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShiftPatternFilter } from "./ShiftPatternFilter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompletedJob } from "@/hooks/useJobStorage";
import { format, getHours } from "date-fns";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
interface CompletedJobsLogProps {
  jobs: CompletedJob[];
  isAdminMode?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<CompletedJob>) => void;
}
const DEPARTMENTS = ["All", "Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];
export const CompletedJobsLog = ({
  jobs,
  isAdminMode = false,
  onDelete,
  onUpdate
}: CompletedJobsLogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [shiftFilter, setShiftFilter] = useState<{
    startDate: Date;
    endDate: Date;
    shift: 'days' | 'nights';
  } | null>(null);
  const [editingJob, setEditingJob] = useState<CompletedJob | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editDepartment, setEditDepartment] = useState("");
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.description.toLowerCase().includes(searchTerm.toLowerCase()) || format(job.date, "dd/MM/yyyy").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === "All" || job.department === departmentFilter;
      const matchesStartDate = !startDate || job.date >= startDate;
      const matchesEndDate = !endDate || job.date <= endDate;

      // Shift filter logic
      let matchesShift = true;
      if (shiftFilter) {
        const jobDate = new Date(job.date);
        const completedAtDate = new Date(job.completedAt);
        const completedHour = getHours(completedAtDate);

        // Check if job date is within the shift filter date range
        const isInDateRange = jobDate >= shiftFilter.startDate && jobDate < shiftFilter.endDate;

        // Check if completion time matches the shift
        const isDayShift = completedHour >= 7 && completedHour < 19; // 7am to 7pm
        const isNightShift = completedHour >= 19 || completedHour < 7; // 7pm to 7am

        matchesShift = isInDateRange && (shiftFilter.shift === 'days' && isDayShift || shiftFilter.shift === 'nights' && isNightShift);
      }
      return matchesSearch && matchesDepartment && matchesStartDate && matchesEndDate && matchesShift;
    });
  }, [jobs, searchTerm, departmentFilter, startDate, endDate, shiftFilter]);
  const handleEdit = (job: CompletedJob) => {
    setEditingJob(job);
    setEditDescription(job.description);
    setEditDate(job.date);
    setEditDepartment(job.department);
  };
  const handleSaveEdit = () => {
    if (editingJob && onUpdate) {
      onUpdate(editingJob.id, {
        description: editDescription,
        date: editDate,
        department: editDepartment
      });
      setEditingJob(null);
      setEditDescription("");
      setEditDate(undefined);
      setEditDepartment("");
    }
  };
  const handleDelete = () => {
    if (deleteJobId && onDelete) {
      onDelete(deleteJobId);
      setDeleteJobId(null);
    }
  };
  return <div className="space-y-4">
      
      
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by description or date..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PP") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PP") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
          </PopoverContent>
        </Popover>
        {(startDate || endDate) && <Button variant="ghost" size="icon" onClick={() => {
        setStartDate(undefined);
        setEndDate(undefined);
      }} title="Clear date filters">
            <X className="h-4 w-4" />
          </Button>}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Completed At</TableHead>
              {isAdminMode && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? <TableRow>
                <TableCell colSpan={isAdminMode ? 5 : 4} className="text-center text-muted-foreground py-8">
                  No completed jobs found
                </TableCell>
              </TableRow> : filteredJobs.map(job => <TableRow key={job.id}>
                  <TableCell>{format(job.date, "dd/MM/yyyy")}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.description}</TableCell>
                  <TableCell>{format(job.completedAt, "dd/MM/yyyy")}</TableCell>
                  {isAdminMode && <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(job)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteJobId(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>}
                </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Completed Job</DialogTitle>
            <DialogDescription>
              Update the details for this completed job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editDepartment} onValueChange={setEditDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d !== "All").map(dept => <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingJob(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Completed Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this completed job? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};