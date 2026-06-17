import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "../../test/render";
import { useOpenFileDialog, useSaveFileDialog } from "./dialog.hooks";

const apiMock = {
	getAppVersion: vi.fn<Window["api"]["getAppVersion"]>(),
	getSystemInfo: vi.fn<Window["api"]["getSystemInfo"]>(),
	settings: {
		get: vi.fn<Window["api"]["settings"]["get"]>(),
		update: vi.fn<Window["api"]["settings"]["update"]>(),
		reset: vi.fn<Window["api"]["settings"]["reset"]>(),
		onUpdated: vi.fn<Window["api"]["settings"]["onUpdated"]>(),
	},
	theme: {
		get: vi.fn<Window["api"]["theme"]["get"]>(),
		setPreference: vi.fn<Window["api"]["theme"]["setPreference"]>(),
		onUpdated: vi.fn<Window["api"]["theme"]["onUpdated"]>(),
	},
	dialog: {
		openFile: vi.fn<Window["api"]["dialog"]["openFile"]>(),
		saveFile: vi.fn<Window["api"]["dialog"]["saveFile"]>(),
	},
};

function wrapper({ children }: { children: ReactNode }) {
	const queryClient = createTestQueryClient();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("dialog hooks", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("opens a file dialog through the preload bridge", async () => {
		const result = { canceled: false, filePaths: ["C:\\tmp\\notes.txt"] };
		apiMock.dialog.openFile.mockResolvedValue(result);
		const { result: hook } = renderHook(() => useOpenFileDialog(), {
			wrapper,
		});

		hook.current.mutate({
			title: "Choose a file",
			filters: [{ name: "Text", extensions: ["txt"] }],
		});

		await waitFor(() => {
			expect(hook.current.data).toEqual(result);
		});
		expect(apiMock.dialog.openFile).toHaveBeenCalledWith({
			title: "Choose a file",
			filters: [{ name: "Text", extensions: ["txt"] }],
		});
	});

	it("opens a save dialog through the preload bridge", async () => {
		const result = { canceled: false, filePath: "C:\\tmp\\notes.txt" };
		apiMock.dialog.saveFile.mockResolvedValue(result);
		const { result: hook } = renderHook(() => useSaveFileDialog(), {
			wrapper,
		});

		hook.current.mutate({ defaultPath: "notes.txt" });

		await waitFor(() => {
			expect(hook.current.data).toEqual(result);
		});
		expect(apiMock.dialog.saveFile).toHaveBeenCalledWith({
			defaultPath: "notes.txt",
		});
	});
});
