import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import {
	type DragEvent,
	type InputHTMLAttributes,
	useRef,
	useState,
} from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type FileUploadProps = {
	value?: File[];
	defaultValue?: File[];
	onValueChange?: (files: File[]) => void;
	maxFiles?: number;
	maxSize?: number;
	description?: string;
	className?: string;
} & Pick<
	InputHTMLAttributes<HTMLInputElement>,
	"accept" | "disabled" | "multiple" | "name"
>;

export function FileUpload({
	value,
	defaultValue = [],
	onValueChange,
	maxFiles = 1,
	maxSize,
	description = "Drop a file here or choose one from your computer.",
	className,
	accept,
	disabled,
	multiple,
	name,
}: FileUploadProps): React.JSX.Element {
	const inputRef = useRef<HTMLInputElement>(null);
	const [internalFiles, setInternalFiles] = useState<File[]>(defaultValue);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string>("");
	const files = value ?? internalFiles;
	const canAddFiles = !disabled && files.length < maxFiles;

	function updateFiles(nextFiles: File[]): void {
		setInternalFiles(nextFiles);
		onValueChange?.(nextFiles);
	}

	function resetInput(): void {
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}

	function addFiles(selectedFiles: FileList | File[]): void {
		const incomingFiles = Array.from(selectedFiles);
		const allowedFiles = multiple ? incomingFiles : incomingFiles.slice(0, 1);
		const oversizedFile = maxSize
			? allowedFiles.find((file) => file.size > maxSize)
			: undefined;

		if (oversizedFile && maxSize) {
			setError(
				`${oversizedFile.name} is larger than ${formatFileSize(maxSize)}.`,
			);
			resetInput();
			return;
		}

		const nextFiles = multiple
			? [...files, ...allowedFiles].slice(0, maxFiles)
			: allowedFiles;

		setError("");
		updateFiles(nextFiles);
	}

	function removeFile(fileIndex: number): void {
		setError("");
		updateFiles(files.filter((_, index) => index !== fileIndex));
		resetInput();
	}

	function handleDragOver(event: DragEvent<HTMLFieldSetElement>): void {
		event.preventDefault();
		if (canAddFiles) {
			setIsDragging(true);
		}
	}

	function handleDrop(event: DragEvent<HTMLFieldSetElement>): void {
		event.preventDefault();
		setIsDragging(false);
		if (canAddFiles) {
			addFiles(event.dataTransfer.files);
		}
	}

	return (
		<fieldset
			aria-label="File upload"
			disabled={disabled}
			className={cn(
				"flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors",
				isDragging && "border-primary bg-primary/5",
				disabled && "opacity-60",
				className,
			)}
			onDragLeave={() => setIsDragging(false)}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
					<UploadIcon className="size-4 text-muted-foreground" />
				</div>
				<div className="min-w-0 flex-1 text-left">
					<p className="truncate text-sm font-medium">
						{files.length > 0
							? `${files.length} file${files.length > 1 ? "s" : ""} selected`
							: "Upload a file"}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{error || description}
					</p>
				</div>
				<input
					ref={inputRef}
					type="file"
					name={name}
					accept={accept}
					disabled={disabled || !canAddFiles}
					multiple={multiple}
					className="hidden"
					onChange={(event) => {
						if (event.currentTarget.files) {
							addFiles(event.currentTarget.files);
						}
					}}
				/>
				<Button
					type="button"
					variant="outline"
					disabled={!canAddFiles}
					onClick={() => inputRef.current?.click()}
				>
					Choose
				</Button>
			</div>

			{files.length > 0 ? (
				<div className="flex flex-col gap-2">
					{files.map((file, index) => (
						<div
							key={`${file.name}-${file.lastModified}`}
							className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
						>
							<FileIcon className="size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(file.size)}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Remove ${file.name}`}
								disabled={disabled}
								onClick={() => removeFile(index)}
							>
								<XIcon aria-hidden="true" />
							</Button>
						</div>
					))}
				</div>
			) : null}
		</fieldset>
	);
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB"];
	const unitIndex = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const size = bytes / 1024 ** unitIndex;

	return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
