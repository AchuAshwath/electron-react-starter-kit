import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import electronLogo from "../../assets/electron.svg";
import { Badge } from "../../components/ui/badge";
import { FileUpload } from "../../components/ui/file-upload";
import { useOpenFileDialog } from "../../core/dialog/dialog.hooks";
import { useSystemInfo } from "../../core/system/system.hooks";

export const Route = createFileRoute("/(app)/")({
	component: HomeRoute,
});

function HomeRoute(): React.JSX.Element {
	const systemInfoQuery = useSystemInfo();
	const openFileDialog = useOpenFileDialog();
	const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
	const systemInfo = systemInfoQuery.data;

	async function chooseFile(): Promise<void> {
		const result = await openFileDialog.mutateAsync({
			title: "Choose a file",
			buttonLabel: "Choose",
			filters: [{ name: "All files", extensions: ["*"] }],
		});

		if (!result.canceled) {
			setSelectedFilePaths(result.filePaths);
		}
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
								value={systemInfo ? `v${systemInfo.chromeVersion}` : "Loading"}
								className="border-[#4285f4]/30 bg-[#4285f4]/10 text-[#2458a8] dark:text-[#9fc2ff]"
							/>
							<TechTag
								label="Node"
								value={systemInfo ? `v${systemInfo.nodeVersion}` : "Loading"}
								className="border-[#6cc24a]/30 bg-[#6cc24a]/10 text-[#347a22] dark:text-[#b9f2a8]"
							/>
						</div>
					</div>
				</section>

				<section className="mx-auto w-full max-w-2xl">
					<FileUpload
						selectedPaths={selectedFilePaths}
						onChoose={chooseFile}
						isChoosing={openFileDialog.isPending}
						description="Choose a file with Electron's native dialog."
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
