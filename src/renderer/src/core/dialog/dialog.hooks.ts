import { useMutation } from "@tanstack/react-query";
import type {
	OpenFileDialogInput,
	SaveFileDialogInput,
} from "../../../../main/dialog/dialog.types";

export function useOpenFileDialog() {
	return useMutation({
		mutationFn: (input?: OpenFileDialogInput) =>
			window.api.dialog.openFile(input),
	});
}

export function useSaveFileDialog() {
	return useMutation({
		mutationFn: (input?: SaveFileDialogInput) =>
			window.api.dialog.saveFile(input),
	});
}
