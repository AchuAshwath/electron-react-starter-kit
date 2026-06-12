import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import type {
	UserSettings,
	UserSettingsPatch,
} from "../main/settings/settings.types";
import type { ThemeState } from "../main/theme/theme.types";

// Custom APIs for renderer — each function maps to an ipcMain.handle channel
const api = {
	/** Fetch the Electron app version from the main process */
	getAppVersion: (): Promise<string> => ipcRenderer.invoke("get-app-version"),
	/** Fetch system info (platform, arch, versions) from the main process */
	getSystemInfo: (): Promise<{
		platform: string;
		arch: string;
		nodeVersion: string;
		chromeVersion: string;
		electronVersion: string;
	}> => ipcRenderer.invoke("get-system-info"),

	settings: {
		get: (): Promise<UserSettings> => ipcRenderer.invoke("settings:get"),
		update: (patch: UserSettingsPatch): Promise<UserSettings> =>
			ipcRenderer.invoke("settings:update", patch),
		reset: (): Promise<UserSettings> => ipcRenderer.invoke("settings:reset"),
	},

	theme: {
		get: (): Promise<ThemeState> => ipcRenderer.invoke("theme:get"),
		setPreference: (theme: UserSettings["theme"]): Promise<ThemeState> =>
			ipcRenderer.invoke("theme:set-preference", theme),
		onUpdated: (callback: (theme: ThemeState) => void): (() => void) => {
			const listener = (_: Electron.IpcRendererEvent, theme: ThemeState) => {
				callback(theme);
			};

			ipcRenderer.on("theme:updated", listener);

			return () => {
				ipcRenderer.removeListener("theme:updated", listener);
			};
		},
	},
};

if (!process.contextIsolated) {
	throw new Error("contextIsolation must be enabled for the preload API.");
}

try {
	contextBridge.exposeInMainWorld("electron", electronAPI);
	contextBridge.exposeInMainWorld("api", api);
} catch (error) {
	console.error(error);
}
