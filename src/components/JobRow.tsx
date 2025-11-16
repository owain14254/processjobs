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
import { TableCell, TableRow } from "@/components/ui/table";
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
  const textSizeClass = ["text-xs", "text-sm", "text-base"][textSize];
  const textWeightClass = textBold ? "font-bold" : "font-normal";
  const cellPadding = ["py-1 px-2", "py-2 px-4", "py-3 px-4"][rowHeight];
  
  const statusColor = getStatusColor(job.jobComplete, job.sapComplete);

  return (
    <TableRow className={cn(statusColor)}>
      <TableCell className={cn("whitespace-nowrap", cellPadding)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal text-black hover:bg-black/5 h-auto p-1",
                textSizeClass,
                textWeightClass
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{format(job.date, "PPP p")}</span>
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
      </TableCell>

      <TableCell className={cn(cellPadding)}>
        <Select
          value={job.department}
          onValueChange={(value) => onUpdate(job.id, { department: value })}
        >
          <SelectTrigger className={cn(
            "text-black border-none bg-transparent hover:bg-black/5 h-auto",
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
      </TableCell>

      <TableCell className={cn(cellPadding)}>
        <Input
          value={job.description}
          onChange={(e) => onUpdate(job.id, { description: e.target.value })}
          placeholder="Job description..."
          className={cn(
            "text-black border-none bg-transparent hover:bg-black/5 focus-visible:ring-1 focus-visible:ring-ring h-auto",
            textSizeClass,
            textWeightClass
          )}
        />
      </TableCell>

      <TableCell className={cn("text-center", cellPadding)}>
        <div className="flex items-center justify-center gap-1.5">
          <Checkbox
            checked={job.jobComplete}
            onCheckedChange={(checked) =>
              onUpdate(job.id, { jobComplete: checked as boolean })
            }
          />
        </div>
      </TableCell>

      <TableCell className={cn("text-center", cellPadding)}>
        <div className="flex items-center justify-center gap-1.5">
          <Checkbox
            checked={job.sapComplete}
            onCheckedChange={(checked) =>
              onUpdate(job.id, { sapComplete: checked as boolean })
            }
          />
        </div>
      </TableCell>

      <TableCell className={cn(cellPadding)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(job.id)}
          className="hover:bg-destructive hover:text-destructive-foreground h-auto w-auto p-1"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
