import { useSystemInfo } from "../core/system/system.hooks";
import { Badge } from "./ui/badge";

function Versions(): React.JSX.Element {
	const systemInfoQuery = useSystemInfo();

	const versions = systemInfoQuery.data;

	return (
		<div className="flex flex-wrap items-center justify-center gap-3">
			<Badge className="border border-transparent bg-[#47848F]/15 px-4 py-1.5 text-sm text-[#1f2a2e]">
				Electron {versions ? `v${versions.electronVersion}` : "Loading..."}
			</Badge>
			<Badge className="border border-transparent bg-[#4285F4]/15 px-4 py-1.5 text-sm text-[#1b2a4d]">
				Chromium {versions ? `v${versions.chromeVersion}` : "Loading..."}
			</Badge>
			<Badge className="border border-transparent bg-[#6CC24A]/15 px-4 py-1.5 text-sm text-[#1f3a1b]">
				Node {versions ? `v${versions.nodeVersion}` : "Loading..."}
			</Badge>
		</div>
	);
}

export default Versions;
