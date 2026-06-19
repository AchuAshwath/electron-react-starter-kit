import type { BrowserWindow } from "electron";
import { describe, expect, it, vi } from "vitest";
import type { WindowBounds } from "../settings/settings.types";
import {
	applyPreferredWindowBounds,
	type DisplayWorkArea,
	registerWindowStatePersistence,
	restoreWindowBounds,
} from "./window-state";

const defaultBounds = {
	width: 900,
	height: 670,
};

const primaryDisplay: DisplayWorkArea = {
	x: 0,
	y: 0,
	width: 1920,
	height: 1040,
};

describe("restoreWindowBounds", () => {
	it("restores saved bounds when the window is visible on a current display", () => {
		const savedBounds: WindowBounds = {
			x: 200,
			y: 120,
			width: 1100,
			height: 720,
			isMaximized: true,
		};

		expect(
			restoreWindowBounds({
				defaultBounds,
				displays: [primaryDisplay],
				savedBounds,
			}),
		).toEqual({
			...savedBounds,
			isMaximized: true,
		});
	});

	it("centers saved size when saved position is missing", () => {
		expect(
			restoreWindowBounds({
				defaultBounds,
				displays: [primaryDisplay],
				savedBounds: {
					width: 1100,
					height: 720,
				},
			}),
		).toEqual({
			x: 410,
			y: 160,
			width: 1100,
			height: 720,
			isMaximized: false,
		});
	});

	it("centers default bounds when saved bounds are off-screen", () => {
		expect(
			restoreWindowBounds({
				defaultBounds,
				displays: [primaryDisplay],
				savedBounds: {
					x: 2600,
					y: 100,
					width: 1100,
					height: 720,
					isMaximized: true,
				},
			}),
		).toEqual({
			x: 510,
			y: 185,
			width: 900,
			height: 670,
			isMaximized: false,
		});
	});

	it("restores bounds that are still meaningfully visible", () => {
		const savedBounds: WindowBounds = {
			x: -40,
			y: 40,
			width: 900,
			height: 670,
		};

		expect(
			restoreWindowBounds({
				defaultBounds,
				displays: [primaryDisplay],
				savedBounds,
			}),
		).toEqual({
			...savedBounds,
			isMaximized: false,
		});
	});

	it("uses a safe fallback display when display data is unavailable", () => {
		expect(
			restoreWindowBounds({
				defaultBounds,
				displays: [],
				savedBounds: {
					x: 4000,
					y: 4000,
					width: 1100,
					height: 720,
				},
			}),
		).toEqual({
			x: 190,
			y: 25,
			width: 900,
			height: 670,
			isMaximized: false,
		});
	});
});

describe("applyPreferredWindowBounds", () => {
	it("applies the preferred size to the window", () => {
		const window = createWindowMock();

		applyPreferredWindowBounds(window as unknown as BrowserWindow, {
			width: 1280,
			height: 800,
		});

		expect(window.setSize).toHaveBeenCalledWith(1280, 800);
		expect(window.unmaximize).not.toHaveBeenCalled();
	});

	it("unmaximizes before applying a preferred size", () => {
		const window = createWindowMock({
			isMaximized: () => true,
		});

		applyPreferredWindowBounds(window as unknown as BrowserWindow, {
			width: 1100,
			height: 720,
		});

		expect(window.unmaximize).toHaveBeenCalledTimes(1);
		expect(window.setSize).toHaveBeenCalledWith(1100, 720);
	});
});

describe("registerWindowStatePersistence", () => {
	it("saves normal bounds and maximized state after window changes settle", () => {
		vi.useFakeTimers();

		const saveWindowBounds = vi.fn();
		const window = createWindowMock({
			getNormalBounds: () => ({ x: 120, y: 80, width: 1100, height: 720 }),
			isMaximized: () => true,
		});

		registerWindowStatePersistence(
			window as unknown as BrowserWindow,
			saveWindowBounds,
		);
		window.emit("resize");

		vi.advanceTimersByTime(250);

		expect(saveWindowBounds).toHaveBeenCalledWith({
			x: 120,
			y: 80,
			width: 1100,
			height: 720,
			isMaximized: true,
		});

		vi.useRealTimers();
	});

	it("does not save minimized window bounds", () => {
		vi.useFakeTimers();

		const saveWindowBounds = vi.fn();
		const window = createWindowMock({
			isMinimized: () => true,
		});

		registerWindowStatePersistence(
			window as unknown as BrowserWindow,
			saveWindowBounds,
		);
		window.emit("resize");

		vi.advanceTimersByTime(250);

		expect(saveWindowBounds).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});

function createWindowMock(overrides: Partial<WindowMock> = {}): WindowMock {
	const handlers = new Map<string, Array<() => void>>();

	return {
		emit: (eventName) => {
			for (const handler of handlers.get(eventName) ?? []) {
				handler();
			}
		},
		getNormalBounds: () => ({ x: 0, y: 0, width: 900, height: 670 }),
		isMaximized: () => false,
		isMinimized: () => false,
		off: (eventName, handler) => {
			handlers.set(
				eventName,
				(handlers.get(eventName) ?? []).filter(
					(savedHandler) => savedHandler !== handler,
				),
			);
			return undefined;
		},
		on: (eventName, handler) => {
			handlers.set(eventName, [...(handlers.get(eventName) ?? []), handler]);
			return undefined;
		},
		setSize: vi.fn(),
		unmaximize: vi.fn(),
		...overrides,
	} as WindowMock;
}

type WindowMock = {
	emit: (eventName: string) => void;
	getNormalBounds: () => {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	isMaximized: () => boolean;
	isMinimized: () => boolean;
	off: (eventName: string, handler: () => void) => undefined;
	on: (eventName: string, handler: () => void) => undefined;
	setSize: ReturnType<typeof vi.fn>;
	unmaximize: ReturnType<typeof vi.fn>;
};
