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

      // Check if data needs format conversion (backward compatibility)
      const firstItem = data[0];
      console.log("First item structure:", firstItem);
      
      // Detect old format and convert if needed
      let convertedData = data;
      
      // If old format has different field names, convert them
      if (firstItem.sapNumber !== undefined || firstItem.location !== undefined) {
        console.log("Converting from old format to new format");
        convertedData = data.map((item: any) => ({
          material: item.sapNumber || item.material || "",
          storageBin: item.location || item.storageBin || "",
          materialDescription: item.description || item.materialDescription || "",
          materialAdditionalDescription: item.additionalDescription || item.materialAdditionalDescription || "",
          vendorNumber: item.vendor || item.vendorNumber || ""
        }));
      }

      // Validate required fields
      const hasRequiredFields = convertedData.every((item: any) => 
        typeof item.material === 'string' &&
        typeof item.storageBin === 'string' &&
        typeof item.materialDescription === 'string' &&
        typeof item.materialAdditionalDescription === 'string' &&
        typeof item.vendorNumber === 'string'
      );

      if (!hasRequiredFields) {
        console.error("Invalid data structure. Expected fields: material, storageBin, materialDescription, materialAdditionalDescription, vendorNumber");
        return { 
          success: false, 
          message: "Invalid data format. Expected fields: material, storageBin, materialDescription, materialAdditionalDescription, vendorNumber" 
        };
      }

      setStoresData(convertedData);
      // Immediately save to localStorage
      localStorage.setItem(STORES_KEY, JSON.stringify(convertedData));
      console.log("Imported and saved", convertedData.length, "items to localStorage");
      return { success: true, message: `Successfully imported ${convertedData.length} items` };
    } catch (error) {
      console.error("Import error:", error);
      return { success: false, message: "Failed to import file. Please check the format." };
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
