import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain } from "electron";
import icon from "../../resources/icon.png?asset";
import { registerDialogIpcHandlers } from "./dialog/dialog.ipc";
import { createIpcHandlerRegistrar } from "./ipc/ipc-handler";
import { registerNotificationIpcHandlers } from "./notifications/notifications.ipc";
import {
	assertTrustedIpcSender,
	getSecureWebPreferences,
	isAllowedDevRendererUrl,
	registerNavigationHandlers,
	registerPermissionRequestHandler,
} from "./security";
import {
	broadcastSettings,
	registerSettingsIpcHandlers,
} from "./settings/settings.ipc";
import { getSettings, updateSettings } from "./settings/settings.store";
import { registerThemeIpcHandlers } from "./theme/theme.ipc";
import { syncNativeThemeFromSettings } from "./theme/theme.service";

function createWindow(): void {
	const settings = getSettings();
	const initialThemeState = syncNativeThemeFromSettings();
	const initialThemeSearch = new URLSearchParams({
		themePreference: initialThemeState.preference,
		resolvedTheme: initialThemeState.resolvedTheme,
		systemPrefersDark: String(initialThemeState.systemPrefersDark),
	});

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: settings.windowBounds.width,
		height: settings.windowBounds.height,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: getSecureWebPreferences(
			join(__dirname, "../preload/index.js"),
		),
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	registerNavigationHandlers(mainWindow);
	registerWindowBoundsPersistence(mainWindow);

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env.ELECTRON_RENDERER_URL) {
		const rendererUrl = new URL(process.env.ELECTRON_RENDERER_URL);

		if (!isAllowedDevRendererUrl(rendererUrl)) {
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

function registerWindowBoundsPersistence(window: BrowserWindow): void {
	let saveWindowBoundsTimer: ReturnType<typeof setTimeout> | undefined;

	window.on("resize", () => {
		if (saveWindowBoundsTimer) {
			clearTimeout(saveWindowBoundsTimer);
		}

		saveWindowBoundsTimer = setTimeout(() => {
			const [width, height] = window.getSize();
			const settings = updateSettings({
				windowBounds: {
					width,
					height,
				},
			});

			broadcastSettings(settings);
		}, 250);
	});
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

	registerPermissionRequestHandler();
	const registerIpcHandler = createIpcHandlerRegistrar({
		ipcMain,
		isDev: is.dev,
		assertTrustedSender: assertTrustedIpcSender,
	});

	// IPC handlers — two-way request/response (used with ipcRenderer.invoke + TanStack Query)
	registerIpcHandler({
		channel: "get-app-version",
		handler: () => {
			return app.getVersion();
		},
	});

	registerIpcHandler({
		channel: "get-system-info",
		handler: () => {
			return {
				platform: process.platform,
				arch: process.arch,
				nodeVersion: process.versions.node,
				chromeVersion: process.versions.chrome,
				electronVersion: process.versions.electron,
			};
		},
	});

	registerSettingsIpcHandlers(registerIpcHandler);
	registerThemeIpcHandlers(registerIpcHandler);
	registerDialogIpcHandlers(registerIpcHandler);
	registerNotificationIpcHandlers(registerIpcHandler);

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
