import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  rowHeightActive: 1,
  rowHeightCompleted: 1,
  rowHeightHandover: 1,
  textSizeActive: 1,
  textSizeCompleted: 1,
  textSizeHandover: 1,
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
  backupReminderInterval: 24,
};

const ROW_HEIGHT_OPTIONS = ["Extra Compact", "Compact", "Normal", "Comfortable", "Extra Comfortable"];
const TEXT_SIZE_OPTIONS = ["Extra Small", "Small", "Normal", "Large", "Extra Large"];
const POPUP_SIZE_OPTIONS = ["Small", "Normal", "Large"];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    localStorage.setItem("lastSettingsSave", new Date().toISOString());
    setHasChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your admin settings have been saved successfully.",
    });
  };

  const updateSetting = <K extends keyof AdminSettingsData>(key: K, value: AdminSettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Settings</h1>
              <p className="text-muted-foreground">Configure application settings</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Settings Tabs */}
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
                    onValueChange={(value) => updateSetting("rowHeightActive", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {ROW_HEIGHT_OPTIONS.map((option, idx) => (
                      <span key={idx}>{option}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Completed Jobs Tab: {ROW_HEIGHT_OPTIONS[settings.rowHeightCompleted]}</Label>
                  <Slider
                    value={[settings.rowHeightCompleted]}
                    onValueChange={(value) => updateSetting("rowHeightCompleted", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Handover Tab: {ROW_HEIGHT_OPTIONS[settings.rowHeightHandover]}</Label>
                  <Slider
                    value={[settings.rowHeightHandover]}
                    onValueChange={(value) => updateSetting("rowHeightHandover", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
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
                    onValueChange={(value) => updateSetting("textSizeActive", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {TEXT_SIZE_OPTIONS.map((option, idx) => (
                      <span key={idx}>{option}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Completed Jobs Tab: {TEXT_SIZE_OPTIONS[settings.textSizeCompleted]}</Label>
                  <Slider
                    value={[settings.textSizeCompleted]}
                    onValueChange={(value) => updateSetting("textSizeCompleted", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Handover Tab: {TEXT_SIZE_OPTIONS[settings.textSizeHandover]}</Label>
                  <Slider
                    value={[settings.textSizeHandover]}
                    onValueChange={(value) => updateSetting("textSizeHandover", value[0])}
                    min={0}
                    max={4}
                    step={1}
                    className="w-full"
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
                  onValueChange={(value) => updateSetting("expandPopupSize", value[0])}
                  min={0}
                  max={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {POPUP_SIZE_OPTIONS.map((option, idx) => (
                    <span key={idx}>{option}</span>
                  ))}
                </div>
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
                      onChange={(e) => updateSetting("statusColorAmber", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.statusColorAmber}
                      onChange={(e) => updateSetting("statusColorAmber", e.target.value)}
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
                      onChange={(e) => updateSetting("statusColorLightGreen", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.statusColorLightGreen}
                      onChange={(e) => updateSetting("statusColorLightGreen", e.target.value)}
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
                      onChange={(e) => updateSetting("statusColorDarkGreen", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.statusColorDarkGreen}
                      onChange={(e) => updateSetting("statusColorDarkGreen", e.target.value)}
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
                  onChange={(e) => updateSetting("appName", e.target.value)}
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
                    onChange={(e) => updateSetting("tabNameActive", e.target.value)}
                    placeholder="Active"
                  />
                </div>
                <div>
                  <Label>Completed Jobs Tab</Label>
                  <Input
                    value={settings.tabNameCompleted}
                    onChange={(e) => updateSetting("tabNameCompleted", e.target.value)}
                    placeholder="Completed"
                  />
                </div>
                <div>
                  <Label>Handover Tab</Label>
                  <Input
                    value={settings.tabNameHandover}
                    onChange={(e) => updateSetting("tabNameHandover", e.target.value)}
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
                  onChange={(e) => updateSetting("departments", e.target.value)}
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
                    onChange={(e) => updateSetting("shiftDuration", parseInt(e.target.value) || 12)}
                    min={1}
                    max={24}
                  />
                </div>
                <div>
                  <Label>Set Duration (hours)</Label>
                  <Input
                    type="number"
                    value={settings.setDuration}
                    onChange={(e) => updateSetting("setDuration", parseInt(e.target.value) || 96)}
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
                    onChange={(e) => updateSetting("autoSaveInterval", parseInt(e.target.value) || 5)}
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
                  onChange={(e) => updateSetting("backupReminderInterval", parseInt(e.target.value) || 24)}
                  min={1}
                  max={168}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Show backup reminder every {settings.backupReminderInterval} hours
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
