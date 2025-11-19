import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FlagPreset {
  id: string;
  shiftNumber: string;
  priorityColor: "red" | "amber" | "green";
  details: string;
}

interface FlagPresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: FlagPreset[];
  onPresetsChange: (presets: FlagPreset[]) => void;
}

const PRIORITY_COLORS = {
  red: { label: "High Priority", color: "#dc2626" },
  amber: { label: "Medium Priority", color: "#f59e0b" },
  green: { label: "Low Priority", color: "#16a34a" },
};

export const FlagPresetsDialog = ({
  open,
  onOpenChange,
  presets,
  onPresetsChange,
}: FlagPresetsDialogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addPreset = () => {
    const newPreset: FlagPreset = {
      id: Date.now().toString(),
      shiftNumber: `Shift ${presets.length + 1}`,
      priorityColor: "amber",
      details: "",
    };
    onPresetsChange([...presets, newPreset]);
    setEditingId(newPreset.id);
  };

  const updatePreset = (id: string, updates: Partial<FlagPreset>) => {
    onPresetsChange(
      presets.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePreset = (id: string) => {
    onPresetsChange(presets.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Flag Presets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[preset.priorityColor].color }}
                  />
                  <span className="font-medium">{preset.shiftNumber}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePreset(preset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {editingId === preset.id && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label>Shift Name</Label>
                    <Input
                      value={preset.shiftNumber}
                      onChange={(e) =>
                        updatePreset(preset.id, { shiftNumber: e.target.value })
                      }
                      placeholder="e.g., Shift 1"
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={preset.priorityColor}
                      onValueChange={(value: "red" | "amber" | "green") =>
                        updatePreset(preset.id, { priorityColor: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_COLORS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Details (optional)</Label>
                    <Textarea
                      value={preset.details}
                      onChange={(e) =>
                        updatePreset(preset.id, { details: e.target.value })
                      }
                      placeholder="Time restrictions, parts needed, SAP number..."
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Done
                  </Button>
                </div>
              )}
              {editingId !== preset.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(preset.id)}
                >
                  Edit
                </Button>
              )}
            </div>
          ))}
          <Button onClick={addPreset} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Preset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
