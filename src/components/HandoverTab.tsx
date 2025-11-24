import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Job, CompletedJob } from "@/hooks/useJobStorage";
import { format, subHours } from "date-fns";
import { cn } from "@/lib/utils";
import { Expand } from "lucide-react";

interface HandoverTabProps {
  activeJobs: Job[];
  completedJobs: CompletedJob[];
  shiftDuration?: number;
  setDuration?: number;
  rowHeight?: number;
  textSize?: number;
  textBold?: boolean;
  statusColors?: {
    amber: string;
    lightGreen: string;
    darkGreen: string;
  };
}

type HandoverMode = "shift" | "set";

const DEPARTMENTS = ["All", "Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];

const getStatusColor = (jobComplete: boolean, sapComplete: boolean, colors: { amber: string; lightGreen: string; darkGreen: string }) => {
  if (jobComplete && sapComplete) return colors.darkGreen;
  if (jobComplete && !sapComplete) return colors.lightGreen;
  return colors.amber;
};

const DescriptionCell = ({ job }: { job: Job }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (cellRef.current) {
        const isOverflow = cellRef.current.scrollWidth > cellRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [job.description]);

  const statusColor = getStatusColor(job.jobComplete, job.sapComplete, { 
    amber: "#FFA500", 
    lightGreen: "#90EE90", 
    darkGreen: "#006400" 
  });
  const popupSizeClass = "max-w-2xl";

  const cellPadding = "py-2 px-4";
  const textSizeClass = "text-sm";
  const textWeightClass = "font-normal";

  return (
    <TableRow style={{ backgroundColor: statusColor }}>
      <TableCell
        className={cn("whitespace-nowrap text-black overflow-hidden text-ellipsis", cellPadding, textSizeClass, textWeightClass)}
      >
        {format(job.date, "dd/MM/yy HH:mm")}
      </TableCell>
      <TableCell className={cn("text-black overflow-hidden text-ellipsis", cellPadding, textSizeClass, textWeightClass)}>
        {job.department}
      </TableCell>
      <TableCell className={cn("text-black", cellPadding, textSizeClass, textWeightClass)}>
        <div className="relative flex items-center gap-2">
          <div
            ref={cellRef}
            className="overflow-hidden whitespace-nowrap text-ellipsis flex-1"
          >
            {job.description}
          </div>
          {isOverflowing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowDialog(true);
              }}
            >
              <Expand className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className={cn(popupSizeClass)} style={{ backgroundColor: statusColor }}>
            <DialogHeader>
              <DialogTitle className="text-black">Full Description</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-black break-all whitespace-normal overflow-wrap-anywhere">
              {job.description}
            </p>
          </DialogContent>
        </Dialog>
      </TableCell>
      <TableCell className={cn("text-center text-black", cellPadding, textSizeClass, textWeightClass)}>
        {job.jobComplete ? "✓" : "—"}
      </TableCell>
      <TableCell className={cn("text-center text-black", cellPadding, textSizeClass, textWeightClass)}>
        {job.sapComplete ? "✓" : "—"}
      </TableCell>
    </TableRow>
  );
};

export const HandoverTab = ({
  activeJobs,
  completedJobs,
  shiftDuration = 12,
  setDuration = 96,
  rowHeight = 1,
  textSize = 1,
  textBold = false,
  statusColors = { amber: "#FFA500", lightGreen: "#90EE90", darkGreen: "#006400" }
}: HandoverTabProps) => {
  const [mode, setMode] = useState<HandoverMode>("shift");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showOutstandingOnly, setShowOutstandingOnly] = useState(false);

  const allJobs = useMemo(() => {
    // Convert completed jobs to Job format and combine with active jobs
    const convertedCompletedJobs: Job[] = completedJobs.map(cJob => ({
      id: cJob.id,
      date: cJob.date,
      department: cJob.department,
      description: cJob.description,
      jobComplete: true,
      sapComplete: true
    }));
    return [...activeJobs, ...convertedCompletedJobs];
  }, [activeJobs, completedJobs]);

  const filteredJobs = useMemo(() => {
    let filtered = [...allJobs];

    // Time filtering
    if (mode === "shift") {
      // Last X hours based on shiftDuration
      const cutoff = subHours(new Date(), shiftDuration);
      filtered = filtered.filter((job) => job.date >= cutoff);
    } else {
      // Set: last X hours based on setDuration
      const cutoff = subHours(new Date(), setDuration);
      filtered = filtered.filter((job) => job.date >= cutoff);
    }

    // Department filtering
    if (departmentFilter !== "All") {
      filtered = filtered.filter((job) => job.department === departmentFilter);
    }

    // Outstanding jobs filter - hide any jobs that are complete (either just job or both)
    if (showOutstandingOnly) {
      filtered = filtered.filter((job) => !job.jobComplete && !job.sapComplete);
    }

    // Sort by date descending (most recent first)
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allJobs, mode, departmentFilter, showOutstandingOnly, shiftDuration, setDuration]);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button variant={mode === "shift" ? "default" : "outline"} onClick={() => setMode("shift")}>
            Shift
          </Button>
          <Button variant={mode === "set" ? "default" : "outline"} onClick={() => setMode("set")}>
            Set
          </Button>
        </div>

        {/* Outstanding Jobs Toggle */}
        <div className="flex items-center gap-2">
          <Switch id="outstanding-only" checked={showOutstandingOnly} onCheckedChange={setShowOutstandingOnly} />
          <Label htmlFor="outstanding-only" className="text-sm font-medium cursor-pointer">
            Outstanding Only
          </Label>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium">Department:</span>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm">
          {mode === "shift" ? (
            <>
              Showing jobs from the last <strong>12 hours</strong>
              {departmentFilter !== "All" && (
                <>
                  {" "}
                  in <strong>{departmentFilter}</strong> department
                </>
              )}
            </>
          ) : (
            <>
              Showing all jobs from the last <strong>96 hours</strong>
              {departmentFilter !== "All" && (
                <>
                  {" "}
                  in <strong>{departmentFilter}</strong> department
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Date/Time</TableHead>
              <TableHead className="w-[12%]">Department</TableHead>
              <TableHead className="w-[48%]">Description</TableHead>
              <TableHead className="w-[12.5%] text-center">Job Complete</TableHead>
              <TableHead className="w-[12.5%] text-center">SAP Complete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No jobs found for the selected period
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <DescriptionCell key={job.id} job={job} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-status-amber" />
          <span>Open Job</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-status-lightGreen" />
          <span>Complete, awaiting SAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-status-darkGreen" />
          <span>Fully completed</span>
        </div>
      </div>
    </div>
  );
};
