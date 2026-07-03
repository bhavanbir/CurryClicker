import { createJSONStorage } from "zustand/middleware";
import { desktop } from "./desktop";

// On desktop the save also lives as a plain JSON file (userData/save.json) for
// Steam Auto-Cloud, via the preload IPC bridge; on the web it stays in
// localStorage. Same serialized shape either way.
export const saveStorage = createJSONStorage(() => {
  const d = desktop();
  if (!d) return localStorage;
  return {
    getItem: (_name: string) => d.readSave(),
    setItem: (_name: string, value: string) => d.writeSave(value),
    removeItem: (_name: string) => d.writeSave(""),
  };
});
