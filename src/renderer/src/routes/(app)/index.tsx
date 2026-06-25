import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import electronLogo from "../../assets/electron.svg";
import { RetryNotice } from "../../components/retry-notice";
import { Badge } from "../../components/ui/badge";
import { FileUpload } from "../../components/ui/file-upload";
import {
	getOpenFileDialogSuccessMessage,
	getSelectedFilesMessage,
	useDemoSelectedFilePaths,
	useOpenFileDialog,
} from "../../core/dialog/dialog.hooks";
import { useShowNotification } from "../../core/notifications/notification.hooks";
import { useSystemInfo } from "../../core/system/system.hooks";

export const Route = createFileRoute("/(app)/")({
	component: HomeRoute,
});

type OpenFileDialogResult = Awaited<
	ReturnType<Window["api"]["dialog"]["openFile"]>
>;

function HomeRoute(): React.JSX.Element {
	const systemInfoQuery = useSystemInfo();
	const openFileDialog = useOpenFileDialog();
	const showNotification = useShowNotification();
	const {
		addSelectedFilePaths,
		maxFiles,
		selectedFilePaths,
		setSelectedFilePaths,
	} = useDemoSelectedFilePaths();
	const systemInfo = systemInfoQuery.data;

	async function chooseFile(): Promise<void> {
		let result: Awaited<ReturnType<typeof openFileDialog.mutateAsync>>;

		try {
			result = await openFileDialog.mutateAsync({
				title: "Choose files",
				buttonLabel: "Choose",
				multiple: true,
				filters: [{ name: "All files", extensions: ["*"] }],
			});
		} catch {
			toast.error("Could not open file picker");
			return;
		}

		if (result.canceled || result.filePaths.length === 0) {
			return;
		}

		addSelectedFilePaths(result.filePaths);

		const checkedResult = await toast
			.promise(checkSelectedFiles(result), {
				loading: "Checking selected files...",
				success: getOpenFileDialogSuccessMessage,
				error: "Could not check selected files",
			})
			.unwrap();

		showNotification.mutate({
			title: "File check complete",
			body: getOpenFileDialogSuccessMessage(checkedResult),
		});
	}

	function addDroppedFiles(files: File[]): void {
		const filePaths = files
			.map((file) => window.api.files.getPathForFile(file))
			.filter((path) => path.length > 0);

		addSelectedFilePaths(filePaths);
		showFilesSelectedToast(filePaths.length);
	}

	function showFilesSelectedToast(fileCount: number): void {
		if (fileCount === 0) {
			return;
		}

		toast.success(getSelectedFilesMessage(fileCount));
	}

	return (
		<main className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-4xl grid-rows-[1fr_auto_1fr] px-6 py-8">
			<div className="row-start-2 flex flex-col gap-8">
				<section className="flex flex-col items-center gap-6 text-center">
					<div className="flex max-w-3xl flex-col items-center gap-4">
						<div className="flex flex-col items-center gap-3 sm:flex-row">
							<img
								alt="Electron"
								className="h-16 w-16 sm:h-20 sm:w-20"
								src={electronLogo}
							/>
							<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
								Electron React Starter Kit
							</h1>
						</div>
						<p className="max-w-2xl text-base leading-7 text-muted-foreground">
							A secure Vite + React desktop template with typed IPC, persisted
							settings, TanStack Router, and TanStack Query already wired in.
						</p>
						{systemInfoQuery.isError ? (
							<div className="w-full max-w-xl">
								<RetryNotice
									title="Could not load system details"
									description="The renderer could not read runtime information from the main process. Retry the request to refresh the version tags."
									isRetrying={systemInfoQuery.isFetching}
									onRetry={() => {
										void systemInfoQuery.refetch();
									}}
								/>
							</div>
						) : (
							<div className="flex flex-wrap justify-center gap-2">
								<TechTag
									label="Electron"
									value={
										systemInfo ? `v${systemInfo.electronVersion}` : "Loading"
									}
									className="border-[#47848f]/30 bg-[#47848f]/10 text-[#2f6670] dark:text-[#9fe7f2]"
								/>
								<TechTag
									label="Chromium"
									value={
										systemInfo ? `v${systemInfo.chromeVersion}` : "Loading"
									}
									className="border-[#4285f4]/30 bg-[#4285f4]/10 text-[#2458a8] dark:text-[#9fc2ff]"
								/>
								<TechTag
									label="Node"
									value={systemInfo ? `v${systemInfo.nodeVersion}` : "Loading"}
									className="border-[#6cc24a]/30 bg-[#6cc24a]/10 text-[#347a22] dark:text-[#b9f2a8]"
								/>
							</div>
						)}
					</div>
				</section>

				<section className="mx-auto w-full max-w-2xl">
					<FileUpload
						multiple
						maxFiles={maxFiles}
						selectedPaths={selectedFilePaths}
						onSelectedPathsChange={setSelectedFilePaths}
						onFilesSelected={addDroppedFiles}
						onChoose={chooseFile}
						isChoosing={openFileDialog.isPending}
						description={`Drop up to ${maxFiles} files here or choose them with Electron's native dialog.`}
					/>
				</section>

				<p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
					<span>If this helps, star it on</span>
					<a
						href="https://github.com/AchuAshwath/electron-react-starter-kit"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
					>
						<GitHubMark />
						GitHub
					</a>
				</p>
			</div>
		</main>
	);
}

async function checkSelectedFiles(
	result: OpenFileDialogResult,
): Promise<OpenFileDialogResult> {
	await new Promise((resolve) => setTimeout(resolve, 2000));

	return result;
}

function GitHubMark(): React.JSX.Element {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1.01.07 1.54 1.06 1.54 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9v2.81c0 .27.18.58.69.49A10.16 10.16 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
		</svg>
	);
}

function TechTag({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className: string;
}): React.JSX.Element {
	return (
		<Badge variant="outline" className={className}>
			{label} {value}
		</Badge>
	);
}
