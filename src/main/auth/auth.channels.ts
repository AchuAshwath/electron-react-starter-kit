export const authIpcChannels = {
	getSession: "auth:get-session",
	refreshSession: "auth:refresh-session",
	signIn: "auth:sign-in",
	signOut: "auth:sign-out",
} as const;
