import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	OpenFileDialogInput,
	OpenFileDialogResult,
	SaveFileDialogInput,
} from "../../../../main/dialog/dialog.types";

const maxDemoFiles = 5;
const demoSelectedFilePathsQueryKey = [
	"dialog",
	"demo-selected-file-paths",
] as const;

export function useOpenFileDialog() {
	return useMutation({
		mutationFn: (input?: OpenFileDialogInput) =>
			window.api.dialog.openFile(input),
	});
}

export function useDemoSelectedFilePaths() {
	const queryClient = useQueryClient();
	const selectedFilePathsQuery = useQuery({
		queryKey: demoSelectedFilePathsQueryKey,
		queryFn: () => [] as string[],
		initialData: [],
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});

	function setSelectedFilePaths(nextPaths: string[]): void {
		queryClient.setQueryData(
			demoSelectedFilePathsQueryKey,
			nextPaths.slice(0, maxDemoFiles),
		);
	}

	function addSelectedFilePaths(nextPaths: string[]): void {
		queryClient.setQueryData<string[]>(
			demoSelectedFilePathsQueryKey,
			(currentPaths = []) => mergeFilePaths(currentPaths, nextPaths),
		);
	}

	return {
		maxFiles: maxDemoFiles,
		selectedFilePaths: selectedFilePathsQuery.data ?? [],
		setSelectedFilePaths,
		addSelectedFilePaths,
	};
}

function mergeFilePaths(currentPaths: string[], nextPaths: string[]): string[] {
	return Array.from(new Set([...currentPaths, ...nextPaths])).slice(
		0,
		maxDemoFiles,
	);
}

export function getSelectedFilesMessage(fileCount: number): string {
	return `${fileCount} file${fileCount === 1 ? "" : "s"} added`;
}

export function getOpenFileDialogSuccessMessage(
	result: OpenFileDialogResult,
): string {
	if (result.canceled || result.filePaths.length === 0) {
		return "No files selected";
	}

	return getSelectedFilesMessage(result.filePaths.length);
}

export function useSaveFileDialog() {
	return useMutation({
		mutationFn: (input?: SaveFileDialogInput) =>
			window.api.dialog.saveFile(input),
	});
}
