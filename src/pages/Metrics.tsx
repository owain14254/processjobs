import { useJobStorage } from "@/hooks/useJobStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Download, TrendingUp } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Metrics = () => {
  const navigate = useNavigate();
  const { completedJobs } = useJobStorage();

  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    completedJobs.forEach(job => depts.add(job.department));
    return Array.from(depts).sort();
  }, [completedJobs]);

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
    
    completedJobs.forEach((job) => {
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
  }, [completedJobs, selectedDepartments]);

  const { toast } = useToast();

  const totalJobs = completedJobs.filter(job => selectedDepartments.has(job.department)).length;

  const avgJobsPerMonth = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return Math.round(totalJobs / monthlyData.length);
  }, [totalJobs, monthlyData]);

  const topDepartment = useMemo(() => {
    const deptCounts = new Map<string, number>();
    completedJobs.forEach(job => {
      if (selectedDepartments.has(job.department)) {
        deptCounts.set(job.department, (deptCounts.get(job.department) || 0) + 1);
      }
    });
    
    let max = 0;
    let topDept = "";
    deptCounts.forEach((count, dept) => {
      if (count > max) {
        max = count;
        topDept = dept;
      }
    });
    
    return { name: topDept, count: max };
  }, [completedJobs, selectedDepartments]);

  const handleExportMetrics = () => {
    const csvData = [
      ["Month", ...Array.from(selectedDepartments)],
      ...monthlyData.map(row => [
        row.month,
        ...Array.from(selectedDepartments).map(dept => row[dept] || 0)
      ])
    ];
    
    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="max-w-7xl mx-auto space-y-3">
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
              <p className="text-sm text-muted-foreground">Jobs completed per month by department</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgJobsPerMonth}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Top Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topDepartment.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-1">{topDepartment.count} jobs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jobs Completed by Department</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No completed jobs to display
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" style={{ fontSize: '12px' }} />
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
