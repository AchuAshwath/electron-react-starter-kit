import type { BrowserWindow, WebPreferences } from "electron";
import { session, shell } from "electron";

const loopbackHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);
const allowedExternalProtocols = new Set(["https:", "mailto:"]);

export function getSecureWebPreferences(preloadPath: string): WebPreferences {
	return {
		preload: preloadPath,
		contextIsolation: true,
		nodeIntegration: false,
		nodeIntegrationInWorker: false,
		nodeIntegrationInSubFrames: false,
		sandbox: true,
		webSecurity: true,
		allowRunningInsecureContent: false,
		experimentalFeatures: false,
	};
}

export function isAllowedDevRendererUrl(url: URL): boolean {
	return url.protocol === "http:" && loopbackHostnames.has(url.hostname);
}

function isAllowedExternalUrl(url: string): boolean {
	try {
		return allowedExternalProtocols.has(new URL(url).protocol);
	} catch {
		return false;
	}
}

export function registerNavigationHandlers(window: BrowserWindow): void {
	window.webContents.on("will-navigate", (event) => {
		event.preventDefault();
	});

	window.webContents.setWindowOpenHandler((details) => {
		if (isAllowedExternalUrl(details.url)) {
			shell.openExternal(details.url);
		}

		return { action: "deny" };
	});
}

export function registerPermissionRequestHandler(): void {
	session.defaultSession.setPermissionRequestHandler(
		(_webContents, _permission, callback) => {
			callback(false);
		},
	);
}
