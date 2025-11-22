import { useState, useEffect } from "react";

export interface StoreItem {
  material: string;
  storageBin: string;
  materialDescription: string;
  materialAdditionalDescription: string;
  vendorNumber: string;
}

const STORES_KEY = "stores_snapshot_data";

export const useStoresStorage = () => {
  const [storesData, setStoresData] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(STORES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setStoresData(parsed);
        }
      } catch (error) {
        console.error("Error loading stores data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORES_KEY, JSON.stringify(storesData));
      } catch (error) {
        console.error("Error saving stores data:", error);
      }
    }
  }, [storesData, isLoading]);

  const importData = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        return { success: false, message: "Invalid file format. Expected an array." };
      }

      if (data.length === 0) {
        return { success: false, message: "File contains no data." };
      }

      // Validate the data structure
      const firstItem = data[0];
      const requiredFields = ['material', 'storageBin', 'materialDescription', 'materialAdditionalDescription', 'vendorNumber'];
      const hasAllFields = requiredFields.every(field => field in firstItem);

      if (!hasAllFields) {
        console.error("Missing required fields. Expected:", requiredFields);
        console.error("Found fields:", Object.keys(firstItem));
        return { 
          success: false, 
          message: `Invalid data format. Missing fields: ${requiredFields.filter(f => !(f in firstItem)).join(', ')}` 
        };
      }

      setStoresData(data);
      // Immediately save to localStorage
      localStorage.setItem(STORES_KEY, JSON.stringify(data));
      console.log("✓ Successfully imported and saved", data.length, "items to localStorage");
      return { success: true, message: `Successfully imported ${data.length} items` };
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `Failed to import: ${errorMessage}` };
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(storesData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stores_snapshot_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setStoresData([]);
    localStorage.removeItem(STORES_KEY);
    console.log("Cleared all stores data from localStorage");
  };

  return {
    storesData,
    isLoading,
    importData,
    exportData,
    clearData,
  };
};
