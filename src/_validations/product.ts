import { z } from "zod";

export const createItemSchema = z.object({
	productId: z.coerce.number().positive("Product category is required"),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	price: z.coerce.number().positive("Price must be positive"),
	unit: z.coerce.number().int().positive("Unit must be a positive integer"),
});

export type CreateItemFormData = z.infer<typeof createItemSchema>;
