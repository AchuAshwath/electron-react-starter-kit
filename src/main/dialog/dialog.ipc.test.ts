import { describe, expect, it, vi } from "vitest";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { dialogIpcChannels } from "./dialog.channels";

const { dialogMock, fromWebContentsMock, parentWindow } = vi.hoisted(() => ({
	dialogMock: {
		showOpenDialog: vi.fn(),
		showSaveDialog: vi.fn(),
	},
	fromWebContentsMock: vi.fn(),
	parentWindow: {},
}));

vi.mock("electron", () => {
	return {
		BrowserWindow: {
			fromWebContents: fromWebContentsMock,
		},
		dialog: dialogMock,
	};
});

const { registerDialogIpcHandlers } = await import("./dialog.ipc");

function createTestRegistrar() {
	const handlers = new Map<string, Parameters<IpcHandlerRegistrar>[0]>();
	const registerIpcHandler: IpcHandlerRegistrar = vi.fn((options) => {
		handlers.set(options.channel, options);
	});

	registerDialogIpcHandlers(registerIpcHandler);

	return {
		handlers,
		registerIpcHandler,
	};
}

describe("registerDialogIpcHandlers", () => {
	it("registers open and save dialog handlers", () => {
		const { registerIpcHandler } = createTestRegistrar();

		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({ channel: dialogIpcChannels.openFile }),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({ channel: dialogIpcChannels.saveFile }),
		);
	});

	it("opens a native file dialog with safe defaults", async () => {
		const { handlers } = createTestRegistrar();
		const event = { sender: {} };
		const result = { canceled: false, filePaths: ["C:\\tmp\\notes.txt"] };
		fromWebContentsMock.mockReturnValue(parentWindow);
		dialogMock.showOpenDialog.mockResolvedValue(result);

		await expect(
			handlers.get(dialogIpcChannels.openFile)?.handler(
				{
					title: "Choose a file",
					multiple: true,
					filters: [{ name: "Text", extensions: ["txt", "md"] }],
				},
				event as never,
			),
		).resolves.toEqual(result);

		expect(fromWebContentsMock).toHaveBeenCalledWith(event.sender);
		expect(dialogMock.showOpenDialog).toHaveBeenCalledWith(parentWindow, {
			title: "Choose a file",
			buttonLabel: undefined,
			filters: [{ name: "Text", extensions: ["txt", "md"] }],
			properties: ["openFile", "dontAddToRecent", "multiSelections"],
		});
	});

	it("opens a native save dialog", async () => {
		const { handlers } = createTestRegistrar();
		const event = { sender: {} };
		const result = { canceled: false, filePath: "C:\\tmp\\report.txt" };
		fromWebContentsMock.mockReturnValue(parentWindow);
		dialogMock.showSaveDialog.mockResolvedValue(result);

		await expect(
			handlers.get(dialogIpcChannels.saveFile)?.handler(
				{
					title: "Save report",
					defaultPath: "report.txt",
					filters: [{ name: "Text", extensions: ["txt"] }],
				},
				event as never,
			),
		).resolves.toEqual(result);

		expect(dialogMock.showSaveDialog).toHaveBeenCalledWith(parentWindow, {
			title: "Save report",
			buttonLabel: undefined,
			defaultPath: "report.txt",
			filters: [{ name: "Text", extensions: ["txt"] }],
			properties: [
				"createDirectory",
				"showOverwriteConfirmation",
				"dontAddToRecent",
			],
		});
	});
});
