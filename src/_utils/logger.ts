const isDev = process.env.NODE_ENV === "development";

type LogArgs = unknown[]; // Accept any argument types

export const logger = {
	log: (...args: LogArgs) => {
		if (isDev) console.log(...args);
	},
	info: (...args: LogArgs) => {
		if (isDev) console.info(...args);
	},
	debug: (...args: LogArgs) => {
		if (isDev) console.debug(...args);
	},
	warn: (...args: LogArgs) => {
		// Always allow warnings, even in production
		console.warn(...args);
	},
	error: (...args: LogArgs) => {
		// Always allow errors, even in production
		console.error(...args);
	},
};
