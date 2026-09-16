import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Search query and filters live in the URL now (see useProductFilters /
// SearchBar). This slice keeps only session search history and suggestions.
interface SearchState {
	recentSearches: string[];
	suggestions: string[];
}

const initialState: SearchState = {
	recentSearches: [],
	suggestions: [],
};

const searchSlice = createSlice({
	name: "search",
	initialState,
	reducers: {
		addRecentSearch: (state, action: PayloadAction<string>) => {
			const query = action.payload.trim();
			if (query && !state?.recentSearches?.includes(query)) {
				state.recentSearches = [
					query,
					...(state?.recentSearches?.slice(0, 4) || []),
				];
			}
		},
		clearRecentSearches: (state) => {
			state.recentSearches = [];
		},
		setSuggestions: (state, action: PayloadAction<string[]>) => {
			state.suggestions = action.payload;
		},
	},
});

export const { addRecentSearch, clearRecentSearches, setSuggestions } =
	searchSlice.actions;

export default searchSlice.reducer;
