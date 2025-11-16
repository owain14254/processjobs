import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, addDays, startOfDay, differenceInDays, isWithinInterval } from "date-fns";
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

  const generateShiftBlocks = (startDate: Date, shift: 'days' | 'nights') => {
    const blocks = [];
    const today = startOfDay(new Date());
    
    // Generate blocks for past 3 months and future 1 month
    const startRange = addDays(today, -90);
    const endRange = addDays(today, 30);
    
    // Calculate which 4-day block the pattern start date belongs to
    let currentBlockStart = startOfDay(startDate);
    
    // Move back to find the block that contains startRange
    while (currentBlockStart > startRange) {
      currentBlockStart = addDays(currentBlockStart, -8); // 4 days on + 4 days off
    }
    
    // Generate blocks
    let blockIndex = 0;
    while (currentBlockStart <= endRange) {
      const blockEnd = addDays(currentBlockStart, 3); // 4-day block (inclusive)
      
      // Only add blocks that are within our range
      if (blockEnd >= startRange) {
        blocks.push({
          start: currentBlockStart,
          end: blockEnd,
          label: `${format(currentBlockStart, 'dd/MM')} - ${format(blockEnd, 'dd/MM')}`,
          isActive: blockIndex % 2 === 0, // Every other block is active (4 on, 4 off)
        });
      }
      
      currentBlockStart = addDays(currentBlockStart, 4);
      blockIndex++;
    }
    
    return blocks.filter(block => block.isActive);
  };

  const handleBlockClick = (block: { start: Date; end: Date; label: string }) => {
    const filter = {
      start: block.start,
      end: block.end,
      shift: activeShift,
    };
    
    setSelectedBlock(filter);
    onFilterChange({
      startDate: block.start,
      endDate: addDays(block.end, 1), // Include the end date fully
      shift: activeShift,
    });
  };

  const handleClearFilter = () => {
    setSelectedBlock(null);
    onFilterChange(null);
  };

  const handleSetPatternStart = (date: Date | undefined) => {
    setPatternStartDate(date);
    // Clear selected block when pattern changes
    setSelectedBlock(null);
    onFilterChange(null);
  };

  const blocks = patternStartDate ? generateShiftBlocks(patternStartDate, activeShift) : [];

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

      <div className="flex items-center gap-4">
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

      {patternStartDate && blocks.length > 0 && (
        <div>
          <div className="text-sm text-muted-foreground mb-2">
            Click a 4-day block to filter jobs from that {activeShift} shift:
          </div>
          <div className="flex flex-wrap gap-2">
            {blocks.map((block, index) => (
              <Button
                key={index}
                variant={selectedBlock?.start.getTime() === block.start.getTime() ? "default" : "outline"}
                size="sm"
                onClick={() => handleBlockClick(block)}
                className="font-mono"
              >
                {block.label}
              </Button>
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
