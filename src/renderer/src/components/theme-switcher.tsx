import { Moon, Sun } from "lucide-react";
import { Button } from "ui/button";
import { useThemeContext } from "../core/theme/theme-provider";

export function ThemeSwitcher() {
	const { theme, setTheme, isChangingTheme } = useThemeContext();
	const isDark = theme?.resolvedTheme === "dark";
	const nextTheme = isDark ? "light" : "dark";

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label={`Switch to ${nextTheme} theme`}
			title={`Switch to ${nextTheme} theme`}
			disabled={isChangingTheme}
			className="relative rounded-lg"
			onClick={() => setTheme(nextTheme)}
		>
			<Sun
				aria-hidden="true"
				className="absolute size-4 transition-[opacity,transform] duration-200 ease-out dark:scale-75 dark:-rotate-45 dark:opacity-0"
			/>
			<Moon
				aria-hidden="true"
				className="absolute size-4 scale-75 rotate-45 opacity-0 transition-[opacity,transform] duration-200 ease-out dark:scale-100 dark:rotate-0 dark:opacity-100"
			/>
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
