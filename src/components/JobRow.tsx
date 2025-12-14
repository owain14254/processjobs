import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Job } from "@/hooks/useJobStorage";
import { CalendarIcon, Trash2, Expand } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState, memo, useCallback, useMemo } from "react";
import { ResolutionDialog } from "./ResolutionDialog";

interface JobRowProps {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
  rowHeight?: number;
  textSize?: number;
  textBold?: boolean;
  departments?: string[];
  statusColors?: {
    amber: string;
    lightGreen: string;
    darkGreen: string;
  };
  expandPopupSize?: number;
  onResolutionSave?: (jobId: string, resolution: string) => void;
}

const getStatusColor = (jobComplete: boolean, sapComplete: boolean, colors: { amber: string; lightGreen: string; darkGreen: string }) => {
  if (jobComplete && sapComplete) return colors.darkGreen;
  if (jobComplete && !sapComplete) return colors.lightGreen;
  return colors.amber;
};

const JobRowComponent = ({ 
  job, 
  onUpdate, 
  onDelete, 
  rowHeight = 2, 
  textSize = 2, 
  textBold = false,
  departments = ["Process", "Fruit", "Filling", "Warehouse", "Services", "Other"],
  statusColors = { amber: "#FFA500", lightGreen: "#90EE90", darkGreen: "#006400" },
  expandPopupSize = 1,
  onResolutionSave
}: JobRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);

  const sizeClasses = useMemo(() => ({
    padding: ["p-0.5", "p-1", "p-1.5", "p-2", "p-3"][rowHeight],
    gap: ["gap-0.5", "gap-1", "gap-1.5", "gap-2", "gap-3"][rowHeight],
    height: ["h-6", "h-7", "h-8", "h-9", "h-10"][rowHeight],
    text: ["text-xs", "text-xs", "text-sm", "text-sm", "text-base"][rowHeight],
  }), [rowHeight]);

  const textSizeClass = useMemo(() => ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"][textSize], [textSize]);
  const textWeightClass = useMemo(() => textBold ? "font-bold" : "font-normal", [textBold]);
  
  const statusColor = useMemo(() => getStatusColor(job.jobComplete, job.sapComplete, statusColors), [job.jobComplete, job.sapComplete, statusColors]);
  const popupSizeClass = useMemo(() => ["max-w-md", "max-w-2xl", "max-w-4xl", "max-w-6xl", "max-w-7xl"][expandPopupSize], [expandPopupSize]);
  const popupHeightClass = useMemo(() => ["max-h-[300px]", "max-h-[400px]", "max-h-[500px]", "max-h-[600px]", "max-h-[700px]"][expandPopupSize], [expandPopupSize]);
  const popupTextClass = useMemo(() => ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"][expandPopupSize], [expandPopupSize]);

  useEffect(() => {
    const checkOverflow = () => {
      if (inputRef.current) {
        setIsOverflowing(inputRef.current.scrollWidth > inputRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [job.description]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) onUpdate(job.id, { date: date.toISOString() });
  }, [job.id, onUpdate]);

  const handleDepartmentChange = useCallback((value: string) => {
    onUpdate(job.id, { department: value });
  }, [job.id, onUpdate]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(job.id, { description: e.target.value });
  }, [job.id, onUpdate]);

  const handleJobCompleteChange = useCallback((checked: boolean) => {
    if (checked && !job.jobComplete) {
      setShowResolutionDialog(true);
    }
    onUpdate(job.id, { jobComplete: checked });
  }, [job.id, job.jobComplete, onUpdate]);

  const handleSapCompleteChange = useCallback((checked: boolean) => {
    onUpdate(job.id, { sapComplete: checked });
  }, [job.id, onUpdate]);

  const handleDeleteClick = useCallback(() => {
    onDelete(job.id);
  }, [job.id, onDelete]);

  const handleResolutionSave = useCallback((resolution: string) => {
    if (onResolutionSave) {
      onResolutionSave(job.id, resolution);
    }
  }, [job.id, onResolutionSave]);

  return (
    <div
      className={cn(
        "grid grid-cols-[180px_140px_1fr_100px_100px_50px] items-center rounded-sm transition-colors relative",
        sizeClasses.padding,
        sizeClasses.gap
      )}
      style={{ backgroundColor: statusColor }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal text-black border-2",
              sizeClasses.height,
              textSizeClass,
              textWeightClass
            )}
            style={{ 
              backgroundColor: statusColor,
              borderColor: statusColor
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{format(new Date(job.date), "PP")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={new Date(job.date)}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select
        value={job.department}
        onValueChange={handleDepartmentChange}
      >
        <SelectTrigger 
          className={cn(
            "text-black border-2",
            sizeClasses.height,
            textSizeClass,
            textWeightClass
          )}
          style={{ 
            backgroundColor: statusColor,
            borderColor: statusColor
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Input
          ref={inputRef}
          value={job.description}
          onChange={handleDescriptionChange}
          placeholder="Job description..."
          className={cn(
            "text-black border break-words",
            sizeClasses.height,
            textWeightClass,
            isOverflowing && "pr-8"
          )}
          style={{
            backgroundColor: statusColor,
            borderColor: statusColor,
            fontSize: `${[12, 14, 16, 18, 20][textSize]}px`,
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "normal"
          }}
        />
        {isOverflowing && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent"
              >
                <Expand className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(popupSizeClass, popupHeightClass, "overflow-y-auto")} style={{ backgroundColor: statusColor }}>
              <DialogHeader>
                <DialogTitle className="text-black">Full Description</DialogTitle>
              </DialogHeader>
              <p className={cn(popupTextClass, "text-black break-words whitespace-normal")} style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>{job.description}</p>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.jobComplete}
          onCheckedChange={handleJobCompleteChange}
          className="dark:border-black dark:data-[state=checked]:bg-black dark:data-[state=checked]:border-black"
        />
        <span className="text-xs font-medium dark:text-black">Complete</span>
      </div>

      <ResolutionDialog
        open={showResolutionDialog}
        onOpenChange={setShowResolutionDialog}
        jobDescription={job.description}
        onSave={handleResolutionSave}
        onSkip={() => {
          // Just close the dialog, checkbox stays ticked
        }}
      />

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.sapComplete}
          onCheckedChange={handleSapCompleteChange}
          className="dark:border-black dark:data-[state=checked]:bg-black dark:data-[state=checked]:border-black"
        />
        <span className="text-xs font-medium dark:text-black">SAP</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        className={cn(
          "hover:bg-destructive hover:text-destructive-foreground dark:text-black dark:hover:text-black",
          sizeClasses.height,
          rowHeight === 0 ? "w-6" : rowHeight === 1 ? "w-7" : "w-8"
        )}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const JobRow = memo(JobRowComponent);
