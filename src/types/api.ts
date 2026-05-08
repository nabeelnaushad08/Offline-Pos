// Exported types shared between Electron bridge and the renderer

export interface SettingRecord {
  id: string;
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseInfo {
  size: number;
  path: string;
  tables: string[];
}

export interface BackupResult {
  success: boolean;
  path: string;
}

export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;

  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    getDataPath: () => Promise<string>;
  };

  settings: {
    get: (key: string) => Promise<SettingRecord | null>;
    set: (key: string, value: string) => Promise<SettingRecord>;
    getAll: () => Promise<SettingRecord[]>;
    delete: (key: string) => Promise<void>;
  };

  database: {
    backup: (targetPath: string) => Promise<BackupResult>;
    getInfo: () => Promise<DatabaseInfo>;
  };
}
