import { z } from "zod";

const fileExtensionSchema = z
	.string()
	.min(1)
	.refine(
		(extension) => {
			return (
				extension === "*" ||
				(!extension.startsWith(".") && !extension.includes("*"))
			);
		},
		{
			message:
				"File extensions must omit dots and wildcards. Use '*' only for all files.",
		},
	);

export const fileDialogFilterSchema = z.object({
	name: z.string().min(1),
	extensions: z.array(fileExtensionSchema).min(1),
});

export const openFileDialogInputSchema = z
	.object({
		title: z.string().min(1).optional(),
		buttonLabel: z.string().min(1).optional(),
		multiple: z.boolean().optional(),
		filters: z.array(fileDialogFilterSchema).optional(),
	})
	.default({});

export const saveFileDialogInputSchema = z
	.object({
		title: z.string().min(1).optional(),
		buttonLabel: z.string().min(1).optional(),
		defaultPath: z.string().min(1).optional(),
		filters: z.array(fileDialogFilterSchema).optional(),
	})
	.default({});

export const openFileDialogResultSchema = z.object({
	canceled: z.boolean(),
	filePaths: z.array(z.string()),
});

export const saveFileDialogResultSchema = z.object({
	canceled: z.boolean(),
	filePath: z.string(),
});

export type FileDialogFilter = z.infer<typeof fileDialogFilterSchema>;
export type OpenFileDialogInput = z.infer<typeof openFileDialogInputSchema>;
export type SaveFileDialogInput = z.infer<typeof saveFileDialogInputSchema>;
export type OpenFileDialogResult = z.infer<typeof openFileDialogResultSchema>;
export type SaveFileDialogResult = z.infer<typeof saveFileDialogResultSchema>;
