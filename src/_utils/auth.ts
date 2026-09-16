import { User } from "@/types";

export const authAPI = {
	// login: async (email: string, password: string): Promise<User> => {
	// 	await new Promise((resolve) => setTimeout(resolve, 1500));

	// 	// Simulate login validation
	// 	if (email === "admin@example.com" && password === "Password@1") {
	// 		return {
	// 			id: "1",
	// 			email,
	// 			firstName: "Admin",
	// 			lastName: "John",
	// 			isVerified: true,
	// 			role: "admin",
	// 			createdAt: new Date().toISOString(),
	// 		};
	// 	}
	// 	if (email === "user@example.com" && password === "Password@1") {
	// 		return {
	// 			id: "1",
	// 			email,
	// 			firstName: "User",
	// 			lastName: "Daniel",
	// 			isVerified: true,
	// 			role: "user",
	// 			createdAt: new Date().toISOString(),
	// 		};
	// 	}

	// 	throw new Error("Invalid email or password");
	// },

	signup: async (data: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
	}): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Simulate email already exists check
		if (data.email === "existing@example.com") {
			throw new Error("An account with this email already exists");
		}

		// Simulate successful signup
		return;
	},

	forgotPassword: async (email: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Simulate sending reset email
		if (email === "nonexistent@example.com") {
			throw new Error("No account found with this email address");
		}

		return;
	},

	resetPassword: async (token: string, password: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Simulate token validation
		if (token === "invalid-token") {
			throw new Error("Invalid or expired reset token");
		}

		return;
	},

	setupPassword: async (token: string, password: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Simulate token validation
		if (token === "invalid-token") {
			throw new Error("Invalid or expired setup token");
		}

		return;
	},
};
