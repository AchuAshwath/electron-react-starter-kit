import { z } from "zod";

export type AuthUser = {
	id: string;
	name: string;
	displayName: string;
	email?: string;
	username?: string;
	tenantId?: string;
	provider: "microsoft";
	providerLabel: "Microsoft 365";
};

export type AuthSession = {
	user: AuthUser;
	issuedAt: string;
	expiresAt?: string;
};

export const authSignInRequestSchema = z.object({
	strategy: z.literal("microsoft"),
});

export type AuthSignInRequest = z.infer<typeof authSignInRequestSchema>;

export type AuthProvider = {
	id: string;
	getSession: () => Promise<AuthSession | null>;
	signIn: (request: AuthSignInRequest) => Promise<AuthSession>;
	refreshSession: () => Promise<AuthSession | null>;
	signOut: () => Promise<void>;
};
