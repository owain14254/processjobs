import { useJobStorage } from "@/hooks/useJobStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

  const totalJobs = completedJobs.filter(job => selectedDepartments.has(job.department)).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Metrics Dashboard</h1>
            <p className="text-muted-foreground">Jobs completed per month by department</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{selectedDepartments.size} / {allDepartments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Months Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{monthlyData.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allDepartments.map((dept) => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept}`}
                    checked={selectedDepartments.has(dept)}
                    onCheckedChange={() => toggleDepartment(dept)}
                  />
                  <Label
                    htmlFor={`dept-${dept}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: departmentColors[dept] }}
                    />
                    {dept}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs Completed by Department (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
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
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
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
