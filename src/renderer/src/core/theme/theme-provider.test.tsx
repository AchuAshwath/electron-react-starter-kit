import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../test/render";
import type { ThemeState } from "./theme.types";
import { ThemeProvider } from "./theme-provider";

const lightTheme: ThemeState = {
	preference: "light",
	resolvedTheme: "light",
	systemPrefersDark: false,
};

const darkTheme: ThemeState = {
	preference: "system",
	resolvedTheme: "dark",
	systemPrefersDark: true,
};

const apiMock = {
	getAppVersion: vi.fn<Window["api"]["getAppVersion"]>(),
	getSystemInfo: vi.fn<Window["api"]["getSystemInfo"]>(),
	settings: {
		get: vi.fn<Window["api"]["settings"]["get"]>(),
		update: vi.fn<Window["api"]["settings"]["update"]>(),
		reset: vi.fn<Window["api"]["settings"]["reset"]>(),
	},
	theme: {
		get: vi.fn<Window["api"]["theme"]["get"]>(),
		setPreference: vi.fn<Window["api"]["theme"]["setPreference"]>(),
		onUpdated: vi.fn<Window["api"]["theme"]["onUpdated"]>(),
	},
};

describe("ThemeProvider", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		document.documentElement.className = "";
		document.documentElement.removeAttribute("style");
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
		apiMock.theme.onUpdated.mockReturnValue(() => undefined);
	});

	it("applies the resolved theme from the query result", async () => {
		apiMock.theme.get.mockResolvedValue(darkTheme);

		renderWithQueryClient(
			<ThemeProvider>
				<div>App</div>
			</ThemeProvider>,
		);

		expect(await screen.findByText("App")).toBeInTheDocument();
		await waitFor(() => {
			expect(document.documentElement).toHaveClass("dark");
		});
	});

	it("updates the root class when main broadcasts a theme change", async () => {
		let onThemeUpdated: ((theme: ThemeState) => void) | undefined;

		apiMock.theme.get.mockResolvedValue(lightTheme);
		apiMock.theme.onUpdated.mockImplementation((callback) => {
			onThemeUpdated = callback;

			return () => undefined;
		});

		renderWithQueryClient(
			<ThemeProvider>
				<div>App</div>
			</ThemeProvider>,
		);

		await waitFor(() => {
			expect(document.documentElement).toHaveClass("light");
		});

		act(() => {
			onThemeUpdated?.(darkTheme);
		});

		await waitFor(() => {
			expect(document.documentElement).toHaveClass("dark");
		});
	});
});
