import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Save } from "lucide-react";

export interface ShiftPattern {
  id: string;
  name: string;
  color: string;
  referenceDate: string;
  cycleLength: number;
  dayStartCycleDay: number;
  nightStartCycleDay: number;
}

interface ShiftPatternConfigProps {
  patterns: ShiftPattern[];
  onPatternsChange: (patterns: ShiftPattern[]) => void;
}

const defaultColors = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#f59e0b", // Orange
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
];

export const defaultShiftPatterns: ShiftPattern[] = [
  {
    id: "1",
    name: "Shift 1",
    color: "#3b82f6",
    referenceDate: "2025-06-22",
    cycleLength: 16,
    dayStartCycleDay: 0,
    nightStartCycleDay: 8,
  },
  {
    id: "2",
    name: "Shift 2",
    color: "#22c55e",
    referenceDate: "2025-06-22",
    cycleLength: 16,
    dayStartCycleDay: 4,
    nightStartCycleDay: 12,
  },
  {
    id: "3",
    name: "Shift 3",
    color: "#ef4444",
    referenceDate: "2025-06-22",
    cycleLength: 16,
    dayStartCycleDay: 8,
    nightStartCycleDay: 0,
  },
  {
    id: "4",
    name: "Shift 4",
    color: "#f59e0b",
    referenceDate: "2025-06-22",
    cycleLength: 16,
    dayStartCycleDay: 12,
    nightStartCycleDay: 4,
  },
];

const ShiftPatternConfig = ({ patterns, onPatternsChange }: ShiftPatternConfigProps) => {
  const [localPatterns, setLocalPatterns] = useState<ShiftPattern[]>(patterns);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalPatterns(patterns);
    setHasChanges(false);
  }, [patterns]);

  const updatePattern = (id: string, field: keyof ShiftPattern, value: string | number) => {
    setLocalPatterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setHasChanges(true);
  };

  const addPattern = () => {
    const newId = String(Math.max(...localPatterns.map((p) => parseInt(p.id))) + 1);
    const newPattern: ShiftPattern = {
      id: newId,
      name: `Shift ${newId}`,
      color: defaultColors[(localPatterns.length) % defaultColors.length],
      referenceDate: "2025-06-22",
      cycleLength: 16,
      dayStartCycleDay: 0,
      nightStartCycleDay: 8,
    };
    setLocalPatterns([...localPatterns, newPattern]);
    setHasChanges(true);
  };

  const removePattern = (id: string) => {
    if (localPatterns.length <= 1) return;
    setLocalPatterns((prev) => prev.filter((p) => p.id !== id));
    setHasChanges(true);
  };

  const saveChanges = () => {
    onPatternsChange(localPatterns);
    setHasChanges(false);
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Shift Pattern Configuration</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addPattern} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Shift
            </Button>
            {hasChanges && (
              <Button size="sm" onClick={saveChanges} className="h-7 text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {localPatterns.map((pattern) => (
          <div key={pattern.id} className="bg-background rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={pattern.color}
                  onChange={(e) => updatePattern(pattern.id, "color", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <Input
                  value={pattern.name}
                  onChange={(e) => updatePattern(pattern.id, "name", e.target.value)}
                  className="h-7 w-28 text-sm font-medium"
                />
              </div>
              {localPatterns.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePattern(pattern.id)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Reference Date</Label>
                <Input
                  type="date"
                  value={pattern.referenceDate}
                  onChange={(e) => updatePattern(pattern.id, "referenceDate", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cycle Length (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={pattern.cycleLength}
                  onChange={(e) => updatePattern(pattern.id, "cycleLength", parseInt(e.target.value) || 16)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Day Start (cycle day)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pattern.dayStartCycleDay}
                  onChange={(e) => updatePattern(pattern.id, "dayStartCycleDay", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Night Start (cycle day)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pattern.nightStartCycleDay}
                  onChange={(e) => updatePattern(pattern.id, "nightStartCycleDay", parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
        
        <p className="text-xs text-muted-foreground">
          Configure shift patterns: set reference date, cycle length, and when each shift starts days/nights within the cycle.
        </p>
      </CardContent>
    </Card>
  );
};

export default ShiftPatternConfig;
