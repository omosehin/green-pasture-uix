import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"DM Sans"', "system-ui", "sans-serif"],
				display: ['"Fraunces"', "Georgia", "serif"],
			},
			colors: {
				// Brand primary — re-anchored on Deep Teal #103630
				primary: {
					DEFAULT: "#1f6554",
					50: "#eef7f4",
					100: "#d4ebe4",
					200: "#aad7ca",
					300: "#76bba8",
					400: "#469a85",
					500: "#2a7e69",
					600: "#1f6554",
					700: "#184e42",
					800: "#143f37",
					900: "#103630",
				},
				// Brand accent — Lime Green #9ACA3C
				lime: {
					DEFAULT: "#9aca3c",
					50: "#f4fae8",
					100: "#e6f3ca",
					200: "#d2e9a0",
					300: "#bbdd72",
					400: "#a7d44f",
					500: "#9aca3c",
					600: "#7fac2d",
					700: "#608123",
					800: "#4c651f",
					900: "#40531e",
				},
				// Brand soft background — Pale Mint (cream)
				mint: {
					DEFAULT: "#f6f8eb",
					50: "#fbfcf4",
					100: "#eef2da",
					200: "#e0e8c9",
					300: "#cbd8a9",
				},
				// Brand deep neutral — Brown #261711
				brown: {
					DEFAULT: "#261711",
					700: "#3a261d",
					800: "#2f1d15",
				},
				surface: {
					DEFAULT: "#ffffff",
					variant: "#f6f8eb",
					container: "#eef2da",
				},
				"on-surface": {
					DEFAULT: "#10231f",
					variant: "#3f5a53",
				},
				outline: {
					DEFAULT: "#a9bfb7",
					variant: "#dce6df",
				},
				error: {
					DEFAULT: "#dc2626",
					50: "#fef2f2",
					100: "#fee2e2",
					600: "#dc2626",
					700: "#b91c1c",
				},
				tertiary: {
					DEFAULT: "#f59e0b",
					50: "#fffbeb",
					100: "#fef3c7",
					600: "#d97706",
				},
			},
			boxShadow: {
				"elevation-0": "none",
				"elevation-1":
					"0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
				"elevation-2":
					"0 4px 8px -1px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
				"elevation-3":
					"0 10px 20px -3px rgb(0 0 0 / 0.14), 0 4px 8px -4px rgb(0 0 0 / 0.10)",
				"elevation-4":
					"0 20px 30px -5px rgb(0 0 0 / 0.16), 0 8px 12px -6px rgb(0 0 0 / 0.10)",
			},
			borderRadius: {
				"radius-sm": "8px",
				"radius-md": "12px",
				"radius-lg": "16px",
				"radius-xl": "24px",
			},
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				"fade-up": {
					"0%": { opacity: "0", transform: "translateY(16px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"slide-in-right": {
					"0%": { opacity: "0", transform: "translateX(24px)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				"slide-in-left": {
					"0%": { opacity: "0", transform: "translateX(-24px)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				"scale-in": {
					"0%": { opacity: "0", transform: "scale(0.9)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "-200% 0" },
					"100%": { backgroundPosition: "200% 0" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-12px)" },
				},
				"pulse-soft": {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0.7" },
				},
			},
			animation: {
				"fade-in": "fade-in 0.4s ease-out",
				"fade-up": "fade-up 0.5s ease-out",
				"slide-in-right": "slide-in-right 0.4s ease-out",
				"slide-in-left": "slide-in-left 0.4s ease-out",
				"scale-in": "scale-in 0.3s ease-out",
				shimmer: "shimmer 2s infinite linear",
				float: "float 3s ease-in-out infinite",
				"pulse-soft": "pulse-soft 2s ease-in-out infinite",
			},
		},
		container: {
			center: true,
			padding: {
				DEFAULT: "1rem",
				sm: "1.5rem",
				lg: "2rem",
			},
			screens: {
				sm: "640px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
				"2xl": "1400px",
			},
		},
	},
	plugins: [],
};

export default config;
