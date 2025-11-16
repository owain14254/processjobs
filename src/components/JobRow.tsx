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
import { Job } from "@/hooks/useJobStorage";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const sizeClasses = {
    padding: ["p-1", "p-1.5", "p-2"][rowHeight],
    gap: ["gap-1.5", "gap-2", "gap-3"][rowHeight],
    height: ["h-7", "h-8", "h-9"][rowHeight],
    text: ["text-xs", "text-xs", "text-sm"][rowHeight],
  };

  const textSizeClass = ["text-xs", "text-sm", "text-base"][textSize];
  const textWeightClass = textBold ? "font-bold" : "font-normal";
  
  const statusColor = getStatusColor(job.jobComplete, job.sapComplete);
  const bgColorClass = statusColor.replace("bg-", "");

  return (
    <div
      className={cn(
        "grid grid-cols-[180px_140px_1fr_100px_100px_50px] items-center rounded-lg transition-colors",
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
              `bg-${bgColorClass} hover:bg-${bgColorClass}/90 border-${bgColorClass}`,
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
          `bg-${bgColorClass} text-black border-2 border-${bgColorClass}`,
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

      <Input
        value={job.description}
        onChange={(e) => onUpdate(job.id, { description: e.target.value })}
        placeholder="Job description..."
        className={cn(
          `bg-${bgColorClass} text-black border-2 border-${bgColorClass}`,
          sizeClasses.height,
          textSizeClass,
          textWeightClass
        )}
      />

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.jobComplete}
          onCheckedChange={(checked) =>
            onUpdate(job.id, { jobComplete: checked as boolean })
          }
        />
        <span className="text-xs font-medium">Complete</span>
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <Checkbox
          checked={job.sapComplete}
          onCheckedChange={(checked) =>
            onUpdate(job.id, { sapComplete: checked as boolean })
          }
        />
        <span className="text-xs font-medium">SAP</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(job.id)}
        className={cn(
          "hover:bg-destructive hover:text-destructive-foreground",
          sizeClasses.height,
          rowHeight === 0 ? "w-7" : rowHeight === 1 ? "w-8" : "w-9"
        )}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
