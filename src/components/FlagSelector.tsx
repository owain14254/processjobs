import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Flag, X } from "lucide-react";
import { FlagPreset } from "./FlagPresetsDialog";
import { cn } from "@/lib/utils";

interface FlagSelectorProps {
  selectedPresetId?: string;
  presets: FlagPreset[];
  onSelect: (presetId: string) => void;
  onRemove: () => void;
}

const PRIORITY_COLORS = {
  red: "#dc2626",
  amber: "#f59e0b",
  green: "#16a34a",
};

export const FlagSelector = ({
  selectedPresetId,
  presets,
  onSelect,
  onRemove,
}: FlagSelectorProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  if (!selectedPreset) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium mb-2">Select Flag</p>
            {presets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No presets available. Create one in the Müller logo menu.
              </p>
            ) : (
              presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSelect(preset.id)}
                >
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: PRIORITY_COLORS[preset.priorityColor] }}
                  />
                  <span className="text-xs">{preset.shiftNumber}</span>
                </Button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const shouldTruncate = selectedPreset.details.length > 100;
  const displayDetails = showDetails || !shouldTruncate
    ? selectedPreset.details
    : selectedPreset.details.slice(0, 100) + "...";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <Popover>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-transparent"
              >
                <Flag
                  className="h-3.5 w-3.5"
                  style={{ color: PRIORITY_COLORS[selectedPreset.priorityColor] }}
                  fill={PRIORITY_COLORS[selectedPreset.priorityColor]}
                />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[selectedPreset.priorityColor] }}
                  />
                  <span className="font-medium text-sm">{selectedPreset.shiftNumber}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRemove}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {selectedPreset.details && (
                <div className="text-xs text-muted-foreground">
                  <p className="whitespace-pre-wrap">{displayDetails}</p>
                  {shouldTruncate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? "Show less" : "View more"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <TooltipContent side="right">
          <p className="text-xs">{selectedPreset.shiftNumber}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
