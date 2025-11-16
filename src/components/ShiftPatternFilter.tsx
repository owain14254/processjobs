import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, addDays, startOfDay, startOfMonth, endOfMonth, getDay, isSameDay, isWithinInterval, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShiftPatternFilterProps {
  onFilterChange: (filter: { startDate: Date; endDate: Date; shift: 'days' | 'nights' } | null) => void;
}

export const ShiftPatternFilter = ({ onFilterChange }: ShiftPatternFilterProps) => {
  const [patternStartDate, setPatternStartDate] = useState<Date | undefined>(undefined);
  const [selectedBlock, setSelectedBlock] = useState<{ start: Date; end: Date; shift: 'days' | 'nights' } | null>(null);
  const [activeShift, setActiveShift] = useState<'days' | 'nights'>('days');

  const getBlockForDate = (date: Date, patternStart: Date): { blockStart: Date; blockEnd: Date; isActive: boolean } | null => {
    const daysDiff = Math.floor((date.getTime() - patternStart.getTime()) / (1000 * 60 * 60 * 24));
    const cyclePosition = ((daysDiff % 8) + 8) % 8; // Handle negative numbers correctly
    
    const isActive = cyclePosition < 4;
    const blockStartOffset = daysDiff - cyclePosition;
    const blockStart = addDays(patternStart, blockStartOffset);
    const blockEnd = addDays(blockStart, 3);
    
    return { blockStart, blockEnd, isActive };
  };

  const handleDateClick = (date: Date) => {
    if (!patternStartDate) return;
    
    const block = getBlockForDate(date, patternStartDate);
    if (!block || !block.isActive) return;
    
    const filter = {
      start: block.blockStart,
      end: block.blockEnd,
      shift: activeShift,
    };
    
    setSelectedBlock(filter);
    onFilterChange({
      startDate: block.blockStart,
      endDate: addDays(block.blockEnd, 1),
      shift: activeShift,
    });
  };

  const handleClearFilter = () => {
    setSelectedBlock(null);
    onFilterChange(null);
  };

  const handleSetPatternStart = (date: Date | undefined) => {
    setPatternStartDate(date);
    setSelectedBlock(null);
    onFilterChange(null);
  };

  const renderMonth = (monthStart: Date) => {
    if (!patternStartDate) return null;

    const monthEnd = endOfMonth(monthStart);
    const startDay = getDay(startOfMonth(monthStart));
    const daysInMonth = monthEnd.getDate();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const block = getBlockForDate(date, patternStartDate);
      const isInSelectedBlock = selectedBlock && isSameDay(date, selectedBlock.start) || 
        (selectedBlock && isWithinInterval(date, { start: selectedBlock.start, end: selectedBlock.end }));
      
      days.push(
        <button
          key={day}
          onClick={() => block?.isActive && handleDateClick(date)}
          disabled={!block?.isActive}
          className={cn(
            "aspect-square flex items-center justify-center text-sm border transition-colors",
            block?.isActive && "bg-yellow-300 hover:bg-yellow-400 cursor-pointer dark:bg-yellow-600 dark:hover:bg-yellow-700",
            !block?.isActive && "bg-gray-200 dark:bg-gray-700 cursor-not-allowed",
            isInSelectedBlock && "ring-2 ring-primary ring-inset",
            "border-gray-300 dark:border-gray-600"
          )}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="space-y-2">
        <div className="text-center font-medium text-sm text-muted-foreground">
          {format(monthStart, 'MMMM')}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="aspect-square flex items-center justify-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const today = new Date();
  const months = [
    startOfMonth(addMonths(today, -1)),
    startOfMonth(today),
    startOfMonth(addMonths(today, 1)),
  ];

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Shift Pattern Filter</Label>
        {selectedBlock && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filter
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {patternStartDate ? format(patternStartDate, "dd/MM/yyyy") : "Pattern Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={patternStartDate}
              onSelect={handleSetPatternStart}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Tabs value={activeShift} onValueChange={(v) => {
          setActiveShift(v as 'days' | 'nights');
          setSelectedBlock(null);
          onFilterChange(null);
        }}>
          <TabsList>
            <TabsTrigger value="days">Days (7am-7pm)</TabsTrigger>
            <TabsTrigger value="nights">Nights (7pm-7am)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {patternStartDate && (
        <div>
          <div className="text-sm text-muted-foreground mb-3">
            Click a 4-day block (yellow) to filter jobs from that {activeShift} shift:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {months.map((month, idx) => (
              <div key={idx}>{renderMonth(month)}</div>
            ))}
          </div>
        </div>
      )}

      {selectedBlock && (
        <div className="text-sm text-muted-foreground">
          Showing {selectedBlock.shift} shift jobs from {format(selectedBlock.start, 'dd/MM/yyyy')} to {format(selectedBlock.end, 'dd/MM/yyyy')}
        </div>
      )}
    </div>
  );
};
