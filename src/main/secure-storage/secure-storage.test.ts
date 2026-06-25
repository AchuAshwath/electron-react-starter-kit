import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecureStorage, SecureStorageError } from "./secure-storage";

type TestStoreState = {
	secrets?: Record<string, string>;
};

function createSecureStorageTestDouble({
	isEncryptionAvailable = true,
}: {
	isEncryptionAvailable?: boolean;
} = {}) {
	const state: TestStoreState = { secrets: {} };
	const backend = {
		isEncryptionAvailable: vi.fn(() => isEncryptionAvailable),
		encryptString: vi.fn((plainText: string) =>
			Buffer.from(`encrypted:${plainText}`, "utf8"),
		),
		decryptString: vi.fn((encrypted: Buffer) => {
			const value = encrypted.toString("utf8");

			if (!value.startsWith("encrypted:")) {
				throw new Error("decrypt failed");
			}

			return value.replace("encrypted:", "");
		}),
	};
	const store = {
		get: vi.fn((key: "secrets") => state[key]),
		set: vi.fn((key: "secrets", value: Record<string, string>) => {
			state[key] = value;
		}),
		delete: vi.fn((key: "secrets") => {
			delete state[key];
		}),
	};
	const storage = new SecureStorage({ backend, store });

	return { backend, state, storage, store };
}

describe("SecureStorage", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("encrypts, stores, reads, and decrypts a value", () => {
		const { backend, storage } = createSecureStorageTestDouble();

		storage.set("auth:dev:credential", "secret-value");

		expect(storage.get("auth:dev:credential")).toBe("secret-value");
		expect(backend.encryptString).toHaveBeenCalledWith("secret-value");
		expect(backend.decryptString).toHaveBeenCalledTimes(1);
	});

	it("returns null for missing values", () => {
		const { storage } = createSecureStorageTestDouble();

		expect(storage.get("missing")).toBeNull();
	});

	it("deletes one value without dropping other secrets", () => {
		const { storage } = createSecureStorageTestDouble();

		storage.set("auth:dev:credential", "secret-value");
		storage.set("app:api-key", "api-key");
		storage.delete("auth:dev:credential");

		expect(storage.get("auth:dev:credential")).toBeNull();
		expect(storage.get("app:api-key")).toBe("api-key");
	});

	it("returns null for unreadable values without deleting stored data", () => {
		const { state, storage } = createSecureStorageTestDouble();
		const unreadableValue = Buffer.from("corrupt", "utf8").toString("base64");
		state.secrets = {
			"auth:dev:credential": unreadableValue,
		};

		expect(storage.get("auth:dev:credential")).toBeNull();
		expect(state.secrets).toEqual({
			"auth:dev:credential": unreadableValue,
		});
	});

	it("throws a safe error when encryption is unavailable", () => {
		const { backend, storage } = createSecureStorageTestDouble({
			isEncryptionAvailable: false,
		});

		expect(() => storage.set("auth:dev:credential", "secret-value")).toThrow(
			SecureStorageError,
		);
		expect(backend.encryptString).not.toHaveBeenCalled();
	});

	it("throws a safe error when encryption fails", () => {
		const { backend, storage } = createSecureStorageTestDouble();
		backend.encryptString.mockImplementation(() => {
			throw new Error("raw encryption failure");
		});

		expect(() => storage.set("auth:dev:credential", "secret-value")).toThrow(
			"Secure storage failed.",
		);
	});
});
