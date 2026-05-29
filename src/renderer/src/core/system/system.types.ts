/**
 * System info returned by the main process via IPC.
 *
 * This type mirrors the shape of the ipcMain.handle("get-system-info")
 * response and the preload bridge's window.api.getSystemInfo() return type.
 */
export interface SystemInfo {
	platform: string;
	arch: string;
	nodeVersion: string;
	chromeVersion: string;
	electronVersion: string;
}
