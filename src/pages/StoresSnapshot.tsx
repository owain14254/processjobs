import { useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Trash2, Search } from "lucide-react";
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
    <TableCell className="font-medium">{item.Material}</TableCell>
    <TableCell>{item.SLoc}</TableCell>
    <TableCell>{item.Bin}</TableCell>
    <TableCell>{item.Old_material_no}</TableCell>
    <TableCell>{item.Unrestr}</TableCell>
    <TableCell>{item.Unr_Cnsgt}</TableCell>
    <TableCell>{item.Material_Description}</TableCell>
    <TableCell>{item.MS}</TableCell>
    <TableCell>{item.Mat_text}</TableCell>
    <TableCell>{item.Pl_usage}</TableCell>
    <TableCell>{item.Vendor_Mat_No}</TableCell>
    <TableCell>{item.Plnt}</TableCell>
    <TableCell>{item.BUn}</TableCell>
    <TableCell>{item.Supplier}</TableCell>
  </TableRow>
));

StoreRow.displayName = "StoreRow";

const StoresSnapshot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storesData, isLoading, importData, exportData, clearData } = useStoresStorage();
  const [searchTerm, setSearchTerm] = useState("");
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

  // Performance-optimized filtering with wildcard support
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return storesData;

    const searchLower = searchTerm.toLowerCase().trim();
    const isWildcard = searchLower.includes("*");

    // Convert wildcard pattern to regex
    const createRegex = (pattern: string) => {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
      const regexPattern = escaped.replace(/\*/g, ".*");
      return new RegExp(`^${regexPattern}$`, "i");
    };

    const regex = isWildcard ? createRegex(searchLower) : null;

    return storesData.filter((item) => {
      const searchableFields = [
        item.Material,
        item.SLoc,
        item.Bin,
        item.Old_material_no,
        item.Unrestr,
        item.Unr_Cnsgt,
        item.Material_Description,
        item.MS,
        item.Mat_text,
        item.Pl_usage,
        item.Vendor_Mat_No,
        item.Plnt,
        item.BUn,
        item.Supplier,
      ];

      if (isWildcard && regex) {
        return searchableFields.some((field) => 
          regex.test(String(field).toLowerCase())
        );
      }

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(searchLower)
      );
    });
  }, [storesData, searchTerm]);

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

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all fields... (use * for wildcard, e.g., 'ABC*' or '*123')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
          {searchTerm && <span>Filtered: {filteredData.length}</span>}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>SLoc</TableHead>
                  <TableHead>Bin</TableHead>
                  <TableHead>Old Material No.</TableHead>
                  <TableHead>Unrestr.</TableHead>
                  <TableHead>Unr. Cnsgt</TableHead>
                  <TableHead>Material Description</TableHead>
                  <TableHead>MS</TableHead>
                  <TableHead>Mat. Text</TableHead>
                  <TableHead>Pl. Usage</TableHead>
                  <TableHead>Vendor Mat. No.</TableHead>
                  <TableHead>Plnt</TableHead>
                  <TableHead>BUn</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                      {storesData.length === 0 
                        ? "No data available. Import a file to get started."
                        : "No items match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <StoreRow key={`${item.Material}-${item.Bin}-${index}`} item={item} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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
