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

export type AuthProvider = {
	getSession: () => Promise<AuthSession | null>;
	signIn: () => Promise<AuthSession>;
	signOut: () => Promise<void>;
};
