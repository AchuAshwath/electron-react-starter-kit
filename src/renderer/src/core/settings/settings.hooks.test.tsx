import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../../../main/settings/settings.types";
import { useUpdateSettings } from "./settings.hooks";
import { settingsQueries } from "./settings.queries";

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

describe("settings hooks", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("optimistically merges partial settings updates into the cache", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					gcTime: Number.POSITIVE_INFINITY,
					retry: false,
				},
			},
		});
		const queryKey = settingsQueries.current().queryKey;
		const updatedSettings = {
			...defaultSettings,
			windowBounds: {
				...defaultSettings.windowBounds,
				width: 1280,
			},
		};

		queryClient.setQueryData(queryKey, defaultSettings);
		apiMock.settings.update.mockResolvedValue(updatedSettings);

		function Wrapper({ children }: { children: ReactNode }) {
			return (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			);
		}

		const { result } = renderHook(() => useUpdateSettings(), {
			wrapper: Wrapper,
		});

		result.current.mutate({ windowBounds: { width: 1280 } });

		await waitFor(() => {
			expect(queryClient.getQueryData(queryKey)).toMatchObject({
				windowBounds: {
					width: 1280,
					height: defaultSettings.windowBounds.height,
				},
			});
		});
	});
});
