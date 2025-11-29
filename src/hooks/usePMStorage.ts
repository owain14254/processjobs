import { useState, useEffect } from "react";

export interface PMJob {
  costCtr: string;
  s: string;
  functionalLocation: string;
  functlocdescrip: string;
  type: string;
  order: string;
  bscStart: string;
  release: string;
  lt: string;
  description: string;
  systemStatus: string;
  objectDescription: string;
  df: string;
  equipment: string;
  message: string;
  enteredBy: string;
  changedBy: string;
  createdOn: string;
  changedOn: string;
  completed?: boolean;
}

const DB_NAME = "PMDatabase";
const DB_VERSION = 1;
const STORE_NAME = "pms";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "order" });
      }
    };
  });
};

const getDBData = async (): Promise<PMJob[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const setDBData = async (data: PMJob[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.clear();
    data.forEach((item) => store.add(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const clearDBData = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const usePMStorage = () => {
  const [pmJobs, setPMJobs] = useState<PMJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getDBData();
        setPMJobs(data);
      } catch (error) {
        console.error("Failed to load PM data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && pmJobs.length > 0) {
      setDBData(pmJobs).catch((error) => {
        console.error("Failed to save PM data:", error);
      });
    }
  }, [pmJobs, isLoading]);

  const importData = async (file: File, shouldMerge = false): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content) as PMJob[];

          if (!Array.isArray(importedData)) {
            throw new Error("Invalid data format");
          }

          if (shouldMerge) {
            const existingOrders = new Set(pmJobs.map((pm) => pm.order));
            const newData = importedData.filter((pm) => !existingOrders.has(pm.order));
            setPMJobs([...pmJobs, ...newData]);
          } else {
            setPMJobs(importedData);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(pmJobs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pm-jobs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const updatePM = (order: string, updates: Partial<PMJob>) => {
    setPMJobs((prev) =>
      prev.map((pm) => (pm.order === order ? { ...pm, ...updates } : pm))
    );
  };

  const clearData = async () => {
    await clearDBData();
    setPMJobs([]);
  };

  return {
    pmJobs,
    isLoading,
    importData,
    exportData,
    updatePM,
    clearData,
  };
};
