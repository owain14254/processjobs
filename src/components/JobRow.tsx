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
import { useRef, useEffect, useState } from "react";

interface JobRowProps {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
  rowHeight?: number;
  textSize?: number;
  textBold?: boolean;
}

const DEPARTMENTS = [
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

export const JobRow = ({ job, onUpdate, onDelete, rowHeight = 1, textSize = 1, textBold = false }: JobRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const sizeClasses = {
    padding: ["p-0.5", "p-1", "p-1.5"][rowHeight],
    gap: ["gap-1", "gap-1.5", "gap-2"][rowHeight],
    height: ["h-6", "h-7", "h-8"][rowHeight],
    text: ["text-xs", "text-xs", "text-sm"][rowHeight],
  };

  const textSizeClass = ["text-xs", "text-sm", "text-base"][textSize];
  const textWeightClass = textBold ? "font-bold" : "font-normal";
  
  const statusColor = getStatusColor(job.jobComplete, job.sapComplete);

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

  return (
    <div
      className={cn(
        "grid grid-cols-[180px_140px_1fr_100px_100px_50px] items-center rounded-sm transition-colors",
        sizeClasses.padding,
        sizeClasses.gap,
        getStatusColor(job.jobComplete, job.sapComplete)
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal text-black border-2",
              statusColor,
              statusColor === "bg-status-darkGreen" ? "hover:bg-status-darkGreen/90 border-status-darkGreen" :
              statusColor === "bg-status-lightGreen" ? "hover:bg-status-lightGreen/90 border-status-lightGreen" :
              "hover:bg-status-amber/90 border-status-amber",
              sizeClasses.height,
              textSizeClass,
              textWeightClass
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{format(job.date, "PP")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={job.date}
            onSelect={(date) => date && onUpdate(job.id, { date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select
        value={job.department}
        onValueChange={(value) => onUpdate(job.id, { department: value })}
      >
        <SelectTrigger className={cn(
          statusColor,
          "text-black border-2",
          statusColor === "bg-status-darkGreen" ? "border-status-darkGreen" :
          statusColor === "bg-status-lightGreen" ? "border-status-lightGreen" :
          "border-status-amber",
          sizeClasses.height,
          textSizeClass,
          textWeightClass
        )}>
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

      <div className="relative">
        <Input
          ref={inputRef}
          value={job.description}
          onChange={(e) => onUpdate(job.id, { description: e.target.value })}
          placeholder="Job description..."
          className={cn(
            statusColor,
            "text-black border-2",
            statusColor === "bg-status-darkGreen" ? "border-status-darkGreen" :
            statusColor === "bg-status-lightGreen" ? "border-status-lightGreen" :
            "border-status-amber",
            sizeClasses.height,
            textSizeClass,
            textWeightClass,
            isOverflowing && "pr-8"
          )}
          style={{
            fontSize: textSize === 0 ? '0.75rem' : textSize === 1 ? '0.875rem' : '1rem',
            fontWeight: textBold ? 'bold' : 'normal'
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
            <DialogContent className={cn("max-w-2xl", statusColor)}>
              <DialogHeader>
                <DialogTitle className="text-black">Full Description</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-black break-words whitespace-normal">{job.description}</p>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.jobComplete}
          onCheckedChange={(checked) =>
            onUpdate(job.id, { jobComplete: checked as boolean })
          }
          className="dark:border-black dark:data-[state=checked]:bg-black dark:data-[state=checked]:border-black"
        />
        <span className="text-xs font-medium dark:text-black">Complete</span>
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.sapComplete}
          onCheckedChange={(checked) =>
            onUpdate(job.id, { sapComplete: checked as boolean })
          }
          className="dark:border-black dark:data-[state=checked]:bg-black dark:data-[state=checked]:border-black"
        />
        <span className="text-xs font-medium dark:text-black">SAP</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(job.id)}
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
