import { z } from "zod";

export const notificationPermissionStatusSchema = z.enum([
	"granted",
	"denied",
	"unsupported",
]);

export const desktopNotificationsEnabledSchema = z.boolean();

export const showNotificationInputSchema = z.object({
	title: z.string().trim().min(1).max(80),
	body: z.string().trim().max(180).optional(),
	showWhenFocused: z.boolean().optional(),
});

export type NotificationPermissionStatus = z.infer<
	typeof notificationPermissionStatusSchema
>;

export type NotificationPermissionState = {
	desktopEnabled: boolean;
	status: NotificationPermissionStatus;
	supported: boolean;
};

export type ShowNotificationInput = z.infer<typeof showNotificationInputSchema>;

export type ShowNotificationResult = {
	reason?: "disabled" | "focused" | "unsupported";
	shown: boolean;
};
