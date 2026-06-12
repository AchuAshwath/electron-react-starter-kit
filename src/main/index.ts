import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import icon from "../../resources/icon.png?asset";
import { registerSettingsIpcHandlers } from "./settings/settings.ipc";
import { registerThemeIpcHandlers } from "./theme/theme.ipc";
import { syncNativeThemeFromSettings } from "./theme/theme.service";

function createWindow(): void {
	const initialThemeState = syncNativeThemeFromSettings();
	const initialThemeSearch = new URLSearchParams({
		themePreference: initialThemeState.preference,
		resolvedTheme: initialThemeState.resolvedTheme,
		systemPrefersDark: String(initialThemeState.systemPrefersDark),
	});

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			contextIsolation: true,
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			nodeIntegrationInSubFrames: false,
			sandbox: true,
		},
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env.ELECTRON_RENDERER_URL) {
		const rendererUrl = new URL(process.env.ELECTRON_RENDERER_URL);

		if (
			rendererUrl.protocol !== "http:" ||
			!["localhost", "127.0.0.1", "[::1]"].includes(rendererUrl.hostname)
		) {
			throw new Error("Dev renderer URL must use HTTP on a loopback host.");
		}

		for (const [key, value] of initialThemeSearch) {
			rendererUrl.searchParams.set(key, value);
		}

		mainWindow.loadURL(rendererUrl.toString());
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"), {
			query: Object.fromEntries(initialThemeSearch),
		});
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	// IPC handlers — two-way request/response (used with ipcRenderer.invoke + TanStack Query)
	ipcMain.handle("get-app-version", () => {
		return app.getVersion();
	});

	ipcMain.handle("get-system-info", () => {
		return {
			platform: process.platform,
			arch: process.arch,
			nodeVersion: process.versions.node,
			chromeVersion: process.versions.chrome,
			electronVersion: process.versions.electron,
		};
	});

	registerSettingsIpcHandlers();
	registerThemeIpcHandlers();

	createWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
