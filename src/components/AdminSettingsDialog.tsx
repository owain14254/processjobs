import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AdminSettingsData {
  // Visuals
  rowHeightActive: number;
  rowHeightCompleted: number;
  rowHeightHandover: number;
  textSizeActive: number;
  textSizeCompleted: number;
  textSizeHandover: number;
  expandPopupSize: number;
  statusColorAmber: string;
  statusColorLightGreen: string;
  statusColorDarkGreen: string;

  // General
  tabNameActive: string;
  tabNameCompleted: string;
  tabNameHandover: string;
  appName: string;
  departments: string;
  shiftDuration: number;
  setDuration: number;

  // Save
  autoSaveInterval: number;
  backupReminderInterval: number;
}

const defaultSettings: AdminSettingsData = {
  rowHeightActive: 2,
  rowHeightCompleted: 2,
  rowHeightHandover: 2,
  textSizeActive: 2,
  textSizeCompleted: 2,
  textSizeHandover: 2,
  expandPopupSize: 1,
  statusColorAmber: "#FFA500",
  statusColorLightGreen: "#90EE90",
  statusColorDarkGreen: "#006400",
  tabNameActive: "Active",
  tabNameCompleted: "Completed",
  tabNameHandover: "Handover",
  appName: "Job Log",
  departments: "Process, Fruit, Filling, Warehouse, Services, Other",
  shiftDuration: 12,
  setDuration: 96,
  autoSaveInterval: 5,
  backupReminderInterval: 24
};

const ROW_HEIGHT_OPTIONS = ["Extra Compact", "Compact", "Normal", "Comfortable", "Extra Comfortable"];
const TEXT_SIZE_OPTIONS = ["Extra Small", "Small", "Normal", "Large", "Extra Large"];
const POPUP_SIZE_OPTIONS = ["Small", "Normal", "Large"];

interface AdminSettingsDialogProps {
  onSettingsChange?: (settings: AdminSettingsData) => void;
}

export function AdminSettingsDialog({ onSettingsChange }: AdminSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings);
  const [showTestPopup, setShowTestPopup] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const updateSetting = <K extends keyof AdminSettingsData>(key: K, value: AdminSettingsData[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("adminSettings", JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  const popupSizeClass = ["max-w-md", "max-w-2xl", "max-w-4xl"][settings.expandPopupSize];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-xl">Admin Settings</DialogTitle>
          <DialogDescription className="text-xs">Configure application settings (changes apply in real-time)</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visuals" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 h-9">
            <TabsTrigger value="visuals" className="text-xs">Visuals</TabsTrigger>
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="save" className="text-xs">Save Settings</TabsTrigger>
          </TabsList>

          {/* Visuals Tab */}
          <TabsContent value="visuals" className="grid grid-cols-3 gap-3 mt-2 flex-1 min-h-0">
            <Card className="h-full overflow-y-auto">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Row Height</CardTitle>
                <CardDescription className="text-xs">Configure row height for each tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-xs">Active: {ROW_HEIGHT_OPTIONS[settings.rowHeightActive]}</Label>
                  <Slider 
                    value={[settings.rowHeightActive]} 
                    onValueChange={value => updateSetting("rowHeightActive", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Completed: {ROW_HEIGHT_OPTIONS[settings.rowHeightCompleted]}</Label>
                  <Slider 
                    value={[settings.rowHeightCompleted]} 
                    onValueChange={value => updateSetting("rowHeightCompleted", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Handover: {ROW_HEIGHT_OPTIONS[settings.rowHeightHandover]}</Label>
                  <Slider 
                    value={[settings.rowHeightHandover]} 
                    onValueChange={value => updateSetting("rowHeightHandover", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="h-full overflow-y-auto">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Text Size</CardTitle>
                <CardDescription className="text-xs">Configure text size for each tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-xs">Active: {TEXT_SIZE_OPTIONS[settings.textSizeActive]}</Label>
                  <Slider 
                    value={[settings.textSizeActive]} 
                    onValueChange={value => updateSetting("textSizeActive", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Completed: {TEXT_SIZE_OPTIONS[settings.textSizeCompleted]}</Label>
                  <Slider 
                    value={[settings.textSizeCompleted]} 
                    onValueChange={value => updateSetting("textSizeCompleted", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Handover: {TEXT_SIZE_OPTIONS[settings.textSizeHandover]}</Label>
                  <Slider 
                    value={[settings.textSizeHandover]} 
                    onValueChange={value => updateSetting("textSizeHandover", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                    className="py-1"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 h-full overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Popup Size</CardTitle>
                  <CardDescription className="text-xs">Expand text popup size</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Size: {POPUP_SIZE_OPTIONS[settings.expandPopupSize]}</Label>
                    <Slider 
                      value={[settings.expandPopupSize]} 
                      onValueChange={value => updateSetting("expandPopupSize", value[0])} 
                      min={0} 
                      max={2} 
                      step={1} 
                      className="py-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Status Colors</CardTitle>
                  <CardDescription className="text-xs">Row colors for each status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Open Job</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        value={settings.statusColorAmber} 
                        onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                        className="w-12 h-7 p-0" 
                      />
                      <Input 
                        type="text" 
                        value={settings.statusColorAmber} 
                        onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                        placeholder="#FFA500" 
                        className="text-xs h-7 flex-1" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Awaiting SAP</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        value={settings.statusColorLightGreen} 
                        onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                        className="w-12 h-7 p-0" 
                      />
                      <Input 
                        type="text" 
                        value={settings.statusColorLightGreen} 
                        onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                        placeholder="#90EE90" 
                        className="text-xs h-7 flex-1" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Completed</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        value={settings.statusColorDarkGreen} 
                        onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                        className="w-12 h-7 p-0" 
                      />
                      <Input 
                        type="text" 
                        value={settings.statusColorDarkGreen} 
                        onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                        placeholder="#006400" 
                        className="text-xs h-7 flex-1" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="grid grid-cols-2 gap-3 mt-2 flex-1 min-h-0">
            <div className="space-y-3 h-full overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">App Name</CardTitle>
                  <CardDescription className="text-xs">Main application title</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <Label className="text-xs">App Name</Label>
                  <Input 
                    value={settings.appName} 
                    onChange={e => updateSetting("appName", e.target.value)} 
                    placeholder="Job Log" 
                    className="h-8 text-xs mt-1" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Tab Names</CardTitle>
                  <CardDescription className="text-xs">Customize tab names</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div>
                    <Label className="text-xs">Active Jobs Tab</Label>
                    <Input 
                      value={settings.tabNameActive} 
                      onChange={e => updateSetting("tabNameActive", e.target.value)} 
                      placeholder="Active" 
                      className="h-8 text-xs mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Completed Jobs Tab</Label>
                    <Input 
                      value={settings.tabNameCompleted} 
                      onChange={e => updateSetting("tabNameCompleted", e.target.value)} 
                      placeholder="Completed" 
                      className="h-8 text-xs mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Handover Tab</Label>
                    <Input 
                      value={settings.tabNameHandover} 
                      onChange={e => updateSetting("tabNameHandover", e.target.value)} 
                      placeholder="Handover" 
                      className="h-8 text-xs mt-1" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 h-full overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Departments</CardTitle>
                  <CardDescription className="text-xs">Department dropdown (comma-separated)</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <Label className="text-xs">Department List</Label>
                  <Textarea 
                    value={settings.departments} 
                    onChange={e => updateSetting("departments", e.target.value)} 
                    placeholder="Process, Fruit, Filling, Warehouse, Services, Other" 
                    rows={2} 
                    className="text-xs mt-1" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Time Durations</CardTitle>
                  <CardDescription className="text-xs">Shift and set durations (hours)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div>
                    <Label className="text-xs">Shift Duration (hours)</Label>
                    <Input 
                      type="number" 
                      value={settings.shiftDuration} 
                      onChange={e => updateSetting("shiftDuration", parseInt(e.target.value) || 12)} 
                      min={1} 
                      max={24} 
                      className="h-8 text-xs mt-1" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Set Duration (hours)</Label>
                    <Input 
                      type="number" 
                      value={settings.setDuration} 
                      onChange={e => updateSetting("setDuration", parseInt(e.target.value) || 96)} 
                      min={1} 
                      max={168} 
                      className="h-8 text-xs mt-1" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Save Settings Tab */}
          <TabsContent value="save" className="grid grid-cols-3 gap-3 mt-2 flex-1 min-h-0">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Auto-Save</CardTitle>
                <CardDescription className="text-xs">Automatic save intervals</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Label className="text-xs">Auto-Save Interval (minutes)</Label>
                <Input 
                  type="number" 
                  value={settings.autoSaveInterval} 
                  onChange={e => updateSetting("autoSaveInterval", parseInt(e.target.value) || 5)} 
                  min={1} 
                  max={60} 
                  className="h-8 text-xs mt-1" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-saves every {settings.autoSaveInterval} min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Backup Reminder</CardTitle>
                <CardDescription className="text-xs">Backup reminder frequency</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Label className="text-xs">Backup Reminder Interval (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.backupReminderInterval} 
                  onChange={e => updateSetting("backupReminderInterval", parseInt(e.target.value) || 24)} 
                  min={1} 
                  max={168} 
                  className="h-8 text-xs mt-1" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Reminder every {settings.backupReminderInterval} hrs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Test Popup</CardTitle>
                <CardDescription className="text-xs">Test expand text popup</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Button onClick={() => setShowTestPopup(true)} className="w-full h-8 text-xs">
                  Test Popup Size
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Popup Dialog */}
        <Dialog open={showTestPopup} onOpenChange={setShowTestPopup}>
          <DialogContent className={popupSizeClass}>
            <DialogHeader>
              <DialogTitle>Test Popup</DialogTitle>
              <DialogDescription>
                This is a test of the expand text popup with size: {POPUP_SIZE_OPTIONS[settings.expandPopupSize]}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                This popup demonstrates the current size setting. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
