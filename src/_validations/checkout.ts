import { z } from "zod";

export const checkoutSchema = z.object({
	customer: z.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.string().email("Invalid email address"),
		phone: z.string().min(10, "Phone number must be at least 10 digits"),
	}),
	shippingAddress: z.object({
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State is required"),
		zipCode: z.string().min(5, "Zip code must be at least 5 digits"),
		country: z.string().min(1, "Country is required"),
	}),
	billingAddress: z.object({
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State is required"),
		zipCode: z.string().min(5, "Zip code must be at least 5 digits"),
		country: z.string().min(1, "Country is required"),
	}),
	sameAsShipping: z.boolean().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
