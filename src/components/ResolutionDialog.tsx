import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescription: string;
  onSave: (resolution: string) => void;
  onSkip: () => void;
}

export const ResolutionDialog = ({
  open,
  onOpenChange,
  jobDescription,
  onSave,
  onSkip,
}: ResolutionDialogProps) => {
  const [resolution, setResolution] = useState("");

  const handleSave = () => {
    onSave(resolution);
    setResolution("");
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    setResolution("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Treat closing (by clicking outside or Escape) the same as Skip
      handleSkip();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>What was the resolution of this job?</DialogTitle>
          <DialogDescription className="text-sm text-foreground/80 pt-2">
            {jobDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            placeholder="Enter the resolution..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
