import type { BrowserWindow } from "electron";
import { windowLogger } from "../logging/logger";
import type { WindowBounds } from "../settings/settings.types";

export type DisplayWorkArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type RestoredWindowBounds = {
	x?: number;
	y?: number;
	width: number;
	height: number;
	isMaximized: boolean;
};

type RestoreWindowBoundsOptions = {
	defaultBounds: Pick<WindowBounds, "height" | "width">;
	displays: DisplayWorkArea[];
	fallbackDisplay: DisplayWorkArea;
	savedBounds: WindowBounds;
};

type SaveWindowBounds = (bounds: WindowBounds) => void;

const minimumVisiblePixels = 80;
const saveWindowBoundsDelayMs = 250;

export function restoreWindowBounds({
	defaultBounds,
	displays,
	fallbackDisplay,
	savedBounds,
}: RestoreWindowBoundsOptions): RestoredWindowBounds {
	const savedState = {
		x: savedBounds.x,
		y: savedBounds.y,
		width: savedBounds.width,
		height: savedBounds.height,
		isMaximized: savedBounds.isMaximized ?? false,
	};

	if (isWindowVisibleOnAnyDisplay(savedState, displays)) {
		windowLogger.info("Window state restored", {
			height: savedState.height,
			isMaximized: savedState.isMaximized,
			width: savedState.width,
		});

		return savedState;
	}

	const fallbackBounds =
		savedBounds.x === undefined || savedBounds.y === undefined
			? savedBounds
			: defaultBounds;

	const centeredBounds = centerWindowOnDisplay(fallbackBounds, fallbackDisplay);

	windowLogger.warn("Stored window state was invalid, using centered bounds", {
		height: centeredBounds.height,
		reason:
			savedBounds.x === undefined || savedBounds.y === undefined
				? "missing-position"
				: "off-screen",
		width: centeredBounds.width,
	});

	return centeredBounds;
}

export function applyPreferredWindowBounds(
	window: BrowserWindow,
	bounds: Pick<WindowBounds, "height" | "width">,
): void {
	if (window.isMaximized()) {
		window.unmaximize();
	}

	window.setSize(bounds.width, bounds.height);
}

export function registerWindowStatePersistence(
	window: BrowserWindow,
	saveWindowBounds: SaveWindowBounds,
): () => void {
	let saveWindowBoundsTimer: ReturnType<typeof setTimeout> | undefined;

	const scheduleSave = (): void => {
		if (window.isMinimized()) {
			return;
		}

		if (saveWindowBoundsTimer) {
			clearTimeout(saveWindowBoundsTimer);
		}

		saveWindowBoundsTimer = setTimeout(() => {
			const bounds = getPersistableWindowBounds(window);

			saveWindowBounds(bounds);
			windowLogger.info("Window state saved", {
				height: bounds.height,
				isMaximized: bounds.isMaximized,
				width: bounds.width,
			});
		}, saveWindowBoundsDelayMs);
	};

	window.on("move", scheduleSave);
	window.on("resize", scheduleSave);
	window.on("maximize", scheduleSave);
	window.on("unmaximize", scheduleSave);

	return () => {
		if (saveWindowBoundsTimer) {
			clearTimeout(saveWindowBoundsTimer);
		}

		window.off("move", scheduleSave);
		window.off("resize", scheduleSave);
		window.off("maximize", scheduleSave);
		window.off("unmaximize", scheduleSave);
	};
}

function getPersistableWindowBounds(window: BrowserWindow): WindowBounds {
	const bounds = window.getNormalBounds();

	return {
		x: bounds.x,
		y: bounds.y,
		width: bounds.width,
		height: bounds.height,
		isMaximized: window.isMaximized(),
	};
}

function isWindowVisibleOnAnyDisplay(
	bounds: RestoredWindowBounds,
	displays: DisplayWorkArea[],
): boolean {
	if (bounds.x === undefined || bounds.y === undefined) {
		return false;
	}

	const { x, y } = bounds;

	return displays.some((display) => {
		const visibleWidth = getOverlapLength(
			x,
			x + bounds.width,
			display.x,
			display.x + display.width,
		);
		const visibleHeight = getOverlapLength(
			y,
			y + bounds.height,
			display.y,
			display.y + display.height,
		);

		return (
			visibleWidth >= minimumVisiblePixels &&
			visibleHeight >= minimumVisiblePixels
		);
	});
}

function getOverlapLength(
	startA: number,
	endA: number,
	startB: number,
	endB: number,
): number {
	return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

function centerWindowOnDisplay(
	defaultBounds: Pick<WindowBounds, "height" | "width">,
	display: DisplayWorkArea,
): RestoredWindowBounds {
	return {
		x: Math.round(display.x + (display.width - defaultBounds.width) / 2),
		y: Math.round(display.y + (display.height - defaultBounds.height) / 2),
		width: defaultBounds.width,
		height: defaultBounds.height,
		isMaximized: false,
	};
}
