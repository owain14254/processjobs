import { useJobStorage } from "@/hooks/useJobStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Download, Calendar, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Timespan = "7days" | "30days" | "90days" | "6months" | "1year" | "all";

const Metrics = () => {
  const navigate = useNavigate();
  const { completedJobs } = useJobStorage();
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [timespan, setTimespan] = useState<Timespan>("all");

  const timespanLabels: Record<Timespan, string> = {
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
    "6months": "Last 6 Months",
    "1year": "Last Year",
    "all": "All Time"
  };

  const filteredJobsByTimespan = useMemo(() => {
    if (timespan === "all") return completedJobs;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timespan) {
      case "7days":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return completedJobs.filter(job => new Date(job.completedAt) >= cutoffDate);
  }, [completedJobs, timespan]);

  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    filteredJobsByTimespan.forEach(job => depts.add(job.department));
    return Array.from(depts).sort();
  }, [filteredJobsByTimespan]);

  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set(allDepartments)
  );

  // Update selected departments when all departments change
  useMemo(() => {
    setSelectedDepartments(new Set(allDepartments));
  }, [allDepartments]);

  const departmentColors: Record<string, string> = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)",  // Blue
      "hsl(142, 71%, 45%)",  // Green
      "hsl(262, 83%, 58%)",  // Purple
      "hsl(346, 77%, 50%)",  // Red
      "hsl(38, 92%, 50%)",   // Orange
      "hsl(173, 58%, 39%)",  // Teal
      "hsl(280, 65%, 60%)",  // Pink
      "hsl(198, 93%, 60%)",  // Cyan
    ];
    
    const colorMap: Record<string, string> = {};
    allDepartments.forEach((dept, idx) => {
      colorMap[dept] = colors[idx % colors.length];
    });
    return colorMap;
  }, [allDepartments]);

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  };

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, Map<string, number>>();
    
    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;
      
      const date = new Date(job.completedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, new Map());
      }
      
      const monthData = dataMap.get(monthKey)!;
      const currentCount = monthData.get(job.department) || 0;
      monthData.set(job.department, currentCount + 1);
    });

    const sortedMonths = Array.from(dataMap.keys()).sort();
    
    return sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const departments = dataMap.get(monthKey)!;
      const result: any = { month: monthName };
      
      departments.forEach((count, dept) => {
        result[dept] = count;
      });
      
      return result;
    });
  }, [filteredJobsByTimespan, selectedDepartments]);

  const dailyData = useMemo(() => {
    const dataMap = new Map<string, Map<string, number>>();
    
    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;
      
      const date = new Date(job.completedAt);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!dataMap.has(dayKey)) {
        dataMap.set(dayKey, new Map());
      }
      
      const dayData = dataMap.get(dayKey)!;
      const currentCount = dayData.get(job.department) || 0;
      dayData.set(job.department, currentCount + 1);
    });

    const sortedDays = Array.from(dataMap.keys()).sort();
    
    // Show appropriate number of days based on timespan
    const daysToShow = timespan === "7days" ? 7 : timespan === "30days" ? 30 : sortedDays.length;
    const limitedDays = sortedDays.slice(-daysToShow);
    
    return limitedDays.map((dayKey) => {
      const [year, month, day] = dayKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const departments = dataMap.get(dayKey)!;
      const result: any = { month: dayName };
      
      departments.forEach((count, dept) => {
        result[dept] = count;
      });
      
      return result;
    });
  }, [filteredJobsByTimespan, selectedDepartments, timespan]);

  const chartData = viewMode === "monthly" ? monthlyData : dailyData;

  const { toast } = useToast();

  const handleExportMetrics = () => {
    const csvData = [
      ["Period", ...Array.from(selectedDepartments)],
      ...chartData.map(row => [
        row.month,
        ...Array.from(selectedDepartments).map(dept => row[dept] || 0)
      ])
    ];
    
    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${viewMode}-${timespan}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Metrics exported",
      description: "CSV file downloaded successfully"
    });
  };

  const toggleSelectAll = () => {
    if (selectedDepartments.size === allDepartments.length) {
      setSelectedDepartments(new Set());
    } else {
      setSelectedDepartments(new Set(allDepartments));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Metrics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Jobs completed by department</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {timespanLabels[timespan]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                <DropdownMenuLabel>Select Timespan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={timespan} onValueChange={(v) => setTimespan(v as Timespan)}>
                  <DropdownMenuRadioItem value="7days">Last 7 Days</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="30days">Last 30 Days</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="90days">Last 90 Days</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="6months">Last 6 Months</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="1year">Last Year</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "monthly" | "daily")}>
              <TabsList>
                <TabsTrigger value="monthly" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Daily
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Departments ({selectedDepartments.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                <DropdownMenuLabel>Filter Departments</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedDepartments.size === allDepartments.length}
                  onCheckedChange={toggleSelectAll}
                >
                  <span className="font-semibold">Select All</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {allDepartments.map((dept) => (
                  <DropdownMenuCheckboxItem
                    key={dept}
                    checked={selectedDepartments.has(dept)}
                    onCheckedChange={() => toggleDepartment(dept)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: departmentColors[dept] }}
                      />
                      {dept}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleExportMetrics}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Jobs Completed by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                No completed jobs to display for selected timespan
              </div>
            ) : (
              <ChartContainer
                config={allDepartments.reduce((acc, dept) => ({
                  ...acc,
                  [dept]: {
                    label: dept,
                    color: departmentColors[dept],
                  }
                }), {})}
                className="h-[600px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      style={{ fontSize: '11px' }}
                      angle={viewMode === "daily" ? -45 : 0}
                      textAnchor={viewMode === "daily" ? "end" : "middle"}
                      height={viewMode === "daily" ? 80 : 30}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {Array.from(selectedDepartments).map((dept) => (
                      <Bar
                        key={dept}
                        dataKey={dept}
                        fill={departmentColors[dept]}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Metrics;
