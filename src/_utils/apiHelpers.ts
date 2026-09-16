import axios from "axios";

export function extractErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		return (
			error.response?.data?.message ||
			error.message ||
			"An unexpected error occurred"
		);
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "An unexpected error occurred";
}

export function buildPaginationParams(
	page = 1,
	limit = 10,
	search?: string,
	filter?: string
): string {
	const params = new URLSearchParams();
	params.set("page", String(page));
	params.set("limit", String(limit));
	if (search) params.set("search", search);
	if (filter) params.set("filter", filter);
	return params.toString();
}
