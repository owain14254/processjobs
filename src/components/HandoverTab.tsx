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
  textSize?: number;
  textBold?: boolean;
  rowHeight?: number;
  statusColorAmber?: string;
  statusColorLightGreen?: string;
  statusColorDarkGreen?: string;
  expandPopupSize?: number;
}

type HandoverMode = "shift" | "set";

const DEPARTMENTS = ["All", "Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];

const getStatusColor = (jobComplete: boolean, sapComplete: boolean, colorAmber?: string, colorLightGreen?: string, colorDarkGreen?: string) => {
  if (jobComplete && sapComplete) return colorDarkGreen || "bg-status-darkGreen";
  if (jobComplete && !sapComplete) return colorLightGreen || "bg-status-lightGreen";
  return colorAmber || "bg-status-amber";
};

export const HandoverTab = ({
  activeJobs,
  completedJobs,
  textSize = 1,
  textBold = false,
  rowHeight = 1,
  statusColorAmber,
  statusColorLightGreen,
  statusColorDarkGreen,
  expandPopupSize = 1
}: HandoverTabProps) => {
  const [mode, setMode] = useState<HandoverMode>("shift");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showOutstandingOnly, setShowOutstandingOnly] = useState(false);

  const textSizeClass = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"][textSize];
  const textWeightClass = textBold ? "font-bold" : "font-normal";
  const cellPadding = ["py-0.5 px-1", "py-1 px-2", "py-2 px-4", "py-3 px-4", "py-4 px-6"][rowHeight];

  const allJobs = useMemo(() => {
    // Combine active and completed jobs
    const combined = [...activeJobs, ...completedJobs];
    return combined;
  }, [activeJobs, completedJobs]);

  const filteredJobs = useMemo(() => {
    let filtered = [...allJobs];

    // Time filtering
    if (mode === "shift") {
      // Last 12 hours
      const cutoff = subHours(new Date(), 12);
      filtered = filtered.filter((job) => job.date >= cutoff);
    } else {
      // Set: last 96 hours
      const cutoff = subHours(new Date(), 96);
      filtered = filtered.filter((job) => job.date >= cutoff);
    }

    // Department filtering
    if (departmentFilter !== "All") {
      filtered = filtered.filter((job) => job.department === departmentFilter);
    }

    // Outstanding jobs filter
    if (showOutstandingOnly) {
      filtered = filtered.filter((job) => !job.jobComplete);
    }

    // Sort by date descending (most recent first)
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allJobs, mode, departmentFilter, showOutstandingOnly]);

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
              filteredJobs.map((job) => {
                const DescriptionCell = () => {
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

                  const statusColor = getStatusColor(job.jobComplete, job.sapComplete, statusColorAmber, statusColorLightGreen, statusColorDarkGreen);
                  const popupSizeClass = ["max-w-lg", "max-w-2xl", "max-w-4xl", "max-w-6xl", "max-w-7xl"][expandPopupSize];

                  return (
                    <>
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
                            onClick={() => setShowDialog(true)}
                          >
                            <Expand className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogContent className={cn(popupSizeClass, statusColor)}>
                          <DialogHeader>
                            <DialogTitle className="text-black">Full Description</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-black break-all whitespace-normal overflow-wrap-anywhere">
                            {job.description}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </>
                  );
                };

                return (
                  <TableRow key={job.id} className={cn(getStatusColor(job.jobComplete, job.sapComplete, statusColorAmber, statusColorLightGreen, statusColorDarkGreen))}>
                    <TableCell
                      className={cn("whitespace-nowrap text-black overflow-hidden text-ellipsis", cellPadding, textSizeClass, textWeightClass)}
                    >
                      {format(job.date, "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className={cn("text-black overflow-hidden text-ellipsis", cellPadding, textSizeClass, textWeightClass)}>
                      {job.department}
                    </TableCell>
                    <TableCell className={cn("text-black", cellPadding, textSizeClass, textWeightClass)}>
                      <DescriptionCell />
                    </TableCell>
                    <TableCell className={cn("text-center text-black", cellPadding, textSizeClass, textWeightClass)}>
                      {job.jobComplete ? "✓" : "—"}
                    </TableCell>
                    <TableCell className={cn("text-center text-black", cellPadding, textSizeClass, textWeightClass)}>
                      {job.sapComplete ? "✓" : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
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
