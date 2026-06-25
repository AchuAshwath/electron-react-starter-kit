import { Button } from "@renderer/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@renderer/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@renderer/components/ui/field";
import { Input } from "@renderer/components/ui/input";
import { cn } from "@renderer/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

interface AuthFormProps extends ComponentProps<"div"> {
	mode?: "login" | "signup";
	onSuccess: () => Promise<void> | void;
	isLoading?: boolean;
	errorMessage?: string;
	returnTo?: string;
}

function AuthForm({
	className,
	mode = "login",
	onSuccess,
	isLoading = false,
	errorMessage,
	returnTo,
	...props
}: AuthFormProps) {
	const isSignup = mode === "signup";

	function runAuthAction(): void {
		void Promise.resolve(onSuccess()).catch(() => {
			// The caller owns the visible error state; this prevents a noisy rejected
			// promise when the auth provider reports a handled failure.
		});
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		runAuthAction();
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>
						{isSignup ? "Create your account" : "Login to your account"}
					</CardTitle>
					<CardDescription>
						{isSignup
							? "Enter your email below to create your account"
							: "Enter your email below to login to your account"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									autoComplete="email"
									disabled={isLoading}
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Password</FieldLabel>
									{isSignup ? null : (
										<button
											type="button"
											className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
										>
											Forgot your password?
										</button>
									)}
								</div>
								<Input
									id="password"
									type="password"
									autoComplete={isSignup ? "new-password" : "current-password"}
									disabled={isLoading}
									required
								/>
							</Field>
							<Field>
								<Button type="submit" disabled>
									{getPrimaryButtonLabel({ isLoading, isSignup })}
								</Button>
								<Button
									type="button"
									variant="outline"
									disabled={isLoading}
									onClick={runAuthAction}
								>
									{isLoading ? "Continuing..." : "Continue with device account"}
								</Button>
								{errorMessage ? (
									<p
										className="text-center text-sm text-destructive"
										role="alert"
									>
										{errorMessage}
									</p>
								) : (
									<FieldDescription className="text-center">
										{isSignup ? (
											<>
												Already have an account?{" "}
												<AuthModeLink mode="login" returnTo={returnTo} />
											</>
										) : (
											<>
												Don&apos;t have an account?{" "}
												<AuthModeLink mode="signup" returnTo={returnTo} />
											</>
										)}
									</FieldDescription>
								)}
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function getPrimaryButtonLabel({
	isLoading,
	isSignup,
}: {
	isLoading: boolean;
	isSignup: boolean;
}): string {
	if (isLoading) {
		return isSignup ? "Creating account..." : "Logging in...";
	}

	return isSignup ? "Create account" : "Login";
}

function AuthModeLink({
	mode,
	returnTo,
}: {
	mode: "login" | "signup";
	returnTo?: string;
}) {
	return (
		<Link
			to={mode === "login" ? "/login" : "/signup"}
			search={returnTo ? { returnTo } : {}}
			className="font-medium underline-offset-4 hover:underline"
		>
			{mode === "login" ? "Login" : "Sign up"}
		</Link>
	);
}

export { AuthForm };
