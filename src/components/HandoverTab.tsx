import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Job, CompletedJob } from "@/hooks/useJobStorage";
import { format, isWithinInterval, subHours } from "date-fns";
import { cn } from "@/lib/utils";

interface HandoverTabProps {
  activeJobs: Job[];
  completedJobs: CompletedJob[];
}

type HandoverMode = "small" | "large";
type ShiftType = "day" | "night";

const DEPARTMENTS = [
  "All",
  "Process",
  "Fruit",
  "Filling",
  "Warehouse",
  "Services",
  "Other",
];

const getStatusColor = (jobComplete: boolean, sapComplete: boolean) => {
  if (jobComplete && sapComplete) return "bg-status-darkGreen";
  if (jobComplete && !sapComplete) return "bg-status-lightGreen";
  return "bg-status-amber";
};

const getShiftTimeRange = (shiftType: ShiftType): { start: Date; end: Date } => {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (shiftType === "day") {
    // Day shift: 7am - 7pm (last 12 hours ending now)
    const end = new Date();
    const start = subHours(end, 12);
    return { start, end };
  } else {
    // Night shift: 7pm - 7am (last 12 hours ending now)
    const end = new Date();
    const start = subHours(end, 12);
    return { start, end };
  }
};

export const HandoverTab = ({ activeJobs, completedJobs }: HandoverTabProps) => {
  const [mode, setMode] = useState<HandoverMode>("small");
  const [shiftType, setShiftType] = useState<ShiftType>("day");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const allJobs = useMemo(() => {
    // Combine active and completed jobs
    const combined = [
      ...activeJobs,
      ...completedJobs,
    ];
    return combined;
  }, [activeJobs, completedJobs]);

  const filteredJobs = useMemo(() => {
    let filtered = [...allJobs];

    // Time filtering
    if (mode === "small") {
      const { start, end } = getShiftTimeRange(shiftType);
      filtered = filtered.filter((job) =>
        isWithinInterval(job.date, { start, end })
      );
    } else {
      // Large handover: last 96 hours
      const cutoff = subHours(new Date(), 96);
      filtered = filtered.filter((job) => job.date >= cutoff);
    }

    // Department filtering
    if (departmentFilter !== "All") {
      filtered = filtered.filter((job) => job.department === departmentFilter);
    }

    // Sort by date descending (most recent first)
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allJobs, mode, shiftType, departmentFilter]);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "small" ? "default" : "outline"}
            onClick={() => setMode("small")}
          >
            Small Handover (12 hours)
          </Button>
          <Button
            variant={mode === "large" ? "default" : "outline"}
            onClick={() => setMode("large")}
          >
            Large Handover (96 hours)
          </Button>
        </div>

        {/* Shift Selection (Small Handover Only) */}
        {mode === "small" && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium">Shift:</span>
            <Select value={shiftType} onValueChange={(v) => setShiftType(v as ShiftType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day Shift (7am - 7pm)</SelectItem>
                <SelectItem value="night">Night Shift (7pm - 7am)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
          {mode === "small" ? (
            <>
              Showing jobs from the last <strong>12 hours</strong> for{" "}
              <strong>{shiftType === "day" ? "Day" : "Night"} Shift</strong>
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

      {/* Jobs Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Job Complete</TableHead>
              <TableHead className="text-center">SAP Complete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No jobs found for the selected period
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div
                      className={cn(
                        "w-6 h-6 rounded",
                        getStatusColor(job.jobComplete, job.sapComplete)
                      )}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(job.date, "PPP p")}
                  </TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.description}</TableCell>
                  <TableCell className="text-center">
                    {job.jobComplete ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {job.sapComplete ? "✓" : "—"}
                  </TableCell>
                </TableRow>
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
