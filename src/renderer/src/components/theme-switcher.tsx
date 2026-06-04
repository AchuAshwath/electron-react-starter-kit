import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "ui/button";
import type { ThemePreference } from "../core/theme/theme.types";
import { useThemeContext } from "../core/theme/theme-provider";

const themeOptions: Array<{
	value: ThemePreference;
	label: string;
	icon: typeof Monitor;
}> = [
	{ value: "system", label: "System", icon: Monitor },
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
];

export function ThemeSwitcher() {
	const { theme, setTheme, isChangingTheme } = useThemeContext();

	return (
		<div
			className="inline-flex h-8 items-center rounded-lg border border-border bg-background p-0.5"
			aria-label="Theme preference"
			role="radiogroup"
		>
			{themeOptions.map(({ value, label, icon: Icon }) => {
				const isSelected = theme?.preference === value;

				return (
					<Button
						key={value}
						type="button"
						variant={isSelected ? "secondary" : "ghost"}
						size="icon-sm"
						aria-label={`Use ${label.toLowerCase()} theme`}
						aria-checked={isSelected}
						disabled={isChangingTheme}
						role="radio"
						title={label}
						onClick={() => setTheme(value)}
					>
						<Icon className="size-3.5" aria-hidden="true" />
						<span className="sr-only">{label}</span>
					</Button>
				);
			})}
		</div>
	);
}
