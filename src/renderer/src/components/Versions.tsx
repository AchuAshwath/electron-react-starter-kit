import { useState } from "react";
import { Badge } from "./ui/badge";

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Badge className="border border-transparent bg-[#47848F]/15 px-4 py-1.5 text-sm text-[#1f2a2e]">
        Electron v{versions.electron}
      </Badge>
      <Badge className="border border-transparent bg-[#4285F4]/15 px-4 py-1.5 text-sm text-[#1b2a4d]">
        Chromium v{versions.chrome}
      </Badge>
      <Badge className="border border-transparent bg-[#6CC24A]/15 px-4 py-1.5 text-sm text-[#1f3a1b]">
        Node v{versions.node}
      </Badge>
    </div>
  );
}

export default Versions;
