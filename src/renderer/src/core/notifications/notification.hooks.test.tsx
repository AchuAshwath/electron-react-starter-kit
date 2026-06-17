import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "../../test/render";
import {
	useNotificationPermission,
	useRequestNotificationPermission,
	useShowNotification,
} from "./notification.hooks";

const apiMock = {
	notifications: {
		getPermission: vi.fn<Window["api"]["notifications"]["getPermission"]>(),
		requestPermission:
			vi.fn<Window["api"]["notifications"]["requestPermission"]>(),
		setDesktopEnabled:
			vi.fn<Window["api"]["notifications"]["setDesktopEnabled"]>(),
		show: vi.fn<Window["api"]["notifications"]["show"]>(),
	},
};

function createWrapper() {
	const queryClient = createTestQueryClient();

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

describe("notification hooks", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("fetches notification permission state through the preload bridge", async () => {
		const permission = {
			desktopEnabled: false,
			status: "denied" as const,
			supported: true,
		};
		apiMock.notifications.getPermission.mockResolvedValue(permission);
		const { result } = renderHook(() => useNotificationPermission(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.data).toEqual(permission);
		});
		expect(apiMock.notifications.getPermission).toHaveBeenCalledTimes(1);
	});

	it("requests notification permission and caches the returned state", async () => {
		const permission = {
			desktopEnabled: true,
			status: "granted" as const,
			supported: true,
		};
		apiMock.notifications.requestPermission.mockResolvedValue(permission);
		const wrapper = createWrapper();
		const { result: permissionQuery } = renderHook(
			() => useNotificationPermission(),
			{
				wrapper,
			},
		);
		const { result: requestPermission } = renderHook(
			() => useRequestNotificationPermission(),
			{
				wrapper,
			},
		);

		requestPermission.current.mutate();

		await waitFor(() => {
			expect(requestPermission.current.data).toEqual(permission);
		});
		await waitFor(() => {
			expect(permissionQuery.current.data).toEqual(permission);
		});
	});

	it("shows a notification through the preload bridge", async () => {
		apiMock.notifications.show.mockResolvedValue({ shown: true });
		const { result } = renderHook(() => useShowNotification(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			body: "Your file export is ready.",
			title: "Export complete",
		});

		await waitFor(() => {
			expect(result.current.data).toEqual({ shown: true });
		});
		expect(apiMock.notifications.show).toHaveBeenCalledWith({
			body: "Your file export is ready.",
			title: "Export complete",
		});
	});
});
