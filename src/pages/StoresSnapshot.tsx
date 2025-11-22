import { useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoresStorage, StoreItem } from "@/hooks/useStoresStorage";
import { useToast } from "@/hooks/use-toast";
import mullerLogo from "@/assets/muller-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StoreRow = memo(({ item }: { item: StoreItem }) => (
  <TableRow>
    <TableCell className="font-medium">{item.material}</TableCell>
    <TableCell>{item.storageBin}</TableCell>
    <TableCell>{item.materialDescription}</TableCell>
    <TableCell>{item.materialAdditionalDescription}</TableCell>
    <TableCell>{item.vendorNumber}</TableCell>
  </TableRow>
));

StoreRow.displayName = "StoreRow";

const StoresSnapshot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storesData, isLoading, importData, exportData, clearData } = useStoresStorage();
  const [sapNumber, setSapNumber] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [vendorNumber, setVendorNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importData(file);
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    e.target.value = "";
  }, [importData, toast]);

  const handleExport = useCallback(() => {
    if (storesData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export",
        variant: "destructive",
      });
      return;
    }
    exportData();
    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  }, [storesData.length, exportData, toast]);

  const handleClearConfirm = useCallback(() => {
    clearData();
    setShowClearDialog(false);
    toast({
      title: "Success",
      description: "All data has been cleared",
    });
  }, [clearData, toast]);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    // Simulate search processing
    setTimeout(() => {
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleViewAll = useCallback(() => {
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

  // Performance-optimized filtering with wildcard support
  const filteredData = useMemo(() => {
    if (!showResults) return [];

    // Helper function to match with wildcard
    const matchesWildcard = (value: string, pattern: string) => {
      if (!pattern.trim()) return true;
      const isWildcard = pattern.includes("*");
      
      if (isWildcard) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = escaped.replace(/\*/g, ".*");
        const regex = new RegExp(`^${regexPattern}$`, "i");
        return regex.test(value.toLowerCase());
      }
      
      return value.toLowerCase().includes(pattern.toLowerCase());
    };

    return storesData.filter((item) => {
      const matchesSap = matchesWildcard(item.material, sapNumber);
      const matchesLoc = matchesWildcard(item.storageBin, location);
      const matchesDesc = matchesWildcard(
        `${item.materialDescription} ${item.materialAdditionalDescription}`,
        description
      );
      const matchesVendor = matchesWildcard(item.vendorNumber, vendorNumber);

      return matchesSap && matchesLoc && matchesDesc && matchesVendor;
    });
  }, [storesData, sapNumber, location, description, vendorNumber, showResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={mullerLogo} alt="Müller" className="h-12" />
            <div>
              <h1 className="text-3xl font-bold">Stores Snapshot</h1>
              <p className="text-muted-foreground">Engineering Stores Database</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/")} variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Section */}
        {!showResults && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <div className="w-full max-w-2xl space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SAP Number</label>
                <Input
                  placeholder="Search SAP Number... (use * for wildcard)"
                  value={sapNumber}
                  onChange={(e) => setSapNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="Search Location... (use * for wildcard)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Search Description... (use * for wildcard)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Number</label>
                <Input
                  placeholder="Search Vendor Number... (use * for wildcard)"
                  value={vendorNumber}
                  onChange={(e) => setVendorNumber(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSearch} 
                  className="flex-1"
                  disabled={isSearching || storesData.length === 0}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleViewAll} 
                  variant="outline"
                  disabled={isSearching || storesData.length === 0}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Controls - Only show when results are displayed */}
        {showResults && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Button 
                onClick={() => setShowResults(false)} 
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Search
              </Button>
              <div className="flex-1" />
              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </span>
                </Button>
              </label>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => setShowClearDialog(true)} 
                variant="destructive"
                disabled={storesData.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total Items: {storesData.length}</span>
              <span>Results: {filteredData.length}</span>
            </div>
          </>
        )}

        {/* Table - Only show when results are displayed */}
        {showResults && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>SAP Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Additional Description</TableHead>
                    <TableHead>Vendor Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No items match your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <StoreRow key={`${item.material}-${item.storageBin}-${index}`} item={item} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty state when no data */}
        {!showResults && storesData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No data available</p>
            <p className="text-sm">Import a JSON file to get started</p>
            <label className="inline-block mt-4">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </span>
              </Button>
            </label>
          </div>
        )}
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
    </div>
  );
};

export default StoresSnapshot;
