import { useJobStorage } from "@/hooks/useJobStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Download, Calendar, CalendarDays, X, Plus, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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
type ViewMode = "monthly" | "daily" | "keywords";

const Metrics = () => {
  const navigate = useNavigate();
  const { completedJobs } = useJobStorage();
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [timespan, setTimespan] = useState<Timespan>("90days");
  const [keywords, setKeywords] = useState<string[]>(() => {
    const saved = localStorage.getItem("metricsKeywords");
    return saved ? JSON.parse(saved) : ["VA", "BT", "IT", "HE", "PU", "AG", "FI", "PI", "TK"];
  });
  const [newKeyword, setNewKeyword] = useState("");

  const timespanLabels: Record<Timespan, string> = {
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
    "6months": "Last 6 Months",
    "1year": "Last Year",
    "all": "All Time"
  };

  // Save keywords to localStorage
  useMemo(() => {
    localStorage.setItem("metricsKeywords", JSON.stringify(keywords));
  }, [keywords]);

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

  // Keyword analysis data
  const keywordData = useMemo(() => {
    const keywordMap = new Map<string, { count: number }>();
    
    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;
      
      const description = job.description.toUpperCase();
      
      // Find keywords in description
      keywords.forEach((keyword) => {
        if (description.includes(keyword.toUpperCase())) {
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, { count: 0 });
          }
          const data = keywordMap.get(keyword)!;
          data.count += 1;
        }
      });
    });
    
    return Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredJobsByTimespan, selectedDepartments, keywords]);

  const keywordColors = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)",  // Blue
      "hsl(142, 71%, 45%)",  // Green
      "hsl(262, 83%, 58%)",  // Purple
      "hsl(346, 77%, 50%)",  // Red
      "hsl(38, 92%, 50%)",   // Orange
      "hsl(173, 58%, 39%)",  // Teal
      "hsl(280, 65%, 60%)",  // Pink
      "hsl(198, 93%, 60%)",  // Cyan
      "hsl(48, 96%, 53%)",   // Yellow
      "hsl(340, 82%, 52%)",  // Rose
    ];
    
    const colorMap: Record<string, string> = {};
    keywords.forEach((keyword, idx) => {
      colorMap[keyword] = colors[idx % colors.length];
    });
    return colorMap;
  }, [keywords]);



  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toUpperCase())) {
      setKeywords([...keywords, newKeyword.trim().toUpperCase()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const autoFindKeywords = () => {
    // Extract all words from descriptions
    const wordFrequency = new Map<string, number>();
    
    // Common words to exclude
    const stopWords = new Set(['THE', 'A', 'AN', 'AND', 'OR', 'BUT', 'IN', 'ON', 'AT', 'TO', 'FOR', 'OF', 'WITH', 'IS', 'WAS', 'BE', 'BEEN', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'MAY', 'MIGHT', 'CAN']);
    
    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;
      
      // Split description into words, filter out short and common words
      const words = job.description.toUpperCase()
        .split(/\s+/)
        .filter(word => {
          // Remove non-alphanumeric characters
          const cleaned = word.replace(/[^A-Z0-9]/g, '');
          // Keep words 2-10 characters that aren't stop words
          return cleaned.length >= 2 && cleaned.length <= 10 && !stopWords.has(cleaned);
        })
        .map(word => word.replace(/[^A-Z0-9]/g, ''));
      
      words.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });
    
    // Get top 15 most common words
    const topWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
    
    // Add new words that aren't already in keywords
    const newKeywords = topWords.filter(word => !keywords.includes(word));
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
      toast({
        title: "Keywords added",
        description: `Found ${newKeywords.length} new common words`
      });
    } else {
      toast({
        title: "No new keywords",
        description: "All common words are already in the list"
      });
    }
  };

  const chartData = viewMode === "keywords" ? keywordData : (viewMode === "monthly" ? monthlyData : dailyData);

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

  const totalJobs = filteredJobsByTimespan.filter(job => selectedDepartments.has(job.department)).length;
  
  const departmentStats = useMemo(() => {
    const stats = Array.from(selectedDepartments).map(dept => {
      const count = filteredJobsByTimespan.filter(job => job.department === dept).length;
      return { department: dept, count, percentage: (count / totalJobs * 100).toFixed(1) };
    }).sort((a, b) => b.count - a.count);
    return stats;
  }, [filteredJobsByTimespan, selectedDepartments, totalJobs]);

  const topDepartment = departmentStats[0];
  const avgJobsPerPeriod = chartData.length > 0 ? (totalJobs / chartData.length).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-3 py-4 px-4">
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

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="monthly" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="keywords" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Keywords
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

        <div className="flex gap-4">
          <Card className="flex-1 border-0 rounded-none shadow-none">
            <CardHeader className="pb-3 px-0">
              <CardTitle className="text-base">
                {viewMode === "keywords" ? "Job Time by Keyword" : "Jobs Completed by Department"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                No completed jobs to display for selected timespan
              </div>
            ) : viewMode === "keywords" ? (
              <div className="space-y-4">
                <div className="flex gap-2 items-center justify-between pb-4 border-b">
                  <div className="flex gap-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Tags className="h-4 w-4 mr-2" />
                          Manage Keywords ({keywords.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 bg-background z-50 max-h-96 overflow-y-auto">
                        <DropdownMenuLabel>Active Keywords</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {keywords.length === 0 ? (
                          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                            No keywords added yet
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {keywords.map((keyword) => (
                              <div key={keyword} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted">
                                <span className="text-sm font-medium">{keyword}</span>
                                <button
                                  onClick={() => removeKeyword(keyword)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <DropdownMenuSeparator />
                        <div className="p-2 space-y-2">
                          <div className="flex gap-1">
                            <Input
                              placeholder="Add keyword"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                              className="h-8 text-sm"
                            />
                            <Button size="sm" onClick={addKeyword} className="h-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button size="sm" variant="outline" onClick={autoFindKeywords}>
                      Auto-Find Keywords
                    </Button>
                  </div>
                </div>
                <ChartContainer
                  config={keywordData.reduce((acc, item) => ({
                    ...acc,
                    [item.keyword]: {
                      label: item.keyword,
                      color: keywordColors[item.keyword],
                    }
                  }), {})}
                  className="h-[520px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keywordData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" style={{ fontSize: '12px' }} label={{ value: 'Number of Jobs', position: 'bottom' }} />
                      <YAxis dataKey="keyword" type="category" style={{ fontSize: '12px' }} width={60} />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">{data.keyword}</p>
                                <p className="text-sm text-muted-foreground">Jobs: {data.count}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {keywordData.map((entry) => (
                          <Cell key={`cell-${entry.keyword}`} fill={keywordColors[entry.keyword]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
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

        <div className="w-96 space-y-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                  <p className="text-xl font-bold">{totalJobs}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Avg per {viewMode === "monthly" ? "Month" : "Day"}</p>
                  <p className="text-xl font-bold">{avgJobsPerPeriod}</p>
                </div>
              </div>
              {topDepartment && (
                <div>
                  <p className="text-xs text-muted-foreground">Top Department</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: departmentColors[topDepartment.department] }}
                    />
                    <p className="text-sm font-semibold">{topDepartment.department}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{topDepartment.count} jobs ({topDepartment.percentage}%)</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Department Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {departmentStats.map((stat) => (
                <div key={stat.department} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded"
                        style={{ backgroundColor: departmentColors[stat.department] }}
                      />
                      <span className="text-xs font-medium">{stat.department}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: departmentColors[stat.department]
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.percentage}% of total</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Metrics;
