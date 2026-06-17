import { BrowserWindow, dialog } from "electron";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { dialogIpcChannels } from "./dialog.channels";
import {
	type OpenFileDialogResult,
	openFileDialogInputSchema,
	type SaveFileDialogResult,
	saveFileDialogInputSchema,
} from "./dialog.types";

export function registerDialogIpcHandlers(
	registerIpcHandler: IpcHandlerRegistrar,
): void {
	registerIpcHandler({
		channel: dialogIpcChannels.openFile,
		input: openFileDialogInputSchema,
		handler: async (input, event): Promise<OpenFileDialogResult> => {
			const window = BrowserWindow.fromWebContents(event.sender);
			const properties: Electron.OpenDialogOptions["properties"] = [
				"openFile",
				"dontAddToRecent",
			];

			if (input.multiple) {
				properties.push("multiSelections");
			}

			const options: Electron.OpenDialogOptions = {
				title: input.title,
				buttonLabel: input.buttonLabel,
				filters: input.filters,
				properties,
			};

			return window
				? dialog.showOpenDialog(window, options)
				: dialog.showOpenDialog(options);
		},
	});

	registerIpcHandler({
		channel: dialogIpcChannels.saveFile,
		input: saveFileDialogInputSchema,
		handler: async (input, event): Promise<SaveFileDialogResult> => {
			const window = BrowserWindow.fromWebContents(event.sender);

			const options: Electron.SaveDialogOptions = {
				title: input.title,
				buttonLabel: input.buttonLabel,
				defaultPath: input.defaultPath,
				filters: input.filters,
				properties: [
					"createDirectory",
					"showOverwriteConfirmation",
					"dontAddToRecent",
				],
			};

			return window
				? dialog.showSaveDialog(window, options)
				: dialog.showSaveDialog(options);
		},
	});
}
