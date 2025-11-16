import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Job } from "@/hooks/useJobStorage";
import { cn } from "@/lib/utils";

interface AddJobFormProps {
  onAdd: (job: Omit<Job, "id">) => void;
}

const DEPARTMENTS = ["Process", "Fruit", "Filling", "Warehouse", "Services", "Other"];

export const AddJobForm = ({ onAdd }: AddJobFormProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleAdd = () => {
    if (!department || !description.trim()) return;

    onAdd({
      date,
      department,
      description,
      jobComplete: false,
      sapComplete: false,
    });

    // Reset form
    setDate(new Date());
    setDepartment("");
    setDescription("");
  };

  return (
    <div className="grid grid-cols-[200px_180px_1fr_auto] gap-3 items-center p-2 bg-muted rounded-lg">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 justify-start text-left font-normal bg-muted hover:bg-muted/80 text-sm"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
        </PopoverContent>
      </Popover>

      <Select value={department} onValueChange={setDepartment}>
        <SelectTrigger className="h-10 bg-muted text-sm">
          <SelectValue placeholder="Select department" />
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
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter job description..."
        className="h-10 bg-muted text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
          }
        }}
      />

      <Button onClick={handleAdd} disabled={!department || !description.trim()} size="lg">
        <Plus className="mr-2 h-5 w-5" />
        Add Job
      </Button>
    </div>
  );
};
