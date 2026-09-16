import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import React from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
	theme: Theme;
	isDark: boolean;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "light",
	isDark: false,
	toggleTheme: () => {},
	setTheme: () => {},
});

function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = localStorage.getItem("gp-theme") as Theme | null;
	if (stored) return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		const current = getInitialTheme();
		setThemeState(current);
		document.documentElement.classList.toggle("dark", current === "dark");

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem("gp-theme")) {
				const newTheme = e.matches ? "dark" : "light";
				setThemeState(newTheme);
				document.documentElement.classList.toggle(
					"dark",
					newTheme === "dark"
				);
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem("gp-theme", newTheme);
		document.documentElement.classList.toggle(
			"dark",
			newTheme === "dark"
		);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeState((prev) => {
			const next = prev === "dark" ? "light" : "dark";
			localStorage.setItem("gp-theme", next);
			document.documentElement.classList.toggle("dark", next === "dark");
			return next;
		});
	}, []);

	return React.createElement(
		ThemeContext.Provider,
		{ value: { theme, isDark: theme === "dark", toggleTheme, setTheme } },
		children
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
