import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ThemeState } from "../core/theme/theme.types";
import { ThemeProvider } from "../core/theme/theme-provider";
import { renderWithQueryClient } from "../test/render";
import { ThemeSwitcher } from "./theme-switcher";

const themeState: ThemeState = {
	preference: "system",
	resolvedTheme: "light",
	systemPrefersDark: false,
};

const darkThemeState: ThemeState = {
	preference: "dark",
	resolvedTheme: "dark",
	systemPrefersDark: false,
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

describe("ThemeSwitcher", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
		apiMock.theme.get.mockResolvedValue(themeState);
		apiMock.theme.setPreference.mockResolvedValue(darkThemeState);
		apiMock.theme.onUpdated.mockReturnValue(() => undefined);
	});

	it("toggles from the resolved light theme to dark", async () => {
		const user = userEvent.setup();
		renderWithQueryClient(
			<ThemeProvider>
				<ThemeSwitcher />
			</ThemeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByLabelText("Switch to dark theme")).toBeEnabled();
		});

		await user.click(screen.getByLabelText("Switch to dark theme"));

		await waitFor(() => {
			expect(apiMock.theme.setPreference).toHaveBeenCalledWith("dark");
		});
	});
});
