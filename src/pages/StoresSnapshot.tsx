import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Trash2, Search, Loader2, KeyRound, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoresStorage, StoreItem } from "@/hooks/useStoresStorage";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const StoreRow = memo(({
  item
}: {
  item: StoreItem;
}) => <TableRow>
    <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4">{item.material}</TableCell>
    <TableCell className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4">{item.storageBin}</TableCell>
    <TableCell className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 max-w-[80px] sm:max-w-[150px] md:max-w-none truncate">{item.materialDescription}</TableCell>
    <TableCell className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 max-w-[80px] sm:max-w-[150px] md:max-w-none truncate">{item.materialAdditionalDescription}</TableCell>
    <TableCell className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4">{item.vendorNumber}</TableCell>
  </TableRow>);
StoreRow.displayName = "StoreRow";
const StoresSnapshot = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    storesData,
    isLoading,
    importData,
    exportData,
    clearData
  } = useStoresStorage();
  // Simple unified search
  const [simpleSearch, setSimpleSearch] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Advanced search fields
  const [sapNumber, setSapNumber] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [vendorNumber, setVendorNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  // Result page filter - single search box
  const [resultSearchQuery, setResultSearchQuery] = useState("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<keyof StoreItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load admin mode from localStorage
  useEffect(() => {
    const adminMode = localStorage.getItem("storesAdminMode") === "true";
    setIsAdminMode(adminMode);
  }, []);
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If there's existing data, show merge/replace dialog
    if (storesData.length > 0) {
      setPendingImportFile(file);
      setShowImportDialog(true);
    } else {
      // No existing data, just import directly
      handleImportConfirm(false, file);
    }
    e.target.value = "";
  }, [storesData.length]);
  const handleImportConfirm = useCallback(async (shouldMerge: boolean, file?: File) => {
    const fileToImport = file || pendingImportFile;
    if (!fileToImport) return;
    const result = await importData(fileToImport, shouldMerge);
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
    setShowImportDialog(false);
    setPendingImportFile(null);
  }, [pendingImportFile, importData, toast]);
  const handleExport = useCallback(() => {
    if (storesData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export",
        variant: "destructive"
      });
      return;
    }
    exportData();
    toast({
      title: "Success",
      description: "Data exported successfully"
    });
  }, [storesData.length, exportData, toast]);
  const handleClearConfirm = useCallback(() => {
    clearData();
    setShowClearDialog(false);
    toast({
      title: "Success",
      description: "All data has been cleared"
    });
  }, [clearData, toast]);
  const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Process3116") {
      setIsAdminMode(true);
      localStorage.setItem("storesAdminMode", "true");
      setShowPasswordDialog(false);
      setPasswordInput("");
      toast({
        title: "Admin Mode Enabled",
        description: "You can now access admin features"
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again",
        variant: "destructive"
      });
      setPasswordInput("");
    }
  }, [passwordInput, toast]);
  const toggleAdminMode = useCallback(() => {
    if (isAdminMode) {
      setIsAdminMode(false);
      localStorage.setItem("storesAdminMode", "false");
      toast({
        title: "Admin Mode Disabled"
      });
    } else {
      setShowPasswordDialog(true);
    }
  }, [isAdminMode, toast]);
  const handleSearch = useCallback(() => {
    if (storesData.length === 0) return;
    setIsSearching(true);
    // Simulate search processing
    setTimeout(() => {
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  }, [storesData.length]);
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && storesData.length > 0) {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch, isSearching, storesData.length]);
  const handleViewAll = useCallback(() => {
    setSimpleSearch("");
    setSapNumber("");
    setLocation("");
    setDescription("");
    setVendorNumber("");
    setIsSearching(true);
    setTimeout(() => {
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  }, []);
  const handleSort = useCallback((column: keyof StoreItem) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn, sortDirection]);
  const getSortIcon = (column: keyof StoreItem) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  // Core pattern matching function per spec
  const matchesPattern = useCallback((value: string, pattern: string): boolean => {
    if (!pattern.trim()) return true;
    
    // Normalize: Replace multiple spaces with single space
    const normalizedValue = value.replace(/\s+/g, " ").trim();
    const normalizedPattern = pattern.replace(/\s+/g, " ").trim();
    
    // Check if pattern contains regex special chars or wildcard
    const hasSpecialChars = /[+?^${}()|[\]\\]/.test(normalizedPattern);
    const hasWildcard = normalizedPattern.includes("*");
    const isRegexMode = hasSpecialChars || hasWildcard;
    
    try {
      if (isRegexMode) {
        // Regex/wildcard mode: escape special chars except *, replace * with .*
        const escaped = normalizedPattern.replace(/[+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = escaped.replace(/\*/g, ".*");
        const regex = new RegExp(regexPattern, "i");
        return regex.test(normalizedValue);
      } else {
        // Plain text mode: split by spaces, all words must appear (any order)
        const words = normalizedPattern.split(" ").filter(w => w.length > 0);
        const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        // Build positive lookahead regex: (?=.*word1)(?=.*word2)...
        const lookaheadPattern = escapedWords.map(w => `(?=.*${w})`).join("");
        const regex = new RegExp(lookaheadPattern, "i");
        return regex.test(normalizedValue);
      }
    } catch {
      // Fallback to case-insensitive substring match
      return normalizedValue.toLowerCase().includes(normalizedPattern.toLowerCase());
    }
  }, []);

  // Performance-optimized filtering
  const filteredData = useMemo(() => {
    if (!showResults) return [];

    let results = storesData;
    
    if (simpleSearch.trim()) {
      const pattern = simpleSearch.trim();
      const hasSpecialChars = /[+?^${}()|[\]\\]/.test(pattern);
      const hasWildcard = pattern.includes("*");
      const isRegexMode = hasSpecialChars || hasWildcard;
      
      if (isRegexMode) {
        // Regex/wildcard: check each field individually with OR logic
        results = results.filter(item => 
          matchesPattern(item.material, pattern) || 
          matchesPattern(item.storageBin, pattern) || 
          matchesPattern(item.materialDescription, pattern) || 
          matchesPattern(item.materialAdditionalDescription, pattern) || 
          matchesPattern(item.vendorNumber, pattern)
        );
      } else {
        // Plain text: combine all fields, all words must appear somewhere
        results = results.filter(item => {
          const combined = `${item.material} ${item.storageBin} ${item.materialDescription} ${item.materialAdditionalDescription} ${item.vendorNumber}`;
          return matchesPattern(combined, pattern);
        });
      }
    } else {
      // Advanced search: AND logic across individual field filters
      results = results.filter(item => {
        const matchesSap = matchesPattern(item.material, sapNumber);
        const matchesLoc = matchesPattern(item.storageBin, location);
        const matchesDesc = matchesPattern(`${item.materialDescription} ${item.materialAdditionalDescription}`, description);
        const matchesVendor = matchesPattern(item.vendorNumber, vendorNumber);
        return matchesSap && matchesLoc && matchesDesc && matchesVendor;
      });
    }

    // Apply result page search query (same logic as simple search)
    if (resultSearchQuery.trim()) {
      const pattern = resultSearchQuery.trim();
      const hasSpecialChars = /[+?^${}()|[\]\\]/.test(pattern);
      const hasWildcard = pattern.includes("*");
      const isRegexMode = hasSpecialChars || hasWildcard;
      
      if (isRegexMode) {
        results = results.filter(item => 
          matchesPattern(item.material, pattern) || 
          matchesPattern(item.storageBin, pattern) || 
          matchesPattern(item.materialDescription, pattern) || 
          matchesPattern(item.materialAdditionalDescription, pattern) || 
          matchesPattern(item.vendorNumber, pattern)
        );
      } else {
        results = results.filter(item => {
          const combined = `${item.material} ${item.storageBin} ${item.materialDescription} ${item.materialAdditionalDescription} ${item.vendorNumber}`;
          return matchesPattern(combined, pattern);
        });
      }
    }

    // Apply sorting
    if (sortColumn) {
      results = [...results].sort((a, b) => {
        const aVal = a[sortColumn].toLowerCase();
        const bVal = b[sortColumn].toLowerCase();
        if (sortDirection === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    return results;
  }, [storesData, simpleSearch, sapNumber, location, description, vendorNumber, showResults, resultSearchQuery, sortColumn, sortDirection, matchesPattern]);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>;
  }
  return <div className="h-screen bg-background flex flex-col">
      <div className="w-full px-4 py-6 space-y-6 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button onClick={() => navigate("/")} variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={mullerLogo} alt="Müller" className="h-8 sm:h-12 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Stores Snapshot</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Engineering Stores Database</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <label>
              <Button variant="outline" size="icon" asChild title="Import Data" className="h-8 w-8 sm:h-10 sm:w-10">
                <span>
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </span>
              </Button>
            </label>
            <Button onClick={handleExport} variant="outline" size="icon" title="Export Data" disabled={storesData.length === 0} className="h-8 w-8 sm:h-10 sm:w-10">
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <ThemeToggle />
            <Button onClick={toggleAdminMode} variant={isAdminMode ? "destructive" : "outline"} size="icon" title={isAdminMode ? "Exit Admin Mode" : "Enter Admin Mode"} className="h-8 w-8 sm:h-10 sm:w-10">
              <KeyRound className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Search Section */}
        {!showResults && <div className="flex flex-col items-center justify-center flex-1 gap-6 px-2 sm:px-4">
            <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4">
              {/* Simple Search - Hidden when advanced search is active */}
              {!showAdvancedSearch && <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs font-medium block sm:text-lg text-center">​</label>
                <Input value={simpleSearch} onChange={e => setSimpleSearch(e.target.value)} onKeyDown={handleSearchKeyDown} className="h-9 sm:h-10" placeholder="Search across all fields... " />
              </div>}

              {/* Advanced Search Fields */}
              {showAdvancedSearch && <div className="space-y-3 sm:space-y-4 pt-2">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium block text-left">SAP Number</label>
                    <Input value={sapNumber} onChange={e => setSapNumber(e.target.value)} onKeyDown={handleSearchKeyDown} className="h-9 sm:h-10" placeholder="Search SAP Number... " />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium block text-left">Location</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={handleSearchKeyDown} className="h-9 sm:h-10" placeholder="Search Location... " />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium block text-left">Description</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} onKeyDown={handleSearchKeyDown} className="h-9 sm:h-10" placeholder="Search Description... " />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium block text-left">Vendor Number</label>
                    <Input value={vendorNumber} onChange={e => setVendorNumber(e.target.value)} onKeyDown={handleSearchKeyDown} className="h-9 sm:h-10" placeholder="Search Vendor Number... " />
                  </div>
                </div>}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button onClick={handleSearch} className="w-full sm:min-w-[140px]" disabled={isSearching || storesData.length === 0}>
                  {isSearching ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </> : <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>}
                </Button>
                <Button onClick={handleViewAll} variant="outline" className="w-full sm:min-w-[140px]" disabled={isSearching || storesData.length === 0}>
                  View All
                </Button>
              </div>

              {/* Advanced Search Toggle - Below search buttons and faded */}
              <Button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} variant="ghost" size="sm" className="w-full opacity-50 hover:opacity-100 transition-opacity">
                {showAdvancedSearch ? "Hide" : "Show"} Advanced Search
              </Button>
            </div>
          </div>}

        {/* Controls - Only show when results are displayed */}
        {showResults && <>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button onClick={() => {
            setShowResults(false);
            setResultSearchQuery("");
            setSortColumn(null);
            setSortDirection("asc");
          }} variant="outline" size="sm" className="shrink-0">
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">New Search</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex-1 min-w-0">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input placeholder="Find on page..." value={resultSearchQuery} onChange={e => setResultSearchQuery(e.target.value)} className="h-8 pl-8 text-sm" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap text-center sm:text-left">
                {filteredData.length} of {storesData.length}
              </span>
              {isAdminMode && <Button onClick={() => setShowClearDialog(true)} variant="destructive" size="sm" disabled={storesData.length === 0} className="shrink-0">
                  <Trash2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </Button>}
            </div>
          </>}

        {/* Table - Only show when results are displayed */}
        {showResults && <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50 select-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap" onClick={() => handleSort("material")}>
                      <span className="hidden sm:inline">SAP Number</span>
                      <span className="sm:hidden">SAP</span>
                      {getSortIcon("material")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 select-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap" onClick={() => handleSort("storageBin")}>
                      <span className="hidden sm:inline">Location</span>
                      <span className="sm:hidden">Loc</span>
                      {getSortIcon("storageBin")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 select-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap" onClick={() => handleSort("materialDescription")}>
                      <span className="hidden sm:inline">Description</span>
                      <span className="sm:hidden">Desc</span>
                      {getSortIcon("materialDescription")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 select-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap" onClick={() => handleSort("materialAdditionalDescription")}>
                      <span className="hidden md:inline">Additional Description</span>
                      <span className="hidden sm:inline md:hidden">Add. Desc</span>
                      <span className="sm:hidden">Add</span>
                      {getSortIcon("materialAdditionalDescription")}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 select-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap" onClick={() => handleSort("vendorNumber")}>
                      <span className="hidden sm:inline">Vendor</span>
                      <span className="sm:hidden">Vnd</span>
                      {getSortIcon("vendorNumber")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
                        No items match your search criteria
                      </TableCell>
                    </TableRow> : filteredData.map((item, index) => <StoreRow key={`${item.material}-${item.storageBin}-${index}`} item={item} />)}
                </TableBody>
              </Table>
            </div>
          </div>}

        {/* Empty state when no data */}
        {!showResults && storesData.length === 0 && <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No data available</p>
            <p className="text-sm">Import a JSON file to get started</p>
          </div>}
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {storesData.length} items from the stores database. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import/Overwrite Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              You have {storesData.length} items in your database. Would you like to:
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => handleImportConfirm(false)} variant="destructive">
              Replace All Data
              <span className="text-xs ml-2 opacity-80">(Delete existing)</span>
            </Button>
            <Button onClick={() => handleImportConfirm(true)} variant="default">
              Merge with Existing
              <span className="text-xs ml-2 opacity-80">(Add or update)</span>
            </Button>
            <Button onClick={() => setShowImportDialog(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default StoresSnapshot;