import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  textBoldActive: boolean;
  textBoldCompleted: boolean;
  textBoldHandover: boolean;
  expandPopupSize: number;
  statusColorAmber: string;
  statusColorLightGreen: string;
  statusColorDarkGreen: string;
  clockVisible: boolean;
  clockSize: number;

  // General
  tabNameActive: string;
  tabNameCompleted: string;
  tabNameHandover: string;
  appName: string;
  departments: string;
  shiftDuration: number;
  setDuration: number;

  // Save & Theme
  backupReminderInterval: number;
  autoThemeEnabled: boolean;
  autoThemeLightTime: string;
  autoThemeDarkTime: string;
}

const defaultSettings: AdminSettingsData = {
  rowHeightActive: 2,
  rowHeightCompleted: 2,
  rowHeightHandover: 2,
  textSizeActive: 2,
  textSizeCompleted: 2,
  textSizeHandover: 2,
  textBoldActive: false,
  textBoldCompleted: false,
  textBoldHandover: false,
  expandPopupSize: 2,
  statusColorAmber: "#ffc252",
  statusColorLightGreen: "#8bea8b",
  statusColorDarkGreen: "#00b300",
  clockVisible: true,
  clockSize: 2,
  tabNameActive: "Active",
  tabNameCompleted: "Completed",
  tabNameHandover: "Handover",
  appName: "Process",
  departments: "Process, Fruit, Filling, Warehouse, Services, Other",
  shiftDuration: 12,
  setDuration: 96,
  backupReminderInterval: 24,
  autoThemeEnabled: false,
  autoThemeLightTime: "06:00",
  autoThemeDarkTime: "18:00"
};

const ROW_HEIGHT_OPTIONS = ["Extra Compact", "Compact", "Normal", "Comfortable", "Extra Comfortable"];
const TEXT_SIZE_OPTIONS = ["Extra Small", "Small", "Normal", "Large", "Extra Large"];
const POPUP_SIZE_OPTIONS = ["Small", "Normal", "Large", "Extra Large", "Huge"];
const CLOCK_SIZE_OPTIONS = ["Extra Small", "Small", "Normal", "Large", "Extra Large"];

interface AdminSettingsDialogProps {
  onSettingsChange?: (settings: AdminSettingsData) => void;
  onTestSavePrompt?: () => void;
}

export function AdminSettingsDialog({ onSettingsChange, onTestSavePrompt }: AdminSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings);
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
    
    // Initialize lastBackupReminder if it doesn't exist
    if (!localStorage.getItem("lastBackupReminder")) {
      localStorage.setItem("lastBackupReminder", new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const lastReminder = localStorage.getItem("lastBackupReminder");
      if (lastReminder) {
        const lastReminderTime = new Date(lastReminder).getTime();
        const now = Date.now();
        const intervalMs = settings.backupReminderInterval * 60 * 60 * 1000;
        const nextReminder = lastReminderTime + intervalMs;
        const remaining = Math.max(0, nextReminder - now);
        
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown("Not started");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings.backupReminderInterval, open]);

  const updateSetting = <K extends keyof AdminSettingsData>(key: K, value: AdminSettingsData[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("adminSettings", JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem("adminSettings", JSON.stringify(defaultSettings));
    onSettingsChange?.(defaultSettings);
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults."
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-admin-settings-trigger>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-1 space-y-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">Admin Settings</DialogTitle>
              <DialogDescription className="text-[11px]">Configure application settings (changes apply in real-time)</DialogDescription>
            </div>
            <Button onClick={handleReset} variant="outline" size="sm" className="h-7 text-xs">
              Reset to Defaults
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden pr-2">
          {/* Left Column - General Settings */}
          <div className="overflow-y-auto">
            <Card className="h-fit">
              <CardHeader className="pb-2 pt-3 px-3 space-y-0">
                <CardTitle className="text-sm">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
              {/* App Identity */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">App Identity</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">App Name</Label>
                    <Input 
                      value={settings.appName} 
                      onChange={e => updateSetting("appName", e.target.value)} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                </div>
              </div>

              {/* Tab Names */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Tab Names</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Active Tab</Label>
                    <Input 
                      value={settings.tabNameActive} 
                      onChange={e => updateSetting("tabNameActive", e.target.value)} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Completed Tab</Label>
                    <Input 
                      value={settings.tabNameCompleted} 
                      onChange={e => updateSetting("tabNameCompleted", e.target.value)} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Handover Tab</Label>
                    <Input 
                      value={settings.tabNameHandover} 
                      onChange={e => updateSetting("tabNameHandover", e.target.value)} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                </div>
              </div>

              {/* Tab Display Settings Table */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Tab Display Settings</Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-1.5 font-medium">Tab</th>
                        <th className="text-left p-1.5 font-medium">Text Size</th>
                        <th className="text-left p-1.5 font-medium">Row Height</th>
                        <th className="text-left p-1.5 font-medium">Bold</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-1.5">Active</td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{TEXT_SIZE_OPTIONS[settings.textSizeActive]}</div>
                            <Slider 
                              value={[settings.textSizeActive]} 
                              onValueChange={value => updateSetting("textSizeActive", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{ROW_HEIGHT_OPTIONS[settings.rowHeightActive]}</div>
                            <Slider 
                              value={[settings.rowHeightActive]} 
                              onValueChange={value => updateSetting("rowHeightActive", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <Switch 
                            checked={settings.textBoldActive} 
                            onCheckedChange={(checked) => updateSetting("textBoldActive", checked)}
                          />
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-1.5">Completed</td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{TEXT_SIZE_OPTIONS[settings.textSizeCompleted]}</div>
                            <Slider 
                              value={[settings.textSizeCompleted]} 
                              onValueChange={value => updateSetting("textSizeCompleted", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{ROW_HEIGHT_OPTIONS[settings.rowHeightCompleted]}</div>
                            <Slider 
                              value={[settings.rowHeightCompleted]} 
                              onValueChange={value => updateSetting("rowHeightCompleted", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <Switch 
                            checked={settings.textBoldCompleted} 
                            onCheckedChange={(checked) => updateSetting("textBoldCompleted", checked)}
                          />
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-1.5">Handover</td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{TEXT_SIZE_OPTIONS[settings.textSizeHandover]}</div>
                            <Slider 
                              value={[settings.textSizeHandover]} 
                              onValueChange={value => updateSetting("textSizeHandover", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground">{ROW_HEIGHT_OPTIONS[settings.rowHeightHandover]}</div>
                            <Slider 
                              value={[settings.rowHeightHandover]} 
                              onValueChange={value => updateSetting("rowHeightHandover", value[0])} 
                              min={0} max={4} step={1} 
                              className="w-full"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <Switch 
                            checked={settings.textBoldHandover} 
                            onCheckedChange={(checked) => updateSetting("textBoldHandover", checked)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Departments */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Departments</Label>
                <Label className="text-[10px] text-muted-foreground">Comma-separated list</Label>
                <Textarea 
                  value={settings.departments} 
                  onChange={e => updateSetting("departments", e.target.value)} 
                  rows={2} 
                  className="text-xs resize-none" 
                />
              </div>

              {/* Time Durations */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Time Durations (hours)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Shift Duration</Label>
                    <Input 
                      type="number" 
                      value={settings.shiftDuration} 
                      onChange={e => updateSetting("shiftDuration", parseInt(e.target.value) || 12)} 
                      min={1} max={24} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Set Duration</Label>
                    <Input 
                      type="number" 
                      value={settings.setDuration} 
                      onChange={e => updateSetting("setDuration", parseInt(e.target.value) || 96)} 
                      min={1} max={168} 
                      className="h-7 text-xs mt-0.5" 
                    />
                  </div>
                </div>
              </div>

              {/* Status Colors Table */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Status Colors</Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-1.5 font-medium">Status</th>
                        <th className="text-left p-1.5 font-medium">Color</th>
                        <th className="text-left p-1.5 font-medium w-16">Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-1.5">Open Job</td>
                        <td className="p-1.5">
                          <div className="flex gap-1.5 items-center">
                            <Input 
                              type="color" 
                              value={settings.statusColorAmber} 
                              onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                              className="w-8 h-6 p-0" 
                            />
                            <Input 
                              type="text" 
                              value={settings.statusColorAmber} 
                              onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                              className="text-[10px] h-6 flex-1" 
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="h-6 rounded" style={{ backgroundColor: settings.statusColorAmber }} />
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-1.5">Awaiting SAP</td>
                        <td className="p-1.5">
                          <div className="flex gap-1.5 items-center">
                            <Input 
                              type="color" 
                              value={settings.statusColorLightGreen} 
                              onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                              className="w-8 h-6 p-0" 
                            />
                            <Input 
                              type="text" 
                              value={settings.statusColorLightGreen} 
                              onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                              className="text-[10px] h-6 flex-1" 
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="h-6 rounded" style={{ backgroundColor: settings.statusColorLightGreen }} />
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-1.5">Completed</td>
                        <td className="p-1.5">
                          <div className="flex gap-1.5 items-center">
                            <Input 
                              type="color" 
                              value={settings.statusColorDarkGreen} 
                              onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                              className="w-8 h-6 p-0" 
                            />
                            <Input 
                              type="text" 
                              value={settings.statusColorDarkGreen} 
                              onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                              className="text-[10px] h-6 flex-1" 
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="h-6 rounded" style={{ backgroundColor: settings.statusColorDarkGreen }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Popup Size */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Expand Text Popup Size</Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[settings.expandPopupSize]} 
                    onValueChange={value => updateSetting("expandPopupSize", value[0])} 
                    min={0} max={4} step={1} 
                    className="flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground w-24">{POPUP_SIZE_OPTIONS[settings.expandPopupSize]}</span>
                </div>
              </div>

              {/* Clock Settings */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Clock Settings</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">Show Clock</Label>
                    <Switch 
                      checked={settings.clockVisible} 
                      onCheckedChange={(checked) => updateSetting("clockVisible", checked)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Clock Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider 
                        value={[settings.clockSize]} 
                        onValueChange={value => updateSetting("clockSize", value[0])} 
                        min={0} max={4} step={1} 
                        className="flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground w-24">{CLOCK_SIZE_OPTIONS[settings.clockSize]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Right Column - Save & Theme Settings */}
          <div className="overflow-y-auto space-y-3">
            <Card className="h-fit">
              <CardHeader className="pb-2 pt-3 px-3 space-y-0">
                <CardTitle className="text-sm">Backup Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
              {/* Backup Reminder */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Backup Reminder</Label>
                <Label className="text-[10px] text-muted-foreground">Interval (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.backupReminderInterval} 
                  onChange={e => updateSetting("backupReminderInterval", parseInt(e.target.value) || 24)} 
                  min={1} max={168} 
                  className="h-7 text-xs mt-0.5" 
                />
                <p className="text-[10px] text-muted-foreground">
                  Reminder every {settings.backupReminderInterval} hrs
                </p>
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Next reminder in:</p>
                  <p className="text-sm font-mono font-bold">{countdown}</p>
                </div>
              </div>

              {/* Test Save Popup */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Test Backup Popup</Label>
                <Button onClick={() => onTestSavePrompt?.()} className="w-full h-7 text-xs">
                  Test backup popup
                </Button>
              </div>
            </CardContent>
          </Card>

            <Card className="h-fit">
              <CardHeader className="pb-2 pt-3 px-3 space-y-0">
                <CardTitle className="text-sm">Auto Theme Switching</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
              {/* Enable Auto Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[11px] font-semibold">Enable Auto Theme</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Auto switch between light/dark mode
                  </p>
                </div>
                <Switch 
                  checked={settings.autoThemeEnabled} 
                  onCheckedChange={(checked) => updateSetting("autoThemeEnabled", checked)}
                />
              </div>

              {/* Light Mode Time */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Light Mode Time</Label>
                <Input 
                  type="time" 
                  value={settings.autoThemeLightTime} 
                  onChange={e => updateSetting("autoThemeLightTime", e.target.value)} 
                  className="h-7 text-xs mt-0.5" 
                  disabled={!settings.autoThemeEnabled}
                />
                <p className="text-[10px] text-muted-foreground">
                  Switch to light mode at this time
                </p>
              </div>

              {/* Dark Mode Time */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Dark Mode Time</Label>
                <Input 
                  type="time" 
                  value={settings.autoThemeDarkTime} 
                  onChange={e => updateSetting("autoThemeDarkTime", e.target.value)} 
                  className="h-7 text-xs mt-0.5" 
                  disabled={!settings.autoThemeEnabled}
                />
                <p className="text-[10px] text-muted-foreground">
                  Switch to dark mode at this time
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
