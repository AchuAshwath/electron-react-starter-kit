import { createFileRoute } from "@tanstack/react-router";
import { InfoIcon } from "lucide-react";
import electronLogo from "../assets/electron.svg";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import Versions from "../components/Versions";

export const Route = createFileRoute("/")({
	component: TemplateLandingRoute,
});

function TemplateLandingRoute(): React.JSX.Element {
	const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

	return (
		<div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-10 text-center">
			<Card className="w-full">
				<CardHeader className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-center md:text-left">
					<img alt="logo" className="h-24 w-24" src={electronLogo} />
					<div className="flex max-w-xl flex-col gap-2">
						<div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
							Powered by electron-vite
						</div>
						<CardTitle className="text-3xl leading-tight">
							Build an Electron app with{" "}
							<span className="font-semibold text-[#47848F]">Electron</span> and{" "}
							<span className="font-semibold text-[#3178C6]">TypeScript</span>
						</CardTitle>
					</div>
				</CardHeader>

				<CardContent className="flex flex-col items-center gap-6">
					<div className="my-2 flex flex-wrap items-center justify-center gap-4">
						<a
							href="https://electron-vite.org/"
							target="_blank"
							rel="noreferrer"
						>
							<Button variant="secondary">Documentation</Button>
						</a>
						<Button type="button" onClick={ipcHandle}>
							Send IPC
						</Button>
					</div>

					<Versions />

					<Alert className="mx-auto inline-flex w-fit max-w-sm items-center gap-2 px-3 py-2">
						<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
						<AlertDescription className="text-xs">
							Press{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
								F12
							</code>{" "}
							to open the devTools.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	);
}
