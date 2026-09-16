import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupStep1Schema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	gender: z.enum(["MALE", "FEMALE", "NOT_SPECIFIED"]).default("NOT_SPECIFIED"),
});

export const signupStep2Schema = z.object({
	email: z.string().email("Please enter a valid email address"),
	phoneNumber: z
		.string()
		.min(1, "Phone number is required")
		.min(10, "Phone number must have at least 10 digits"),
});

export const signupSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.string().email("Please enter a valid email address"),
		phoneNumber: z
			.string()
			.min(1, "Phone number is required")
			.min(10, "Phone number must have at least 10 digits"),
		gender: z.enum(["MALE", "FEMALE", "NOT_SPECIFIED"]).default("NOT_SPECIFIED"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Must contain uppercase, lowercase, and a number"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const forgotPasswordSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Password must contain at least one uppercase letter, one lowercase letter, and one number"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const setupPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Password must contain at least one uppercase letter, one lowercase letter, and one number"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const verifyAccountSchema = z.object({
	email: z.string().email("Invalid email"),
	otp: z.string().min(4, "OTP must be at least 4 characters").max(6, "OTP must be at most 6 characters"),
});

export const resetPasswordFormSchema = z
	.object({
		email: z.string().email("Invalid email"),
		otp: z.string().min(4).max(6),
		newPassword: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type SetupPasswordFormData = z.infer<typeof setupPasswordSchema>;
export type VerifyAccountFormData = z.infer<typeof verifyAccountSchema>;
export type ResetPasswordOtpFormData = z.infer<typeof resetPasswordFormSchema>;
