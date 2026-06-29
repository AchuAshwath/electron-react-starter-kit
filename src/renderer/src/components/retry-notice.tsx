import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "./ui/button";

type RetryNoticeProps = {
	title: string;
	description: string;
	onRetry: () => void;
	isRetrying?: boolean;
	retryLabel?: string;
};

function RetryNotice({
	description,
	isRetrying = false,
	onRetry,
	retryLabel = "Retry",
	title,
}: RetryNoticeProps): React.JSX.Element {
	return (
		<section className="rounded-xl border border-border bg-background p-4 shadow-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<AlertTriangleIcon aria-hidden="true" className="size-4" />
					</div>
					<div className="min-w-0">
						<h2 className="text-sm font-medium">{title}</h2>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">
							{description}
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isRetrying}
					onClick={onRetry}
				>
					<RotateCcwIcon aria-hidden="true" />
					{isRetrying ? "Retrying..." : retryLabel}
				</Button>
			</div>
		</section>
	);
}

export { RetryNotice };
