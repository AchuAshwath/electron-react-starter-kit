import { safeStorage } from "electron";
import Store from "electron-store";

type SecureStorageSchema = {
	secrets: Record<string, string>;
};

type SecureStorageBackend = Pick<
	Electron.SafeStorage,
	"decryptString" | "encryptString" | "isEncryptionAvailable"
>;

type SecureStorageStore = {
	get: (key: "secrets") => Record<string, string> | undefined;
	set: (key: "secrets", value: Record<string, string>) => void;
	delete: (key: "secrets") => void;
};

type SecureStorageOptions = {
	backend?: SecureStorageBackend;
	store?: SecureStorageStore;
};

export class SecureStorageError extends Error {
	constructor(message = "Secure storage failed.") {
		super(message);
		this.name = "SecureStorageError";
	}
}

let defaultStore: Store<SecureStorageSchema> | null = null;

function getDefaultStore(): Store<SecureStorageSchema> {
	defaultStore ??= new Store<SecureStorageSchema>({
		defaults: {
			secrets: {},
		},
		name: "secure-storage",
	});

	return defaultStore;
}

export class SecureStorage {
	private readonly backend: SecureStorageBackend;
	private readonly store?: SecureStorageStore;

	constructor({ backend = safeStorage, store }: SecureStorageOptions = {}) {
		this.backend = backend;
		this.store = store;
	}

	get(key: string): string | null {
		const encryptedValue = this.getSecrets()[key];

		if (!encryptedValue) {
			return null;
		}

		try {
			return this.backend.decryptString(Buffer.from(encryptedValue, "base64"));
		} catch {
			return null;
		}
	}

	set(key: string, value: string): void {
		if (!this.backend.isEncryptionAvailable()) {
			throw new SecureStorageError("Secure storage is unavailable.");
		}

		try {
			const encryptedValue = this.backend
				.encryptString(value)
				.toString("base64");
			const secrets = this.getSecrets();

			this.getStore().set("secrets", {
				...secrets,
				[key]: encryptedValue,
			});
		} catch {
			throw new SecureStorageError();
		}
	}

	delete(key: string): void {
		const { [key]: _deleted, ...remainingSecrets } = this.getSecrets();

		this.getStore().set("secrets", remainingSecrets);
	}

	clear(): void {
		this.getStore().delete("secrets");
	}

	private getSecrets(): Record<string, string> {
		return this.getStore().get("secrets") ?? {};
	}

	private getStore(): SecureStorageStore {
		return this.store ?? getDefaultStore();
	}
}

export const secureStorage = new SecureStorage();
