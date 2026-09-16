import { z } from "zod";

export const reviewSchema = z.object({
	rating: z.number().int().min(1, "Rating is required").max(5),
	comment: z.string().optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
