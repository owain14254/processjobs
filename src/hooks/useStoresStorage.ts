import { useState, useEffect } from "react";

export interface StoreItem {
  material: string;
  storageBin: string;
  materialDescription: string;
  materialAdditionalDescription: string;
  vendorNumber: string;
}

const DB_NAME = "stores_snapshot_db";
const STORE_NAME = "stores_data";
const DB_VERSION = 1;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Get data from IndexedDB
const getDBData = async (): Promise<StoreItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("data");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

// Save data to IndexedDB
const setDBData = async (data: StoreItem[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, "data");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Clear data from IndexedDB
const clearDBData = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete("data");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const useStoresStorage = () => {
  const [storesData, setStoresData] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getDBData();
        setStoresData(data);
        console.log("✓ Loaded", data.length, "items from IndexedDB");
      } catch (error) {
        console.error("Error loading stores data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to IndexedDB when data changes
  useEffect(() => {
    if (!isLoading && storesData.length > 0) {
      setDBData(storesData)
        .then(() => {
          const sizeKB = Math.round(JSON.stringify(storesData).length / 1024);
          console.log(`✓ Saved ${storesData.length} items (${sizeKB} KB) to IndexedDB`);
        })
        .catch((error) => {
          console.error("Error saving stores data:", error);
        });
    }
  }, [storesData, isLoading]);

  const importData = async (file: File, shouldMerge: boolean = false): Promise<{ success: boolean; message: string }> => {
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

      // Merge or replace data
      let finalData: StoreItem[];
      if (shouldMerge && storesData.length > 0) {
        // Merge: add new items, update existing based on material + storageBin
        const existingMap = new Map(
          storesData.map(item => [`${item.material}-${item.storageBin}`, item])
        );
        
        data.forEach((item: StoreItem) => {
          existingMap.set(`${item.material}-${item.storageBin}`, item);
        });
        
        finalData = Array.from(existingMap.values());
      } else {
        // Replace: overwrite all data
        finalData = data;
      }

      // Calculate size
      const sizeKB = Math.round(JSON.stringify(finalData).length / 1024);
      console.log(`Importing ${finalData.length} items (${sizeKB} KB) - Mode: ${shouldMerge ? 'Merge' : 'Replace'}`);

      // Save to IndexedDB
      await setDBData(finalData);
      setStoresData(finalData);
      
      console.log(`✓ Successfully imported and saved ${finalData.length} items to IndexedDB`);
      return { 
        success: true, 
        message: shouldMerge 
          ? `Successfully merged ${data.length} items. Total: ${finalData.length} items (${sizeKB} KB)`
          : `Successfully imported ${finalData.length} items (${sizeKB} KB)` 
      };
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

  const clearData = async () => {
    try {
      await clearDBData();
      setStoresData([]);
      console.log("✓ Cleared all stores data from IndexedDB");
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  return {
    storesData,
    isLoading,
    importData,
    exportData,
    clearData,
  };
};
