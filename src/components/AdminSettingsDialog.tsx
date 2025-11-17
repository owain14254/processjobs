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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Admin Settings</DialogTitle>
          <DialogDescription>Configure application settings (changes apply in real-time)</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visuals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visuals">Visuals</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="save">Save Settings</TabsTrigger>
          </TabsList>

          {/* Visuals Tab */}
          <TabsContent value="visuals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Row Height Settings</CardTitle>
                <CardDescription>Configure row height for each tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Active Jobs Tab: {ROW_HEIGHT_OPTIONS[settings.rowHeightActive]}</Label>
                  <Slider 
                    value={[settings.rowHeightActive]} 
                    onValueChange={value => updateSetting("rowHeightActive", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Completed Jobs Tab: {ROW_HEIGHT_OPTIONS[settings.rowHeightCompleted]}</Label>
                  <Slider 
                    value={[settings.rowHeightCompleted]} 
                    onValueChange={value => updateSetting("rowHeightCompleted", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Handover Tab: {ROW_HEIGHT_OPTIONS[settings.rowHeightHandover]}</Label>
                  <Slider 
                    value={[settings.rowHeightHandover]} 
                    onValueChange={value => updateSetting("rowHeightHandover", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Size Settings</CardTitle>
                <CardDescription>Configure text size for each tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Active Jobs Tab: {TEXT_SIZE_OPTIONS[settings.textSizeActive]}</Label>
                  <Slider 
                    value={[settings.textSizeActive]} 
                    onValueChange={value => updateSetting("textSizeActive", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Completed Jobs Tab: {TEXT_SIZE_OPTIONS[settings.textSizeCompleted]}</Label>
                  <Slider 
                    value={[settings.textSizeCompleted]} 
                    onValueChange={value => updateSetting("textSizeCompleted", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Handover Tab: {TEXT_SIZE_OPTIONS[settings.textSizeHandover]}</Label>
                  <Slider 
                    value={[settings.textSizeHandover]} 
                    onValueChange={value => updateSetting("textSizeHandover", value[0])} 
                    min={0} 
                    max={4} 
                    step={1} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popup Settings</CardTitle>
                <CardDescription>Configure expand text popup size</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Expand Popup Size: {POPUP_SIZE_OPTIONS[settings.expandPopupSize]}</Label>
                <Slider 
                  value={[settings.expandPopupSize]} 
                  onValueChange={value => updateSetting("expandPopupSize", value[0])} 
                  min={0} 
                  max={2} 
                  step={1} 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Colors</CardTitle>
                <CardDescription>Configure row colors for each status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Open Job (Amber)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      value={settings.statusColorAmber} 
                      onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                      className="w-20 h-10" 
                    />
                    <Input 
                      type="text" 
                      value={settings.statusColorAmber} 
                      onChange={e => updateSetting("statusColorAmber", e.target.value)} 
                      placeholder="#FFA500" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Complete, Awaiting SAP (Light Green)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      value={settings.statusColorLightGreen} 
                      onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                      className="w-20 h-10" 
                    />
                    <Input 
                      type="text" 
                      value={settings.statusColorLightGreen} 
                      onChange={e => updateSetting("statusColorLightGreen", e.target.value)} 
                      placeholder="#90EE90" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fully Completed (Dark Green)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      value={settings.statusColorDarkGreen} 
                      onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                      className="w-20 h-10" 
                    />
                    <Input 
                      type="text" 
                      value={settings.statusColorDarkGreen} 
                      onChange={e => updateSetting("statusColorDarkGreen", e.target.value)} 
                      placeholder="#006400" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Name</CardTitle>
                <CardDescription>Configure the main application title</CardDescription>
              </CardHeader>
              <CardContent>
                <Label>App Name</Label>
                <Input 
                  value={settings.appName} 
                  onChange={e => updateSetting("appName", e.target.value)} 
                  placeholder="Job Log" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tab Names</CardTitle>
                <CardDescription>Customize the names of each tab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Active Jobs Tab</Label>
                  <Input 
                    value={settings.tabNameActive} 
                    onChange={e => updateSetting("tabNameActive", e.target.value)} 
                    placeholder="Active" 
                  />
                </div>
                <div>
                  <Label>Completed Jobs Tab</Label>
                  <Input 
                    value={settings.tabNameCompleted} 
                    onChange={e => updateSetting("tabNameCompleted", e.target.value)} 
                    placeholder="Completed" 
                  />
                </div>
                <div>
                  <Label>Handover Tab</Label>
                  <Input 
                    value={settings.tabNameHandover} 
                    onChange={e => updateSetting("tabNameHandover", e.target.value)} 
                    placeholder="Handover" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Configure department dropdown options (comma-separated)</CardDescription>
              </CardHeader>
              <CardContent>
                <Label>Department List</Label>
                <Textarea 
                  value={settings.departments} 
                  onChange={e => updateSetting("departments", e.target.value)} 
                  placeholder="Process, Fruit, Filling, Warehouse, Services, Other" 
                  rows={3} 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Durations</CardTitle>
                <CardDescription>Configure shift and set durations (in hours)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Shift Duration (hours)</Label>
                  <Input 
                    type="number" 
                    value={settings.shiftDuration} 
                    onChange={e => updateSetting("shiftDuration", parseInt(e.target.value) || 12)} 
                    min={1} 
                    max={24} 
                  />
                </div>
                <div>
                  <Label>Set Duration (hours)</Label>
                  <Input 
                    type="number" 
                    value={settings.setDuration} 
                    onChange={e => updateSetting("setDuration", parseInt(e.target.value) || 96)} 
                    min={1} 
                    max={168} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Save Settings Tab */}
          <TabsContent value="save" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Save Settings</CardTitle>
                <CardDescription>Configure automatic save intervals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Auto-Save Interval (minutes)</Label>
                  <Input 
                    type="number" 
                    value={settings.autoSaveInterval} 
                    onChange={e => updateSetting("autoSaveInterval", parseInt(e.target.value) || 5)} 
                    min={1} 
                    max={60} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Data is automatically saved to local storage every {settings.autoSaveInterval} minutes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Reminder</CardTitle>
                <CardDescription>Configure backup reminder frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <Label>Backup Reminder Interval (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.backupReminderInterval} 
                  onChange={e => updateSetting("backupReminderInterval", parseInt(e.target.value) || 24)} 
                  min={1} 
                  max={168} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Show backup reminder every {settings.backupReminderInterval} hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Popup</CardTitle>
                <CardDescription>Test the expand text popup with current settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowTestPopup(true)}>
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
