import { useJobStorage } from "@/hooks/useJobStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Download, Calendar, CalendarDays, X, Plus, Tags, KeyRound, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
    return saved ? JSON.parse(saved) : [];
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showShiftView, setShowShiftView] = useState(false);

  const timespanLabels: Record<Timespan, string> = {
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
    "6months": "Last 6 Months",
    "1year": "Last Year",
    all: "All Time",
  };

  // Save keywords to localStorage
  useEffect(() => {
    localStorage.setItem("metricsKeywords", JSON.stringify(keywords));
  }, [keywords]);

  // Check for admin mode on mount
  useEffect(() => {
    const adminPassword = sessionStorage.getItem("adminModeMetrics");
    setIsAdminMode(adminPassword === "Process3116");
  }, []);

  // Function to determine shift for a given date and time
  // Pattern: Each shift works 4 days (7am-7pm), 4 days off, 4 nights (7pm-7am), 4 days off (16-day cycle)
  const getShiftForDateTime = useCallback((date: Date) => {
    const referenceDate = new Date(2025, 5, 22, 7, 0, 0); // Shift 1 days start
    const hour = date.getHours();
    const isDayTime = hour >= 7 && hour < 19;

    // Jobs before 7am belong to previous night's shift
    let adjustedDate = new Date(date);
    if (hour < 7) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }

    const diffMs = adjustedDate.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const cycleDay = ((diffDays % 16) + 16) % 16;

    let shift: 1 | 2 | 3 | 4 = 1;
    let shiftType: "day" | "night" = isDayTime ? "day" : "night";

    if (cycleDay >= 0 && cycleDay < 4) {
      // Days 0-3: Shift 1 on days, Shift 3 on nights
      shift = isDayTime ? 1 : 3;
    } else if (cycleDay >= 4 && cycleDay < 8) {
      // Days 4-7: Shift 2 on days, Shift 4 on nights
      shift = isDayTime ? 2 : 4;
    } else if (cycleDay >= 8 && cycleDay < 12) {
      // Days 8-11: Shift 3 on days, Shift 1 on nights
      shift = isDayTime ? 3 : 1;
    } else {
      // Days 12-15: Shift 4 on days, Shift 2 on nights
      shift = isDayTime ? 4 : 2;
    }

    return { shift, type: shiftType };
  }, []);

  const shiftColors = useMemo(
    () => ({
      1: "hsl(221, 83%, 53%)", // Blue - Shift 1 (Days)
      2: "hsl(142, 71%, 45%)", // Green - Shift 2 (Nights)
      3: "hsl(346, 77%, 50%)", // Red - Shift 3 (Nights)
      4: "hsl(38, 92%, 50%)", // Orange - Shift 4 (Days)
    }),
    [],
  );

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

    return completedJobs.filter((job) => new Date(job.completedAt) >= cutoffDate);
  }, [completedJobs, timespan]);

  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    filteredJobsByTimespan.forEach((job) => depts.add(job.department));
    return Array.from(depts).sort();
  }, [filteredJobsByTimespan]);

  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set(allDepartments));

  // Update selected departments when all departments change
  useEffect(() => {
    setSelectedDepartments(new Set(allDepartments));
  }, [allDepartments]);

  const departmentColors: Record<string, string> = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)", // Blue
      "hsl(142, 71%, 45%)", // Green
      "hsl(262, 83%, 58%)", // Purple
      "hsl(346, 77%, 50%)", // Red
      "hsl(38, 92%, 50%)", // Orange
      "hsl(173, 58%, 39%)", // Teal
      "hsl(280, 65%, 60%)", // Pink
      "hsl(198, 93%, 60%)", // Cyan
    ];

    const colorMap: Record<string, string> = {};
    allDepartments.forEach((dept, idx) => {
      colorMap[dept] = colors[idx % colors.length];
    });
    return colorMap;
  }, [allDepartments]);

  const toggleDepartment = useCallback((dept: string) => {
    setSelectedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  }, []);

  const monthlyData = useMemo(() => {
    if (viewMode !== "monthly") return [];

    const dataMap = new Map<string, Map<string, number>>();

    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;

      const date = new Date(job.completedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, new Map());
      }

      const monthData = dataMap.get(monthKey)!;
      monthData.set(job.department, (monthData.get(job.department) || 0) + 1);
    });

    const sortedMonths = Array.from(dataMap.keys()).sort();

    return sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const departments = dataMap.get(monthKey)!;
      const result: any = { month: monthName };

      departments.forEach((count, dept) => {
        result[dept] = count;
      });

      return result;
    });
  }, [filteredJobsByTimespan, selectedDepartments, viewMode]);

  const dailyData = useMemo(() => {
    if (viewMode !== "daily") return [];

    // Store jobs for each day, split by day/night periods
    const dataMap = new Map<
      string,
      {
        dayShift: { shift: number; jobs: Map<string, number> };
        nightShift: { shift: number; jobs: Map<string, number> };
      }
    >();

    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;

      const date = new Date(job.completedAt);
      const hour = date.getHours();

      // Determine which calendar day this belongs to
      let calendarDate = new Date(date);
      if (hour < 7) {
        // Before 7am belongs to previous day's night shift
        calendarDate.setDate(calendarDate.getDate() - 1);
      }

      const dayKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(calendarDate.getDate()).padStart(2, "0")}`;

      // Initialize day data if needed
      if (!dataMap.has(dayKey)) {
        // Get which shifts are working on this day (7am-7pm) and night (7pm-7am next day)
        const dayShiftDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth(),
          calendarDate.getDate(),
          12,
          0,
          0,
        );
        const nightShiftDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth(),
          calendarDate.getDate(),
          23,
          0,
          0,
        );

        const dayShiftInfo = getShiftForDateTime(dayShiftDate);
        const nightShiftInfo = getShiftForDateTime(nightShiftDate);

        dataMap.set(dayKey, {
          dayShift: { shift: dayShiftInfo.shift, jobs: new Map() },
          nightShift: { shift: nightShiftInfo.shift, jobs: new Map() },
        });
      }

      const dayData = dataMap.get(dayKey)!;
      const isDayTime = hour >= 7 && hour < 19;
      const targetShift = isDayTime ? dayData.dayShift : dayData.nightShift;

      targetShift.jobs.set(job.department, (targetShift.jobs.get(job.department) || 0) + 1);
    });

    const sortedDays = Array.from(dataMap.keys()).sort();

    // Show appropriate number of days based on timespan
    const daysToShow = timespan === "7days" ? 7 : timespan === "30days" ? 30 : sortedDays.length;
    const limitedDays = sortedDays.slice(-daysToShow);

    return limitedDays.map((dayKey) => {
      const [year, month, day] = dayKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayName = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayData = dataMap.get(dayKey)!;

      const result: any = {
        month: dayName,
        dayShift: dayData.dayShift.shift,
        nightShift: dayData.nightShift.shift,
        dayTotal: 0,
        nightTotal: 0,
      };

      // Calculate totals for day and night
      Array.from(selectedDepartments).forEach((dept) => {
        const dayCount = dayData.dayShift.jobs.get(dept) || 0;
        const nightCount = dayData.nightShift.jobs.get(dept) || 0;
        result.dayTotal += dayCount;
        result.nightTotal += nightCount;
        result[`${dept}_day`] = dayCount;
        result[`${dept}_night`] = nightCount;
        result[dept] = dayCount + nightCount;
      });

      return result;
    });
  }, [filteredJobsByTimespan, selectedDepartments, timespan, viewMode, getShiftForDateTime]);

  // Calculate shift statistics - separate for day and night work for all 4 shifts
  const shiftStats = useMemo(() => {
    if (viewMode !== "daily") return null;

    const shiftDayJobCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const shiftDayWorkDays = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const shiftNightJobCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const shiftNightWorkDays = { 1: 0, 2: 0, 3: 0, 4: 0 };

    dailyData.forEach((day: any) => {
      const dayShift = day.dayShift as 1 | 2 | 3 | 4;
      const nightShift = day.nightShift as 1 | 2 | 3 | 4;

      // Count day shift jobs (always count the day even if 0 jobs)
      let dayJobCount = 0;
      Array.from(selectedDepartments).forEach((dept) => {
        dayJobCount += day[`${dept}_day`] || 0;
      });
      shiftDayJobCounts[dayShift] += dayJobCount;
      shiftDayWorkDays[dayShift]++;

      // Count night shift jobs (always count the day even if 0 jobs)
      let nightJobCount = 0;
      Array.from(selectedDepartments).forEach((dept) => {
        nightJobCount += day[`${dept}_night`] || 0;
      });
      shiftNightJobCounts[nightShift] += nightJobCount;
      shiftNightWorkDays[nightShift]++;
    });

    return {
      1: {
        dayAvg: shiftDayWorkDays[1] > 0 ? (shiftDayJobCounts[1] / shiftDayWorkDays[1]).toFixed(1) : "0",
        nightAvg: shiftNightWorkDays[1] > 0 ? (shiftNightJobCounts[1] / shiftNightWorkDays[1]).toFixed(1) : "0",
        dayTotal: shiftDayJobCounts[1],
        nightTotal: shiftNightJobCounts[1],
      },
      2: {
        dayAvg: shiftDayWorkDays[2] > 0 ? (shiftDayJobCounts[2] / shiftDayWorkDays[2]).toFixed(1) : "0",
        nightAvg: shiftNightWorkDays[2] > 0 ? (shiftNightJobCounts[2] / shiftNightWorkDays[2]).toFixed(1) : "0",
        dayTotal: shiftDayJobCounts[2],
        nightTotal: shiftNightJobCounts[2],
      },
      3: {
        dayAvg: shiftDayWorkDays[3] > 0 ? (shiftDayJobCounts[3] / shiftDayWorkDays[3]).toFixed(1) : "0",
        nightAvg: shiftNightWorkDays[3] > 0 ? (shiftNightJobCounts[3] / shiftNightWorkDays[3]).toFixed(1) : "0",
        dayTotal: shiftDayJobCounts[3],
        nightTotal: shiftNightJobCounts[3],
      },
      4: {
        dayAvg: shiftDayWorkDays[4] > 0 ? (shiftDayJobCounts[4] / shiftDayWorkDays[4]).toFixed(1) : "0",
        nightAvg: shiftNightWorkDays[4] > 0 ? (shiftNightJobCounts[4] / shiftNightWorkDays[4]).toFixed(1) : "0",
        dayTotal: shiftDayJobCounts[4],
        nightTotal: shiftNightJobCounts[4],
      },
    };
  }, [dailyData, selectedDepartments, viewMode]);

  // Keyword analysis data - optimized to only run when in keywords view
  const keywordData = useMemo(() => {
    if (viewMode !== "keywords") return [];

    const keywordMap = new Map<string, number>();
    const upperKeywords = keywords.map((k) => k.toUpperCase());

    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;

      const description = job.description.toUpperCase();

      // Find keywords in description
      upperKeywords.forEach((keyword, idx) => {
        if (description.includes(keyword)) {
          keywordMap.set(keywords[idx], (keywordMap.get(keywords[idx]) || 0) + 1);
        }
      });
    });

    return Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredJobsByTimespan, selectedDepartments, keywords, viewMode]);

  const keywordColors = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)", // Blue
      "hsl(142, 71%, 45%)", // Green
      "hsl(262, 83%, 58%)", // Purple
      "hsl(346, 77%, 50%)", // Red
      "hsl(38, 92%, 50%)", // Orange
      "hsl(173, 58%, 39%)", // Teal
      "hsl(280, 65%, 60%)", // Pink
      "hsl(198, 93%, 60%)", // Cyan
      "hsl(48, 96%, 53%)", // Yellow
      "hsl(340, 82%, 52%)", // Rose
    ];

    const colorMap: Record<string, string> = {};
    keywords.forEach((keyword, idx) => {
      colorMap[keyword] = colors[idx % colors.length];
    });
    return colorMap;
  }, [keywords]);

  const { toast } = useToast();

  const toggleAdminMode = useCallback(() => {
    if (isAdminMode) {
      setIsAdminMode(false);
      sessionStorage.removeItem("adminModeMetrics");
      toast({ title: "Admin Mode Disabled" });
    } else {
      navigate("/admin-login");
    }
  }, [isAdminMode, toast, navigate]);

  const addKeyword = useCallback(() => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toUpperCase())) {
      setKeywords([...keywords, newKeyword.trim().toUpperCase()]);
      setNewKeyword("");
    }
  }, [newKeyword, keywords]);

  const removeKeyword = useCallback(
    (keyword: string) => {
      setKeywords(keywords.filter((k) => k !== keyword));
    },
    [keywords],
  );

  const autoFindKeywords = useCallback(() => {
    // Extract all words from descriptions
    const wordFrequency = new Map<string, number>();

    // Common words to exclude (expanded list)
    const stopWords = new Set([
      "THE",
      "A",
      "AN",
      "AND",
      "OR",
      "BUT",
      "IN",
      "ON",
      "AT",
      "TO",
      "FOR",
      "OF",
      "WITH",
      "IS",
      "WAS",
      "BE",
      "BEEN",
      "HAVE",
      "HAS",
      "HAD",
      "DO",
      "DOES",
      "DID",
      "WILL",
      "WOULD",
      "COULD",
      "SHOULD",
      "MAY",
      "MIGHT",
      "CAN",
      "NO",
      "NOT",
      "SO",
      "AS",
      "IF",
      "THEN",
      "THAN",
      "THAT",
      "THIS",
      "THESE",
      "THOSE",
      "IT",
      "ITS",
      "BY",
      "FROM",
      "UP",
      "DOWN",
      "OUT",
      "OVER",
      "UNDER",
      "AGAIN",
      "FURTHER",
      "THEN",
      "ONCE",
      "HERE",
      "THERE",
      "WHEN",
      "WHERE",
      "WHY",
      "HOW",
      "ALL",
      "BOTH",
      "EACH",
      "FEW",
      "MORE",
      "MOST",
      "OTHER",
      "SOME",
      "SUCH",
      "ONLY",
      "OWN",
      "SAME",
      "THAN",
      "TOO",
      "VERY",
      "CAN",
      "JUST",
      "NOW",
      "ALSO",
      "WELL",
    ]);

    filteredJobsByTimespan.forEach((job) => {
      if (!selectedDepartments.has(job.department)) return;

      // Split description into words, filter out short and common words
      const words = job.description
        .toUpperCase()
        .split(/\s+/)
        .filter((word) => {
          // Remove non-alphanumeric characters
          const cleaned = word.replace(/[^A-Z0-9]/g, "");
          // Keep words 2-10 characters that aren't stop words
          return cleaned.length >= 2 && cleaned.length <= 10 && !stopWords.has(cleaned);
        })
        .map((word) => word.replace(/[^A-Z0-9]/g, ""));

      words.forEach((word) => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });

    // Get top 15 most common words that appear at least 2 times
    const topWords = Array.from(wordFrequency.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    // Add new words that aren't already in keywords
    const newKeywords = topWords.filter((word) => !keywords.includes(word));
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
      toast({
        title: "Keywords added",
        description: `Found ${newKeywords.length} new common words`,
      });
    } else {
      toast({
        title: "No new keywords",
        description: "All common words are already in the list",
      });
    }
  }, [filteredJobsByTimespan, selectedDepartments, keywords, toast]);

  const chartData = viewMode === "keywords" ? keywordData : viewMode === "monthly" ? monthlyData : dailyData;

  const handleExportMetrics = useCallback(() => {
    const csvData = [
      ["Period", ...Array.from(selectedDepartments)],
      ...chartData.map((row) => [row.month, ...Array.from(selectedDepartments).map((dept) => row[dept] || 0)]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${viewMode}-${timespan}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Metrics exported",
      description: "CSV file downloaded successfully",
    });
  }, [chartData, selectedDepartments, viewMode, timespan, toast]);

  const toggleSelectAll = useCallback(() => {
    if (selectedDepartments.size === allDepartments.length) {
      setSelectedDepartments(new Set());
    } else {
      setSelectedDepartments(new Set(allDepartments));
    }
  }, [selectedDepartments.size, allDepartments]);

  const totalJobs = filteredJobsByTimespan.filter((job) => selectedDepartments.has(job.department)).length;

  const departmentStats = useMemo(() => {
    const stats = Array.from(selectedDepartments)
      .map((dept) => {
        const count = filteredJobsByTimespan.filter((job) => job.department === dept).length;
        return { department: dept, count, percentage: ((count / totalJobs) * 100).toFixed(1) };
      })
      .sort((a, b) => b.count - a.count);
    return stats;
  }, [filteredJobsByTimespan, selectedDepartments, totalJobs]);

  const topDepartment = departmentStats[0];
  const timeBasedData = viewMode === "monthly" ? monthlyData : dailyData;
  const avgJobsPerPeriod = timeBasedData.length > 0 ? (totalJobs / timeBasedData.length).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-3 py-2 sm:py-4 px-2 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Metrics Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Jobs completed by department</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{timespanLabels[timespan]}</span>
                  <span className="sm:hidden">
                    {timespan === "7days"
                      ? "7d"
                      : timespan === "30days"
                        ? "30d"
                        : timespan === "90days"
                          ? "90d"
                          : timespan === "6months"
                            ? "6m"
                            : timespan === "1year"
                              ? "1y"
                              : "All"}
                  </span>
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

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="monthly" className="gap-1 text-xs px-1 sm:px-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Monthly</span>
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-1 text-xs px-1 sm:px-2">
                  <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Daily</span>
                </TabsTrigger>
                <TabsTrigger value="keywords" className="gap-1 text-xs px-1 sm:px-2">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Keywords</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Departments ({selectedDepartments.size})</span>
                  <span className="sm:hidden">Dept ({selectedDepartments.size})</span>
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
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: departmentColors[dept] }} />
                      {dept}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleExportMetrics} className="h-8 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>

            <Button
              variant={isAdminMode ? "default" : "outline"}
              size="icon"
              onClick={toggleAdminMode}
              className="h-8 w-8"
              title={isAdminMode ? "Logout Admin" : "Admin Login"}
            >
              {isAdminMode ? (
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <KeyRound className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>

        {isAdminMode && viewMode === "daily" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
              <Switch id="shift-view" checked={showShiftView} onCheckedChange={setShowShiftView} />
              <Label htmlFor="shift-view" className="text-sm cursor-pointer">
                Show Shift View (color bars by shift)
              </Label>
            </div>

            {showShiftView && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <h3 className="text-sm font-semibold">Shift Color Key</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors[1] }} />
                    <span className="text-xs">Shift 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors[2] }} />
                    <span className="text-xs">Shift 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors[3] }} />
                    <span className="text-xs">Shift 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftColors[4] }} />
                    <span className="text-xs">Shift 4</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Each bar shows two shifts: bottom = day shift (7am-7pm), top = night shift (7pm-7am)
                </p>

                {shiftStats && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-xs font-semibold mb-3">Average Jobs Per Shift (across timespan)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: shiftColors[1] }} />
                          <span className="font-medium">Shift 1:</span>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            Days: {shiftStats[1].dayAvg} avg ({shiftStats[1].dayTotal} total)
                          </span>
                          <span>
                            Nights: {shiftStats[1].nightAvg} avg ({shiftStats[1].nightTotal} total)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: shiftColors[2] }} />
                          <span className="font-medium">Shift 2:</span>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            Days: {shiftStats[2].dayAvg} avg ({shiftStats[2].dayTotal} total)
                          </span>
                          <span>
                            Nights: {shiftStats[2].nightAvg} avg ({shiftStats[2].nightTotal} total)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: shiftColors[3] }} />
                          <span className="font-medium">Shift 3:</span>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            Days: {shiftStats[3].dayAvg} avg ({shiftStats[3].dayTotal} total)
                          </span>
                          <span>
                            Nights: {shiftStats[3].nightAvg} avg ({shiftStats[3].nightTotal} total)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: shiftColors[4] }} />
                          <span className="font-medium">Shift 4:</span>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            Days: {shiftStats[4].dayAvg} avg ({shiftStats[4].dayTotal} total)
                          </span>
                          <span>
                            Nights: {shiftStats[4].nightAvg} avg ({shiftStats[4].nightTotal} total)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[600px]">
          <Card className="flex-1 border-0 rounded-none shadow-none min-w-0 flex flex-col">
            <CardHeader className="pb-3 px-0 flex-shrink-0">
              <CardTitle className="text-base">
                {viewMode === "keywords" ? "Job Time by Keyword" : "Jobs Completed by Department"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0 flex-1 min-h-0">
              {viewMode === "keywords" ? (
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
                              <p className="mb-2">No keywords added yet</p>
                              <p className="text-xs">
                                Add keywords manually or use Auto-Find to discover common words in your job descriptions
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {keywords.map((keyword) => (
                                <div
                                  key={keyword}
                                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted"
                                >
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

                  {keywords.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center space-y-2">
                        <p>No keywords added yet</p>
                        <p className="text-sm">Use the buttons above to add keywords</p>
                      </div>
                    </div>
                  ) : keywordData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No jobs found with selected keywords
                    </div>
                  ) : (
                    <ChartContainer
                      config={keywordData.reduce(
                        (acc, item) => ({
                          ...acc,
                          [item.keyword]: {
                            label: item.keyword,
                            color: keywordColors[item.keyword],
                          },
                        }),
                        {},
                      )}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={keywordData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            style={{ fontSize: "12px" }}
                            label={{ value: "Number of Jobs", position: "bottom" }}
                          />
                          <YAxis dataKey="keyword" type="category" style={{ fontSize: "12px" }} width={60} />
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
                  )}
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No completed jobs to display for selected timespan
                </div>
              ) : (
                <ChartContainer
                  config={allDepartments.reduce(
                    (acc, dept) => ({
                      ...acc,
                      [dept]: {
                        label: dept,
                        color: departmentColors[dept],
                      },
                    }),
                    {},
                  )}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        style={{ fontSize: "11px" }}
                        angle={viewMode === "daily" ? -45 : 0}
                        textAnchor={viewMode === "daily" ? "end" : "middle"}
                        height={viewMode === "daily" ? 80 : 30}
                      />
                      <YAxis style={{ fontSize: "12px" }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      {showShiftView && viewMode === "daily" ? (
                        <>
                          {/* Create a single bar with day shift on bottom, night shift on top */}
                          <Bar dataKey="dayTotal" stackId="shift" name="Day Shift (7am-7pm)">
                            {chartData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-day-${index}`}
                                fill={shiftColors[entry.dayShift as keyof typeof shiftColors]}
                              />
                            ))}
                          </Bar>
                          <Bar dataKey="nightTotal" stackId="shift" name="Night Shift (7pm-7am)">
                            {chartData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-night-${index}`}
                                fill={shiftColors[entry.nightShift as keyof typeof shiftColors]}
                              />
                            ))}
                          </Bar>
                        </>
                      ) : (
                        Array.from(selectedDepartments).map((dept) => (
                          <Bar key={dept} dataKey={dept} fill={departmentColors[dept]} stackId="a" />
                        ))
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="w-80 xl:w-96 flex-shrink-0 space-y-2">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {topDepartment.count} jobs ({topDepartment.percentage}%)
                    </p>
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
                          backgroundColor: departmentColors[stat.department],
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
