import { z } from "zod";

export type AuthUser = {
	id: string;
	name: string;
	username?: string;
	provider: string;
};

export type AuthSession = {
	user: AuthUser;
	issuedAt: string;
	expiresAt?: string;
};

export const authSignInRequestSchema = z.object({
	strategy: z.enum(["device", "microsoft"]),
});

export type AuthSignInRequest = z.infer<typeof authSignInRequestSchema>;

export type AuthProvider = {
	id: string;
	getSession: () => Promise<AuthSession | null>;
	signIn: (request: AuthSignInRequest) => Promise<AuthSession>;
	refreshSession: () => Promise<AuthSession | null>;
	signOut: () => Promise<void>;
};
